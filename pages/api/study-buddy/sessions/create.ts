// pages/api/study-buddy/sessions/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import { withPlan } from '@/lib/withPlan';

const Item = z.object({
  skill: z.string().min(2),
  minutes: z.number().int().min(1).max(120),
});

const Body = z.object({
  items: z.array(Item).min(1).max(5),
});

type SessionItem = z.infer<typeof Item>;

type StudySession = {
  id: string;
  user_id: string;
  items: SessionItem[];
  state: 'pending' | 'started' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string | null;
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = getServerClient(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const parse = Body.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid body', details: parse.error.flatten() });
  }

  const payload = parse.data.items.map((d) => ({ ...d, minutes: Number(d.minutes) }));

  // Insert session with server-side ownership
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: user.id,
      items: payload,
      state: 'pending',
    })
    .select('*')
    .single<StudySession>();

  if (error) {
    return res.status(500).json({ error: 'insert_failed', details: error.message });
  }

  return res.status(200).json({ ok: true, session: data });
}

// Guard by plan/role (adjust plan if needed)
export default withPlan('free', handler, { allowRoles: ['admin', 'teacher'] });
