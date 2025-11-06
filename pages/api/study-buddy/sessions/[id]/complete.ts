// pages/api/study-buddy/sessions/[id]/complete.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import { withPlan } from '@/lib/withPlan';

const Params = z.object({ id: z.string().uuid() });

type SessionItem = {
  skill: string;
  minutes: number;
  topic?: string | null;
  status?: 'pending' | 'started' | 'completed';
  note?: string | null;
};

type StudySession = {
  id: string;
  user_id: string;
  items: SessionItem[];
  state: 'pending' | 'started' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_minutes: number | null;
  xp_earned: number;
};

function normaliseItems(items: SessionItem[]): SessionItem[] {
  return (items || []).map((item) => ({
    skill: item.skill,
    minutes: item.minutes,
    topic: item.topic ?? null,
    status: item.status ?? 'pending',
    note: item.note ?? null,
  }));
}

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
    .from('study_buddy_sessions')
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
  const items = normaliseItems(session.items).map((item) => ({
    ...item,
    status: 'completed',
  }));
  const totalMinutes = items.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
  const xpEarned = totalMinutes * 4; // simple XP heuristic

  const { data: updated, error: updErr } = await supabase
    .from('study_buddy_sessions')
    .update({
      state: 'completed',
      ended_at: now,
      started_at: session.started_at ?? now,
      duration_minutes: totalMinutes,
      items,
      xp_earned: xpEarned,
    })
    .eq('id', id)
    .select('*')
    .single<StudySession>();

  if (updErr) return res.status(500).json({ error: 'update_failed', details: updErr.message });

  return res.status(200).json({ ok: true, session: { ...updated, items: normaliseItems(updated.items) } });
}

export default withPlan('free', handler, { allowRoles: ['admin', 'teacher'] });
