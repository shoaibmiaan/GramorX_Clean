// pages/api/listening/analytics/summary.ts
import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import type {
  ListeningAnalyticsSummary,
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
  time_spent_seconds: number | null;
  listening_tests: {
    slug: string;
    total_score: number | null;
  } | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ summary: ListeningAnalyticsSummary } | { error: string }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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

  const { data: attempts, error: attemptsError } = await supabase
    .from('attempts_listening')
    .select(
      'id, test_id, user_id, mode, status, submitted_at, raw_score, band_score, time_spent_seconds, listening_tests!inner(slug, total_score)',
    )
    .eq('user_id', user.id)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false })
    .limit(50) // last 50 is enough for summary graph
    .returns<AttemptRow[]>();

  if (attemptsError || !attempts) {
    return res.status(500).json({ error: 'Failed to load attempts' });
  }

  const completedAttempts = attempts.filter((a) => a.submitted_at !== null);
  const totalAttempts = completedAttempts.length;

  let totalBand = 0;
  let bandCount = 0;
  let bestBandScore: number | null = null;
  let totalTimeSeconds = 0;

  const recentAttempts: ListeningBandSnapshot[] = completedAttempts.map((a) => {
    const bandScore = a.band_score ?? 0;
    const maxScore = a.listening_tests?.total_score ?? 40;

    if (a.band_score != null) {
      totalBand += bandScore;
      bandCount += 1;
      if (bestBandScore == null || bandScore > bestBandScore) {
        bestBandScore = bandScore;
      }
    }

    if (a.time_spent_seconds != null) {
      totalTimeSeconds += a.time_spent_seconds;
    }

    return {
      attemptId: a.id,
      testSlug: a.listening_tests?.slug ?? 'unknown',
      attemptedAt: a.submitted_at ?? new Date().toISOString(),
      mode: a.mode === 'mock' ? 'mock' : 'practice',
      rawScore: a.raw_score ?? 0,
      maxScore,
      bandScore,
    };
  });

  const avgBandScore = bandCount > 0 ? totalBand / bandCount : null;

  // TODO: real question-type stats, for now empty
  const questionTypeStats: ListeningQuestionTypeStats[] = [];

  const summary: ListeningAnalyticsSummary = {
    totalAttempts,
    completedAttempts: totalAttempts,
    avgBandScore,
    bestBandScore,
    recentAttempts,
    questionTypeStats,
    totalTimeSeconds,
  };

  return res.status(200).json({ summary });
}
