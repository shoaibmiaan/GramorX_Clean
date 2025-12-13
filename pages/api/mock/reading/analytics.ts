import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import { withPlan } from '@/lib/withPlan';
import {
  computeAccuracyByQuestionType,
  computeAttemptsTimeline,
  computeTimePerQuestionStats,
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
    .from('attempts_reading')
    .select('id, test_id, created_at, raw_score, question_count, duration_seconds, section_stats')
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

  return res.status(200).json({
    hasData: true,
    accuracyByType: computeAccuracyByQuestionType(attempts),
    timeline: computeAttemptsTimeline(attempts),
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
