import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabaseServer';

const Answer = z.object({
  questionId: z.string().uuid(),
  value: z.string().trim(),
});

const Body = z.object({
  attemptId: z.string().uuid(),
  answers: z.array(Answer).optional(), // we also pull from attempts_listening_answers
});

type SubmitResponse = {
  raw_score: number;
  total_questions: number;
  band_score: number | null;
};

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function mapRawToBand(raw: number, total: number): number | null {
  if (total <= 0) return null;
  const pct = raw / total;

  if (pct >= 0.95) return 9;
  if (pct >= 0.9) return 8.5;
  if (pct >= 0.85) return 8;
  if (pct >= 0.8) return 7.5;
  if (pct >= 0.75) return 7;
  if (pct >= 0.7) return 6.5;
  if (pct >= 0.6) return 6;
  if (pct >= 0.5) return 5.5;
  if (pct >= 0.4) return 5;
  if (pct >= 0.3) return 4.5;
  return 4;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SubmitResponse | { error: string; details?: unknown }>,
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

  // 1) Load attempt + test
  const { data: attempt, error: attemptError } = await supabase
    .from('listening_attempts')
    .select('id, user_id, test_id, status')
    .eq('id', attemptId)
    .maybeSingle();

  if (attemptError || !attempt || attempt.user_id !== user.id) {
    console.error('[submit-final] attempt error', attemptError);
    return res.status(404).json({ error: 'Attempt not found' });
  }

  if (attempt.status === 'completed') {
    // Idempotent: just return existing scores if present
    const { data: existing, error: existingError } = await supabase
      .from('listening_attempts')
      .select('raw_score, total_questions, band_score')
      .eq('id', attemptId)
      .maybeSingle();

    if (!existingError && existing) {
      return res.status(200).json({
        raw_score: (existing.raw_score as number) ?? 0,
        total_questions: (existing.total_questions as number) ?? 40,
        band_score: (existing.band_score as number | null) ?? null,
      });
    }
  }

  // 2) Persist latest answers if provided
  if (answers && answers.length > 0) {
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
      console.error('[submit-final] upsert answers error', upsertError);
      return res.status(500).json({ error: 'Failed to save answers' });
    }
  }

  // 3) Load all answers for this attempt
  const { data: savedAnswers, error: answersError } = await supabase
    .from('attempts_listening_answers')
    .select('question_id, value')
    .eq('attempt_id', attemptId);

  if (answersError) {
    console.error('[submit-final] load answers error', answersError);
    return res.status(500).json({ error: 'Failed to load answers' });
  }

  const answerMap = new Map<string, string>();
  for (const row of savedAnswers ?? []) {
    const qid = row.question_id as string;
    const value = (row.value as string) ?? '';
    answerMap.set(qid, value);
  }

  // 4) Load questions for this test
  const { data: questions, error: questionsError } = await supabase
    .from('listening_questions')
    .select('id, correct_answer')
    .eq('test_id', attempt.test_id);

  if (questionsError) {
    console.error('[submit-final] questions error', questionsError);
    return res.status(500).json({ error: 'Failed to load questions' });
  }

  let rawScore = 0;
  const totalQuestions = questions?.length ?? 0;

  for (const q of questions ?? []) {
    const qid = q.id as string;
    const userValue = answerMap.get(qid);
    if (!userValue) continue;

    let correctStr: string | null = null;
    const ca = q.correct_answer as unknown;

    if (Array.isArray(ca) && ca.length > 0) {
      correctStr = String(ca[0]);
    } else if (typeof ca === 'string') {
      correctStr = ca;
    } else if (ca && typeof ca === 'object' && 'value' in (ca as any)) {
      correctStr = String((ca as any).value);
    }

    if (!correctStr) continue;

    if (normalizeAnswer(userValue) === normalizeAnswer(correctStr)) {
      rawScore += 1;
    }
  }

  const bandScore = mapRawToBand(rawScore, totalQuestions);

  // 5) Update attempt with final scores
  const { error: updateError } = await supabase
    .from('listening_attempts')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      raw_score: rawScore,
      total_questions: totalQuestions,
      band_score: bandScore,
    })
    .eq('id', attemptId)
    .eq('user_id', user.id);

  if (updateError) {
    console.error('[submit-final] update attempt error', updateError);
  }

  return res.status(200).json({
    raw_score: rawScore,
    total_questions: totalQuestions,
    band_score: bandScore,
  });
}
