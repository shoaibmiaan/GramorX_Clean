// pages/api/study-buddy/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabaseServer';

const Params = z.object({ id: z.string().uuid() });

export default async function sessionIdHandler(req: NextApiRequest, res: NextApiResponse) {
  const parsed = Params.safeParse({ id: req.query.id });
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid id', details: parsed.error.flatten() });
  }
  const { id } = parsed.data;

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getServerClient(req, res);

  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) return res.status(500).json({ error: 'Auth error', details: userErr.message });
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // This route looks like an older alias of the session fetch.
  // We’ll point it to the canonical 'study_sessions'.
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Session not found' });

  if (data.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

  return res.status(200).json(data);
}
