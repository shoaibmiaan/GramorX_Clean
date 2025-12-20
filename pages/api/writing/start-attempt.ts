import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabaseServer';

const Body = z.object({
  mode: z.enum(['academic', 'general']),
  durationSeconds: z.number().int().positive().optional(), // default 3600
});

type StartAttemptResponse =
  | { ok: true; attemptId: string; mode: 'academic' | 'general'; status: 'created'; startedAt: string; durationSeconds: number }
  | { ok: false; error: string; details?: unknown };

export default async function handler(req: NextApiRequest, res: NextApiResponse<StartAttemptResponse>) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const parse = Body.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ ok: false, error: 'Invalid body', details: parse.error.flatten() });

  const { mode, durationSeconds } = parse.data;
  const supabase = getServerClient(req, res);

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr) return res.status(401).json({ ok: false, error: 'Unauthorized' });
  const user = auth.user;
  if (!user) return res.status(401).json({ ok: false, error: 'Unauthorized' });

  const dur = durationSeconds ?? 3600;

  // 1) Create attempt
  const { data: attempt, error: attemptErr } = await supabase
    .from('writing_attempts')
    .insert({
      user_id: user.id,
      mode,
      status: 'created',
      duration_seconds: dur,
      remaining_seconds: dur,
    })
    .select('id, mode, status, started_at, duration_seconds')
    .single();

  if (attemptErr || !attempt) {
    return res.status(500).json({ ok: false, error: 'Failed to create attempt', details: attemptErr });
  }

  // 2) Pre-create Task 1 & 2 answer rows (empty)
  const { error: ansErr } = await supabase.from('writing_attempt_answers').insert([
    { attempt_id: attempt.id, task_number: 1, answer_text: '', word_count: 0 },
    { attempt_id: attempt.id, task_number: 2, answer_text: '', word_count: 0 },
  ]);

  if (ansErr) {
    return res.status(500).json({ ok: false, error: 'Failed to create answer rows', details: ansErr });
  }

  return res.status(200).json({
    ok: true,
    attemptId: attempt.id,
    mode: attempt.mode,
    status: 'created',
    startedAt: attempt.started_at,
    durationSeconds: attempt.duration_seconds,
  });
}
