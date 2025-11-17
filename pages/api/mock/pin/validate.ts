import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { createSupabaseServerClient } from '@/lib/supabaseServer';

const bodySchema = z.object({
  pin: z.string().min(3, 'PIN is required').max(64, 'PIN is too long'),
  module: z.string().min(2).optional(),
  testSlug: z.string().min(1).optional(),
});

type MockPinRow = {
  id: string;
  pin: string;
  user_id: string | null;
  module: string | null;
  test_slug: string | null;
  max_uses: number | null;
  usage_count: number | null;
  expires_at: string | null;
  status: string | null;
};

type MockSessionRow = {
  id: string;
  user_id: string;
  module: string;
  test_slug: string;
  pin_id: string | null;
  started_at: string;
  status: string;
};

export type PinValidateResponse =
  | { ok: true; sessionId: string; module: string; testSlug?: string | null; expiresAt?: string | null }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PinValidateResponse>,
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const parsed = bodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: parsed.error.errors[0]?.message ?? 'Invalid payload' });
  }

  const { pin, module: requestedModule, testSlug } = parsed.data;

  try {
    const userClient = createSupabaseServerClient({ req, res });
    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData?.user) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }

    const user = authData.user;
    const serviceClient = createSupabaseServerClient({ serviceRole: true });

    const { data: pins, error: pinError } = await serviceClient
      .from<MockPinRow>('mock_pins')
      .select('*')
      .eq('pin', pin)
      .eq('status', 'active')
      .limit(1);

    if (pinError) {
      console.error('mock-pin-query', pinError);
      return res.status(500).json({ ok: false, error: 'Unable to verify PIN at the moment.' });
    }

    const pinRow = pins?.[0];
    if (!pinRow) {
      return res.status(400).json({ ok: false, error: 'Invalid or expired PIN.' });
    }

    if (pinRow.user_id && pinRow.user_id !== user.id) {
      return res.status(403).json({ ok: false, error: 'PIN assigned to a different user.' });
    }

    const now = Date.now();
    if (pinRow.expires_at) {
      const expires = Date.parse(pinRow.expires_at);
      if (!Number.isNaN(expires) && expires < now) {
        return res.status(400).json({ ok: false, error: 'Invalid or expired PIN.' });
      }
    }

    const maxUses = typeof pinRow.max_uses === 'number' ? pinRow.max_uses : 1;
    const usageCount = typeof pinRow.usage_count === 'number' ? pinRow.usage_count : 0;
    if (usageCount >= maxUses) {
      return res.status(403).json({ ok: false, error: 'PIN usage limit reached.' });
    }

    if (pinRow.module && requestedModule && pinRow.module !== requestedModule) {
      return res.status(403).json({ ok: false, error: 'PIN is not valid for this module.' });
    }

    if (pinRow.test_slug && testSlug && pinRow.test_slug !== testSlug) {
      return res.status(403).json({ ok: false, error: 'PIN is not valid for this mock test.' });
    }

    const resolvedModule = requestedModule ?? pinRow.module ?? 'full';
    const resolvedTestSlug = pinRow.test_slug ?? testSlug ?? `${resolvedModule}-generic`;

    const { data: sessionData, error: sessionError } = await serviceClient
      .from<MockSessionRow>('mock_sessions')
      .insert({
        user_id: user.id,
        module: resolvedModule,
        test_slug: resolvedTestSlug,
        pin_id: pinRow.id,
        status: 'active',
      })
      .select('id, module, test_slug, started_at, status')
      .single();

    if (sessionError || !sessionData) {
      console.error('mock-session-create', sessionError);
      return res.status(500).json({ ok: false, error: 'Unable to start mock session. Try again.' });
    }

    const nextUsage = usageCount + 1;
    const updates: Partial<MockPinRow> = { usage_count: nextUsage };
    const shouldExpire = nextUsage >= maxUses;
    if (shouldExpire) {
      updates.status = 'expired';
    }

    const { error: updateError } = await serviceClient
      .from<MockPinRow>('mock_pins')
      .update(updates)
      .eq('id', pinRow.id);

    if (updateError) {
      console.error('mock-pin-update', updateError);
    }

    return res.status(200).json({
      ok: true,
      sessionId: sessionData.id,
      module: sessionData.module,
      testSlug: sessionData.test_slug,
      expiresAt: pinRow.expires_at,
    });
  } catch (error) {
    console.error('mock-pin-validate-fatal', error);
    return res.status(500).json({ ok: false, error: 'Unexpected server error.' });
  }
}
