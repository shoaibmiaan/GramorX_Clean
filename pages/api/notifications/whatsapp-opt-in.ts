// pages/api/notifications/whatsapp-opt-in.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';

const BodySchema = z.object({
  optIn: z.boolean(),
});

type SuccessResponse = { ok: true };
type ErrorResponse = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = BodySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid body' });
  }

  const { optIn } = parse.data;

  const supabase = getServerClient(req, res);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return res.status(500).json({ error: 'Failed to resolve current user' });
  }

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 1) Update opt-in table
  const { error: optInError } = await supabase.from('notifications_opt_in').upsert(
    {
      user_id: user.id,
      wa_opt_in: optIn,
      updated_at: new Date().toISOString(),
      // ensure WA channel is present/absent in `channels` array
      channels: optIn ? ['in_app', 'email', 'whatsapp'] : ['in_app', 'email'],
    },
    {
      onConflict: 'user_id',
    }
  );

  if (optInError) {
    console.error('[notifications/whatsapp-opt-in] opt-in upsert failed', optInError);
    return res.status(500).json({ error: 'Failed to update WhatsApp opt-in' });
  }

  // 2) Log consent event
  const { error: consentError } = await supabase.from('notification_consent_events').insert({
    user_id: user.id,
    actor_id: user.id,
    channel: 'whatsapp',
    action: optIn ? 'opt_in' : 'opt_out',
    metadata: {
      user_agent: req.headers['user-agent'] ?? null,
      ip:
        (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
        req.socket.remoteAddress ??
        null,
    },
  });

  if (consentError) {
    // Don’t block the main flow on audit log failure
    console.error('[notifications/whatsapp-opt-in] consent log failed', consentError);
  }

  return res.status(200).json({ ok: true });
}
