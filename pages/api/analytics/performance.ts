// pages/api/analytics/performance.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerClient } from '@/lib/supabaseServer';
import { MockStatsService } from '@/services/mock/MockStatsService';

interface PerformanceData {
  averageBand: number;
  improvementRate: number;
  consistencyScore: number;
  timeSpent: number;
  accuracyRate: number;
  speedScore: number;
  moduleBreakdown: {
    reading: number;
    listening: number;
    writing: number;
    speaking: number;
  };
  predictions?: {
    predictedBand: number;
    confidence: number;
    targetDate: string;
  };
}

type ErrorCode =
  | 'METHOD_NOT_ALLOWED'
  | 'UNAUTHENTICATED'
  | 'NOT_ENOUGH_DATA'
  | 'INTERNAL_ERROR';

interface ErrorBody {
  error: string;
  code: ErrorCode;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PerformanceData | ErrorBody>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({
      error: 'Only GET is allowed.',
      code: 'METHOD_NOT_ALLOWED',
    });
  }

  try {
    const supabase = getServerClient(req, res);

    const userIdFromQuery = Array.isArray(req.query.userId)
      ? req.query.userId[0]
      : req.query.userId;

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const userId = userIdFromQuery || authUser?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'You must be signed in to view performance analytics.',
        code: 'UNAUTHENTICATED',
      });
    }

    const statsService = await MockStatsService.create(supabase as any);

    const [stats, modulePerformance] = await Promise.all([
      statsService.getUserStats(userId),
      statsService.getModulePerformance(userId),
    ]);

    const totalAttempts = stats?.totalAttempts ?? 0;
    if (!stats || totalAttempts === 0) {
      return res.status(400).json({
        error:
          'Not enough data to generate performance analytics. Complete at least one full mock test.',
        code: 'NOT_ENOUGH_DATA',
      });
    }

    const averageBand =
      typeof stats.averageBand === 'number' ? stats.averageBand : 0;

    const improvementRateRaw =
      typeof stats.bandProgress === 'number' ? stats.bandProgress : 0;

    const improvementRate =
      improvementRateRaw !== 0
        ? improvementRateRaw
        : totalAttempts > 1
        ? Math.min(25, totalAttempts * 2)
        : 0;

    const consistencyScore =
      typeof stats.consistencyScore === 'number' ? stats.consistencyScore : 0;

    const timeSpent =
      typeof stats.totalStudyHours === 'number' ? stats.totalStudyHours : 0;

    const accuracyRate =
      typeof stats.accuracyRate === 'number'
        ? stats.accuracyRate
        : typeof stats.overallAccuracy === 'number'
        ? stats.overallAccuracy
        : 0;

    const speedScore =
      typeof stats.speedScore === 'number' ? stats.speedScore : 0;

    const getModuleBand = (keys: string[]) => {
      const mp = (modulePerformance || []).find((m: any) =>
        keys.includes((m.moduleKey || m.module || m.moduleLabel || '').toLowerCase())
      );
      if (!mp) return averageBand || 0;
      if (typeof mp.averageBand === 'number') return mp.averageBand;
      if (typeof mp.band === 'number') return mp.band;
      return averageBand || 0;
    };

    const moduleBreakdown: PerformanceData['moduleBreakdown'] = {
      reading: getModuleBand(['reading']),
      listening: getModuleBand(['listening']),
      writing: getModuleBand(['writing']),
      speaking: getModuleBand(['speaking']),
    };

    // Lightweight prediction for the Predictions tab
    const predictedBand = Math.min(
      9,
      averageBand + (improvementRate > 0 ? 0.5 : 0.2)
    );

    const confidenceBase = 60;
    const confidence = Math.min(
      95,
      confidenceBase + Math.min(35, totalAttempts * 4)
    );

    const now = new Date();
    const bandGap = Math.max(0, predictedBand - averageBand);
    const monthsToTarget = bandGap <= 0.5 ? 3 : bandGap <= 1 ? 4 : 6;
    const targetDate = new Date(
      now.getFullYear(),
      now.getMonth() + monthsToTarget,
      now.getDate()
    ).toISOString();

    const payload: PerformanceData = {
      averageBand: Number(averageBand.toFixed(1)),
      improvementRate: Number(improvementRate.toFixed(1)),
      consistencyScore,
      timeSpent: Number(timeSpent.toFixed(1)),
      accuracyRate: Number(accuracyRate.toFixed(1)),
      speedScore: Number(speedScore.toFixed(1)),
      moduleBreakdown,
      predictions: {
        predictedBand: Number(predictedBand.toFixed(1)),
        confidence,
        targetDate,
      },
    };

    return res.status(200).json(payload);
  } catch (err) {
    console.error('performance analytics API failed:', err);
    return res.status(500).json({
      error: 'Internal server error while loading performance analytics.',
      code: 'INTERNAL_ERROR',
    });
  }
}
