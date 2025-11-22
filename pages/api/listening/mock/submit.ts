// pages/api/listening/mock/submit.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import { computeListeningBandFromRaw } from '@/lib/listening/analytics';

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
  started_at: string;
  submitted_at: string | null;
  raw_score: number | null;
  band_score: number | null;
  time_spent_seconds: number | null;
};

type QuestionRow = {
  id: string;
  test_id: string;
  max_score: number;
  correct_answers: string[];
};

type ListeningAttemptAnswerResponse = {
  questionId: string;
  value: string | string[];
  isCorrect: boolean;
  score: number;
};

type ListeningAttemptResponse = {
  id: string;
  testId: string;
  userId: string;
  mode: 'mock';
  status: 'submitted';
  startedAt: string;
  submittedAt: string | null;
  rawScore: number;
  bandScore: number;
  timeSpentSeconds: number;
  answers: ListeningAttemptAnswerResponse[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListeningAttemptResponse | { error: string }>,
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
    .select(
      'id, test_id, user_id, mode, status, started_at, submitted_at, raw_score, band_score, time_spent_seconds',
    )
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

  const { data: questionRows, error: questionsError } = await supabase
    .from('listening_questions')
    .select('id, test_id, max_score, correct_answers')
    .eq('test_id', attemptRow.test_id)
    .returns<QuestionRow[]>();

  if (questionsError || !questionRows) {
    return res.status(500).json({ error: 'Failed to load questions' });
  }

  const questionMap = new Map<string, QuestionRow>();
  questionRows.forEach((q) => {
    questionMap.set(q.id, q);
  });

  let rawScore = 0;
  const enrichedAnswers: ListeningAttemptAnswerResponse[] = body.answers.map((answer) => {
    const question = questionMap.get(answer.questionId);
    if (!question) {
      return {
        questionId: answer.questionId,
        value: answer.value,
        isCorrect: false,
        score: 0,
      };
    }

    const correctAnswersNormalized = question.correct_answers.map((a) => a.trim().toLowerCase());
    const valueArray = Array.isArray(answer.value) ? answer.value : [answer.value];
    const normalizedValues = valueArray.map((v) => v.trim().toLowerCase());

    const isCorrect =
      normalizedValues.length === correctAnswersNormalized.length &&
      normalizedValues.every((v) => correctAnswersNormalized.includes(v));

    const score = isCorrect ? question.max_score : 0;
    rawScore += score;

    return {
      questionId: answer.questionId,
      value: answer.value,
      isCorrect,
      score,
    };
  });

  const bandScore = computeListeningBandFromRaw(rawScore);

  const { error: answersInsertError } = await supabase
    .from('attempts_listening_answers')
    .insert(
      enrichedAnswers.map((a) => ({
        attempt_id: attemptRow.id,
        question_id: a.questionId,
        value: a.value,
        is_correct: a.isCorrect,
        score: a.score,
      })),
    );

  if (answersInsertError) {
    return res.status(500).json({ error: 'Failed to save answers' });
  }

  const { data: updatedAttempt, error: updateError } = await supabase
    .from('attempts_listening')
    .update({
      status: 'submitted',
      raw_score: rawScore,
      band_score: bandScore,
      time_spent_seconds: body.timeSpentSeconds,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', attemptRow.id)
    .select(
      'id, test_id, user_id, mode, status, started_at, submitted_at, raw_score, band_score, time_spent_seconds',
    )
    .single<AttemptRow>();

  if (updateError || !updatedAttempt) {
    return res.status(500).json({ error: 'Failed to update attempt' });
  }

  const response: ListeningAttemptResponse = {
    id: updatedAttempt.id,
    testId: updatedAttempt.test_id,
    userId: updatedAttempt.user_id,
    mode: 'mock',
    status: 'submitted',
    startedAt: updatedAttempt.started_at,
    submittedAt: updatedAttempt.submitted_at,
    rawScore: updatedAttempt.raw_score ?? 0,
    bandScore: updatedAttempt.band_score ?? 0,
    timeSpentSeconds: updatedAttempt.time_spent_seconds ?? body.timeSpentSeconds,
    answers: enrichedAnswers,
  };

  return res.status(200).json(response);
}
