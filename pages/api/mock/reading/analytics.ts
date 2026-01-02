import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import { withPlan } from '@/lib/withPlan';
import {
  computeAttemptsTimeline,
  computeTimePerQuestionStats,
  computeAccuracyByQuestionTypeFromAttempts,
  type ReadingAttemptAnalyticsRow,
  type ReadingQuestionRow,
} from '@/lib/reading/analytics';

async function baseHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getServerClient(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: attemptsRows, error } = await supabase
    .from('reading_attempts')
    .select('id, test_id, created_at, raw_score, duration_seconds, section_stats, meta, band_score')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    return res.status(500).json({ error: 'Unable to load analytics' });
  }

  const attempts = (attemptsRows ?? []) as any[];

  if (!attempts.length) {
    return res.status(200).json({
      hasData: false,
      accuracyByType: [],
      timeline: [],
      timeStats: [],
    });
  }

  const testIds = Array.from(new Set(attempts.map((a: any) => a.test_id).filter(Boolean)));

  const { data: questionRows, error: questionError } = await supabase
    .from('reading_questions')
    .select('id, test_id, question_type_id, correct_answer')
    .in('test_id', testIds);

  if (questionError) {
    return res.status(500).json({ error: 'Unable to load question data' });
  }

  const questionsByTest = new Map<string, ReadingQuestionRow[]>();
  (questionRows ?? []).forEach((row) => {
    const list = questionsByTest.get(row.test_id) ?? [];
    list.push(row as ReadingQuestionRow);
    questionsByTest.set(row.test_id, list);
  });

  const analyticsAttempts: ReadingAttemptAnalyticsRow[] = attempts.map((attempt: any) => ({
    id: attempt.id,
    test_id: attempt.test_id,
    created_at: attempt.created_at,
    raw_score: attempt.raw_score,
    band_score: attempt.band_score ?? null,
    duration_seconds: attempt.duration_seconds,
    meta: attempt.meta ?? {},
  }));

  const attemptQuestionCounts = new Map<string, number>();
  analyticsAttempts.forEach((attempt) => {
    const count = questionsByTest.get(attempt.test_id)?.length ?? 0;
    attemptQuestionCounts.set(attempt.id, count);
  });

  const timelineInput = attempts.map((attempt: any) => ({
    ...attempt,
    question_count: attemptQuestionCounts.get(attempt.id) ?? null,
  }));

  return res.status(200).json({
    hasData: true,
    accuracyByType: computeAccuracyByQuestionTypeFromAttempts(
      analyticsAttempts,
      questionsByTest,
    ),
    timeline: computeAttemptsTimeline(timelineInput),
    timeStats: computeTimePerQuestionStats(attempts),
  });
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return withPlan('pro', baseHandler, {
    allowRoles: ['admin', 'teacher'],
    onPlanFailure: ({ apiRoute, res: response }) => {
      if (apiRoute && response) {
        response.status(402).json({ error: 'upgrade_required', required: 'pro' });
        return null;
      }

      return { redirect: { destination: '/pricing?required=pro', permanent: false } } as const;
    },
  })(req, res);
}
