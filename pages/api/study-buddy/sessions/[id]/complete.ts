// pages/api/study-buddy/sessions/[id]/complete.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import { withPlan } from '@/lib/withPlan';

const Params = z.object({ id: z.string().uuid() });

type StudySession = {
  id: string;
  user_id: string;
  items: { skill: string; minutes: number }[];
  state: 'pending' | 'started' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string | null;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getServerClient(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const parse = Params.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid id', details: parse.error.flatten() });
  }

  const { id } = parse.data;

  const { data: session, error: fetchErr } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle<StudySession>();

  if (fetchErr) return res.status(500).json({ error: 'load_failed', details: fetchErr.message });
  if (!session) return res.status(404).json({ error: 'not_found' });
  if (session.user_id !== user.id) return res.status(403).json({ error: 'forbidden' });

  if (session.state === 'completed') {
    return res.status(200).json({ ok: true, session });
  }

  const now = new Date().toISOString();
  const { data: updated, error: updErr } = await supabase
    .from('study_sessions')
    .update({ state: 'completed', updated_at: now })
    .eq('id', id)
    .select('*')
    .single<StudySession>();

  if (updErr) return res.status(500).json({ error: 'update_failed', details: updErr.message });

  return res.status(200).json({ ok: true, session: updated });
}

export default withPlan('free', handler, { allowRoles: ['admin', 'teacher'] });
