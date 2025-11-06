// pages/api/study-buddy/sessions/[id]/progress.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import { withPlan } from '@/lib/withPlan';

const Params = z.object({ id: z.string().uuid() });

const Body = z.object({
  itemIndex: z.number().int().min(0),
  status: z.enum(['pending', 'started', 'completed']),
  note: z
    .string()
    .trim()
    .min(1)
    .max(240)
    .optional()
    .nullable(),
});

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

  const parseParams = Params.safeParse(req.query);
  if (!parseParams.success) {
    return res.status(400).json({ error: 'Invalid id', details: parseParams.error.flatten() });
  }
  const { id } = parseParams.data;

  const parseBody = Body.safeParse(req.body);
  if (!parseBody.success) {
    return res.status(400).json({ error: 'Invalid body', details: parseBody.error.flatten() });
  }
  const body = parseBody.data;

  const { data: session, error: fetchErr } = await supabase
    .from('study_buddy_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle<StudySession>();

  if (fetchErr) return res.status(500).json({ error: 'load_failed', details: fetchErr.message });
  if (!session) return res.status(404).json({ error: 'not_found' });
  if (session.user_id !== user.id) return res.status(403).json({ error: 'forbidden' });

  const items = normaliseItems(session.items);
  if (body.itemIndex >= items.length) {
    return res.status(400).json({ error: 'invalid_index' });
  }

  const target = items[body.itemIndex];
  const nextStatus = body.status;
  const updates: Record<string, any> = {};

  items[body.itemIndex] = {
    ...target,
    status: nextStatus,
    note: body.note ?? target.note ?? null,
  };

  if (nextStatus === 'started' && !session.started_at) {
    updates.started_at = new Date().toISOString();
  }

  let nextState = session.state;
  if (nextStatus === 'started' && session.state === 'pending') {
    nextState = 'started';
  }
  if (nextStatus === 'completed') {
    const allCompleted = items.every((item) => (item.status ?? 'pending') === 'completed');
    if (allCompleted) {
      nextState = 'completed';
      updates.ended_at = updates.ended_at ?? new Date().toISOString();
      const totalMinutes = items.reduce((sum, item) => sum + Number(item.minutes || 0), 0);
      updates.duration_minutes = totalMinutes;
      updates.xp_earned = totalMinutes * 4;
    }
  }

  updates.state = nextState;
  updates.items = items;

  const { data: updated, error: updateErr } = await supabase
    .from('study_buddy_sessions')
    .update(updates)
    .eq('id', id)
    .select('*')
    .single<StudySession>();

  if (updateErr) return res.status(500).json({ error: 'update_failed', details: updateErr.message });

  return res.status(200).json({ ok: true, session: { ...updated, items: normaliseItems(updated.items) } });
}

export default withPlan('free', handler, { allowRoles: ['admin', 'teacher'] });
