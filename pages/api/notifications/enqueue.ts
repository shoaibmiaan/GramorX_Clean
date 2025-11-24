// pages/api/notifications/nudge.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';

const BodySchema = z.object({
  message: z.string().min(1),
  url: z.string().url().optional(),
  title: z.string().optional(),
  data: z.record(z.any()).optional(),
});

type SuccessResponse = { ok: true; id: string };
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

  const { message, url, title, data } = parse.data;

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

  const finalTitle = title ?? 'Reminder from GramorX';

  const { data: inserted, error: insertError } = await supabase
    .from('notifications')
    .insert({
      user_id: user.id,
      title: finalTitle,
      body: message,
      message,
      url: url ?? null,
      type: 'nudge',
      data: data ?? {},
      read: false,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('[notifications/nudge] insert failed', insertError);
    return res.status(500).json({ error: 'Failed to create nudge' });
  }

  return res.status(200).json({ ok: true, id: inserted!.id as string });
}
