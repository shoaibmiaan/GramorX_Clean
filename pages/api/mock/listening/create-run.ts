import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabaseServer';

const Body = z.object({
  slug: z.string(),
  mode: z.enum(['mock', 'practice']).default('mock').optional(),
});

type CreateRunResponse = {
  attemptId: string;
  testId: string;
  durationSeconds: number | null;
  answers: { questionId: string; value: string }[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CreateRunResponse | { error: string; details?: unknown }>,
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

  const { slug, mode } = parse.data;

  // 1) Find test
  const { data: test, error: testError } = await supabase
    .from('listening_tests')
    .select('id, duration_seconds')
    .eq('slug', slug)
    .maybeSingle();

  if (testError || !test) {
    console.error('[create-run] listening_tests error', testError);
    return res.status(404).json({ error: 'Test not found' });
  }

  // 2) Check if there's an existing in-progress attempt
  const { data: existingAttempt, error: existingError } = await supabase
    .from('listening_attempts')
    .select('id')
    .eq('user_id', user.id)
    .eq('test_id', test.id)
    .eq('mode', mode ?? 'mock')
    .eq('status', 'in_progress')
    .maybeSingle();

  let attemptId: string;

  if (existingError && existingError.code !== 'PGRST116') {
    console.error('[create-run] existingAttempt error', existingError);
  }

  if (existingAttempt) {
    attemptId = existingAttempt.id;
  } else {
    // 3) Create new attempt
    const { data: newAttempt, error: insertError } = await supabase
      .from('listening_attempts')
      .insert({
        user_id: user.id,
        test_id: test.id,
        mode: mode ?? 'mock',
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .maybeSingle();

    if (insertError || !newAttempt) {
      console.error('[create-run] insert attempt error', insertError);
      return res.status(500).json({ error: 'Failed to create attempt' });
    }

    attemptId = newAttempt.id;
  }

  // 4) Load any existing saved answers
  const { data: savedAnswers, error: answersError } = await supabase
    .from('attempts_listening_answers')
    .select('question_id, value')
    .eq('attempt_id', attemptId);

  if (answersError) {
    console.error('[create-run] answers load error', answersError);
  }

  const answers =
    savedAnswers?.map((row) => ({
      questionId: row.question_id as string,
      value: (row.value as string) ?? '',
    })) ?? [];

  return res.status(200).json({
    attemptId,
    testId: test.id,
    durationSeconds: test.duration_seconds ?? null,
    answers,
  });
}
