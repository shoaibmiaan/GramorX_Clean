// pages/api/listening/analytics/attempt-detail.ts
import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import type {
  ListeningBandSnapshot,
  ListeningQuestionTypeStats,
} from '@/lib/listening/types';

type AttemptRow = {
  id: string;
  test_id: string;
  user_id: string;
  mode: string;
  status: string;
  submitted_at: string | null;
  raw_score: number | null;
  band_score: number | null;
  listening_tests: {
    slug: string;
    total_score: number | null;
  } | null;
};

type AnswerRow = {
  question_id: string;
  is_correct: boolean | null;
  time_spent_seconds: number | null;
  listening_questions: {
    type: string;
  } | null;
};

type ResponseBody = {
  attempt: ListeningBandSnapshot;
  questionTypeStats: ListeningQuestionTypeStats[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody | { error: string }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const attemptId = req.query.attemptId as string | undefined;
  if (!attemptId) {
    return res.status(400).json({ error: 'Missing attemptId' });
  }

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

  const { data: attempt, error: attemptError } = await supabase
    .from('attempts_listening')
    .select(
      'id, test_id, user_id, mode, status, submitted_at, raw_score, band_score, listening_tests!inner(slug, total_score)',
    )
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .single<AttemptRow>();

  if (attemptError || !attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  const attemptSnapshot: ListeningBandSnapshot = {
    attemptId: attempt.id,
    testSlug: attempt.listening_tests?.slug ?? 'unknown',
    attemptedAt: attempt.submitted_at ?? new Date().toISOString(),
    mode: attempt.mode === 'mock' ? 'mock' : 'practice',
    rawScore: attempt.raw_score ?? 0,
    maxScore: attempt.listening_tests?.total_score ?? 40,
    bandScore: attempt.band_score ?? 0,
  };

  const { data: answers, error: answersError } = await supabase
    .from('attempts_listening_answers')
    .select(
      'question_id, is_correct, time_spent_seconds, listening_questions(type)',
    )
    .eq('attempt_id', attempt.id)
    .returns<AnswerRow[]>();

  if (answersError || !answers) {
    return res.status(500).json({ error: 'Failed to load answers' });
  }

  const statsMap = new Map<string, ListeningQuestionTypeStats>();

  for (const row of answers) {
    const typeRaw = row.listening_questions?.type;
    if (!typeRaw) continue;

    const typeKey = typeRaw as ListeningQuestionTypeStats['type'];

    if (!statsMap.has(typeKey)) {
      statsMap.set(typeKey, {
        type: typeKey,
        attempts: 0,
        correct: 0,
        accuracy: 0,
        avgTimeSeconds: null,
      });
    }

    const stat = statsMap.get(typeKey)!;
    stat.attempts += 1;
    if (row.is_correct) {
      stat.correct += 1;
    }

    if (row.time_spent_seconds != null) {
      const prevTotal = (stat.avgTimeSeconds ?? 0) * (stat.attempts - 1);
      const newAvg = (prevTotal + row.time_spent_seconds) / stat.attempts;
      stat.avgTimeSeconds = newAvg;
    }
  }

  const questionTypeStats: ListeningQuestionTypeStats[] = Array.from(statsMap.values()).map(
    (s) => ({
      ...s,
      accuracy: s.attempts > 0 ? s.correct / s.attempts : 0,
    }),
  );

  return res.status(200).json({
    attempt: attemptSnapshot,
    questionTypeStats,
  });
}
