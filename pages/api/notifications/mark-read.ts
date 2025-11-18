import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';

const BodySchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

type ResponsePayload = { ok: true };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponsePayload | { error: string }>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const supabase = getServerClient(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const parsed = BodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'invalid_body' });
  }

  const { ids } = parsed.data;

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .in('id', ids);

  if (error) {
    console.error('[notifications.mark-read] update failed', error);
    return res.status(500).json({ error: 'failed_to_update' });
  }

  return res.status(200).json({ ok: true });
}
