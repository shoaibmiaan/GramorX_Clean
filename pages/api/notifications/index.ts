import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';

const BodySchema = z.object({
  action: z.literal('mark_all_read'),
});

type ResponseBody = { ok: true; updated: number } | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseBody>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const body = BodySchema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  const supabase = getServerClient(req, res);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString(), read: true, is_read: true })
    .eq('user_id', user.id)
    .is('read_at', null)
    .select('id');

  if (error) {
    console.error('[notifications/index] mark all failed', error);
    return res.status(500).json({ error: 'Failed to update notifications' });
  }

  return res.status(200).json({ ok: true, updated: data?.length ?? 0 });
}
