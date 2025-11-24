// pages/api/listening/mock/autosave.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabaseServer';

const BodySchema = z.object({
  attemptId: z.string().min(1),
  timeSpentSeconds: z.number().int().nonnegative(),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      value: z.union([z.string(), z.array(z.string())]),
    }),
  ),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = BodySchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid body' });
  const body = parse.data;

  const supabase = getServerClient(req, res);

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: attempt, error: attErr } = await supabase
    .from('attempts_listening')
    .select('id, user_id, mode, status')
    .eq('id', body.attemptId)
    .single();

  if (attErr || !attempt) return res.status(404).json({ error: 'Attempt not found' });
  if (attempt.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
  if (attempt.mode !== 'mock') return res.status(400).json({ error: 'Not a mock attempt' });
  if (attempt.status === 'submitted')
    return res.status(400).json({ error: 'Attempt already submitted' });

  if (body.answers.length > 0) {
    const rows = body.answers.map((a) => ({
      attempt_id: attempt.id,
      question_id: a.questionId,
      value: a.value,
      is_correct: null,
    }));

    const { error: upErr } = await supabase
      .from('attempts_listening_answers')
      .upsert(rows, { onConflict: 'attempt_id,question_id' });

    if (upErr) {
      console.error('[listening/mock/autosave] upsert failed', upErr);
      return res.status(500).json({ error: 'Failed to autosave answers' });
    }
  }

  const { error: tErr } = await supabase
    .from('attempts_listening')
    .update({ time_spent_seconds: body.timeSpentSeconds })
    .eq('id', attempt.id);

  if (tErr) {
    console.error('[listening/mock/autosave] time update failed', tErr);
    return res.status(500).json({ error: 'Failed to autosave time' });
  }

  return res.status(200).json({ ok: true });
}
