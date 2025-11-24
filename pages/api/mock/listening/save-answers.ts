import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabaseServer';

const Answer = z.object({
  questionId: z.string().uuid(),
  value: z.string().trim(),
});

const Body = z.object({
  attemptId: z.string().uuid(),
  answers: z.array(Answer).min(1),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: true } | { error: string; details?: unknown }>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = Body.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      error: 'Invalid body',
      details: parse.error.flatten(),
    });
  }

  const supabase = getServerClient(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { attemptId, answers } = parse.data;

  // Ownership check
  const { data: attempt, error: attemptError } = await supabase
    .from('listening_attempts')
    .select('id')
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (attemptError || !attempt) {
    console.error('[save-answers] attempt error', attemptError);
    return res.status(404).json({ error: 'Attempt not found' });
  }

  const rows = answers.map((a) => ({
    attempt_id: attemptId,
    question_id: a.questionId,
    value: a.value,
    updated_at: new Date().toISOString(),
  }));

  const { error: upsertError } = await supabase
    .from('attempts_listening_answers')
    .upsert(rows, { onConflict: 'attempt_id,question_id' });

  if (upsertError) {
    console.error('[save-answers] upsert error', upsertError);
    return res.status(500).json({ error: 'Failed to save answers' });
  }

  return res.status(200).json({ ok: true });
}
