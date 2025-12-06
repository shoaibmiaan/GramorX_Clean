// pages/api/ai/predict-band.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerClient } from '@/lib/supabaseServer';
import { MockStatsService } from '@/services/mock/MockStatsService';

type Trend = 'improving' | 'stable' | 'declining';

interface PredictionData {
  currentBand: number;
  predictedBand: number;
  confidence: number;
  targetDate: string;
  improvementRate: number;
  keyFactors: {
    factor: string;
    impact: number;
    trend: Trend;
  }[];
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimatedImpact: number;
    actionItems: string[];
  }>;
  milestonePredictions: Array<{
    date: string;
    predictedBand: number;
    confidence: number;
  }>;
}

type ErrorBody = {
  error: string;
  code:
    | 'METHOD_NOT_ALLOWED'
    | 'UNAUTHENTICATED'
    | 'NOT_ENOUGH_DATA'
    | 'INTERNAL_ERROR';
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PredictionData | ErrorBody>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res
      .status(405)
      .json({ error: 'Only GET is allowed', code: 'METHOD_NOT_ALLOWED' });
  }

  try {
    const supabase = getServerClient(req, res);

    // Prefer explicit userId from query, otherwise use current auth user
    const userIdFromQuery = Array.isArray(req.query.userId)
      ? req.query.userId[0]
      : req.query.userId;

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const userId = userIdFromQuery || authUser?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'You must be signed in to view predictive analytics.',
        code: 'UNAUTHENTICATED',
      });
    }

    const statsService = await MockStatsService.create(supabase as any);

    // Pull real data from your stats service
    const [stats, modulePerformanceRaw, attemptsRaw] = await Promise.all([
      statsService.getUserStats(userId),
      statsService.getModulePerformance(userId),
      statsService.getRecentAttempts(userId, 60),
    ]);

    const modulePerformance = (modulePerformanceRaw || []) as any[];
    const attempts = (attemptsRaw || []) as any[];

    const totalAttempts = stats?.totalAttempts ?? attempts.length ?? 0;

    if (!stats || totalAttempts === 0) {
      return res.status(400).json({
        error:
          'Not enough data to generate predictions. Complete at least one full mock test.',
        code: 'NOT_ENOUGH_DATA',
      });
    }

    // ---------- Core numbers ----------
    const currentBand =
      typeof stats.averageBand === 'number' ? stats.averageBand : 0;

    // Use your existing improvement metric if available; otherwise estimate
    const improvementRateRaw =
      typeof stats.bandProgress === 'number' ? stats.bandProgress : 0;

    const improvementRate =
      improvementRateRaw !== 0
        ? improvementRateRaw
        : totalAttempts > 1
        ? Math.min(25, totalAttempts * 2) // 2% per attempt as a simple heuristic
        : 0;

    // Predict: a small bump based on improvementRate, capped at band 9.0
    const predictedBand = Math.min(
      9,
      currentBand + (improvementRate > 0 ? 0.5 : 0.2)
    );

    // Confidence: more attempts -> higher confidence, max ~95
    const confidenceBase = 60;
    const confidence = Math.min(
      95,
      confidenceBase + Math.min(35, totalAttempts * 4)
    );

    // Target date: 3–6 months from now depending on gap between current & target
    const now = new Date();
    const bandGap = Math.max(0, predictedBand - currentBand);
    const monthsToTarget = bandGap <= 0.5 ? 3 : bandGap <= 1 ? 4 : 6;
    const targetDate = new Date(
      now.getFullYear(),
      now.getMonth() + monthsToTarget,
      now.getDate()
    ).toISOString();

    // ---------- Key factors (derived from module performance) ----------
    const keyFactors = modulePerformance.map((mp) => {
      const moduleLabel =
        mp.moduleLabel || mp.module || mp.name || 'Module Performance';
      const impact =
        typeof mp.weight === 'number'
          ? mp.weight
          : typeof mp.attempts === 'number'
          ? Math.min(30, 5 + mp.attempts * 2)
          : 20;

      let trend: Trend = 'stable';

      // Try to infer trend from any available fields
      if (typeof mp.trend === 'string') {
        if (mp.trend === 'up' || mp.trend === 'improving') trend = 'improving';
        else if (mp.trend === 'down' || mp.trend === 'declining')
          trend = 'declining';
      } else if (typeof mp.bandChange === 'number') {
        trend = mp.bandChange > 0 ? 'improving' : mp.bandChange < 0 ? 'declining' : 'stable';
      }

      return {
        factor: moduleLabel as string,
        impact,
        trend,
      };
    });

    // If for some reason no module factors, still send some generic ones
    const normalizedKeyFactors =
      keyFactors.length > 0
        ? keyFactors
        : ([
            {
              factor: 'Overall consistency',
              impact: 30,
              trend: 'improving',
            },
            {
              factor: 'Time management',
              impact: 25,
              trend: 'stable',
            },
            {
              factor: 'Question accuracy',
              impact: 20,
              trend: 'improving',
            },
          ] as PredictionData['keyFactors']);

    // ---------- Recommendations (simple but data-aware) ----------
    const recommendations: PredictionData['recommendations'] = [];

    if (currentBand < 7) {
      recommendations.push({
        id: 'writing-focus',
        title: 'Writing & Task Response',
        description:
          'Boost your coherence, task response, and lexical range with focused writing practice.',
        priority: 'high',
        estimatedImpact: 15,
        actionItems: [
          'Complete at least 3 timed writing tasks per week.',
          'Review band 8+ model answers and compare your structure.',
          'Use AI feedback to iterate and re-write weak essays.',
        ],
      });
    }

    // Listening / Reading based on any module performance shape
    const readingPerf = modulePerformance.find(
      (mp) =>
        mp.module === 'reading' ||
        mp.moduleKey === 'reading' ||
        mp.moduleLabel === 'Reading'
    );
    const listeningPerf = modulePerformance.find(
      (mp) =>
        mp.module === 'listening' ||
        mp.moduleKey === 'listening' ||
        mp.moduleLabel === 'Listening'
    );

    if (listeningPerf) {
      recommendations.push({
        id: 'listening-accuracy',
        title: 'Strengthen Listening Accuracy',
        description:
          'Close the gap in listening with targeted question-type drills and transcript review.',
        priority: 'high',
        estimatedImpact: 12,
        actionItems: [
          'Do 2–3 listening sections daily focusing on your weakest question types.',
          'Always review transcripts and note why each wrong answer was wrong.',
          'Practice with different accents (UK, US, Australian).',
        ],
      });
    }

    if (readingPerf) {
      recommendations.push({
        id: 'reading-timing',
        title: 'Reading Time Management',
        description:
          'Improve your pacing across passages without sacrificing accuracy.',
        priority: 'medium',
        estimatedImpact: 8,
        actionItems: [
          'Practice skimming and scanning under a 20-minute per passage cap.',
          'Tag each mistake as “careless”, “vocabulary”, or “time pressure”.',
          'Reattempt tough passages untimed to focus on understanding.',
        ],
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        id: 'general',
        title: 'Stabilize Your Core Performance',
        description:
          'Use regular full mocks plus focused review to keep your band stable and push it up.',
        priority: 'medium',
        estimatedImpact: 10,
        actionItems: [
          'Schedule 1 full mock per week and always review every mistake.',
          'Keep a “mistakes log” by question type and module.',
          'Follow a fixed weekly routine for all four skills.',
        ],
      });
    }

    // ---------- Milestone predictions (timeline graph) ----------
    const timeToTargetDays = Math.max(
      1,
      Math.ceil(
        (new Date(targetDate).getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );
    const checkpoints = [0.25, 0.5, 0.75, 1];

    const milestonePredictions: PredictionData['milestonePredictions'] =
      checkpoints.map((ratio) => {
        const daysOffset = Math.round(timeToTargetDays * ratio);
        const date = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + daysOffset
        );

        const predicted =
          currentBand + (predictedBand - currentBand) * ratio;

        const confStep = (confidence - 60) * ratio; // grow from 60 -> confidence
        const conf = Math.round(60 + confStep);

        return {
          date: date.toISOString(),
          predictedBand: Number(predicted.toFixed(1)),
          confidence: conf,
        };
      });

    const payload: PredictionData = {
      currentBand: Number(currentBand.toFixed(1)),
      predictedBand: Number(predictedBand.toFixed(1)),
      confidence,
      targetDate,
      improvementRate: Number(improvementRate.toFixed(1)),
      keyFactors: normalizedKeyFactors,
      recommendations,
      milestonePredictions,
    };

    return res.status(200).json(payload);
  } catch (err) {
    console.error('predict-band API failed:', err);
    return res.status(500).json({
      error: 'Internal server error while generating predictions.',
      code: 'INTERNAL_ERROR',
    });
  }
}
