// pages/api/listening/mock/autosave.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';

const AnswerSchema = z.object({
  questionId: z.string().min(1),
  value: z.union([z.string(), z.array(z.string())]),
});

const BodySchema = z.object({
  attemptId: z.string().min(1),
  answers: z.array(AnswerSchema),
  timeSpentSeconds: z.number().int().nonnegative(),
});

type Body = z.infer<typeof BodySchema>;

type AttemptRow = {
  id: string;
  test_id: string;
  user_id: string;
  mode: string;
  status: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: true } | { error: string }>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = BodySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid body' });
  }
  const body: Body = parse.data;

  const supabase = getServerClient(req, res);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: attemptRow, error: attemptError } = await supabase
    .from('attempts_listening')
    .select('id, test_id, user_id, mode, status')
    .eq('id', body.attemptId)
    .single<AttemptRow>();

  if (attemptError || !attemptRow) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  if (attemptRow.user_id !== user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (attemptRow.mode !== 'mock') {
    return res.status(400).json({ error: 'Attempt is not a mock attempt' });
  }

  if (attemptRow.status === 'submitted') {
    return res.status(400).json({ error: 'Attempt already submitted' });
  }

  // Upsert answers snapshot
  const { error: upsertError } = await supabase.from('attempts_listening_answers').upsert(
    body.answers.map((a) => ({
      attempt_id: attemptRow.id,
      question_id: a.questionId,
      value: a.value,
      // no correctness evaluation yet
    })),
    {
      onConflict: 'attempt_id,question_id',
    },
  );

  if (upsertError) {
    return res.status(500).json({ error: 'Failed to autosave answers' });
  }

  const { error: updateError } = await supabase
    .from('attempts_listening')
    .update({
      time_spent_seconds: body.timeSpentSeconds,
    })
    .eq('id', attemptRow.id);

  if (updateError) {
    return res.status(500).json({ error: 'Failed to autosave attempt meta' });
  }

  return res.status(200).json({ ok: true });
}
