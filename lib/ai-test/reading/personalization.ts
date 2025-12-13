// lib/ai-test/reading/personalization.ts

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';
import type {
  AiReadingTestConfig,
  AiReadingQuestionType,
  AiReadingDifficulty,
} from './types';

type PublicClient = SupabaseClient<Database>;

type UserReadingHistory = {
  attempts: {
    id: string;
    rawScore: number | null;
    maxScore: number | null;
    bandScore: number | null;
    accuracyPercent: number | null;
  }[];
  accuracyByType: Record<
    AiReadingQuestionType,
    { correct: number; total: number }
  >;
};

type SmartConfigOverrides = {
  // if user explicitly sets targetBand in UI we respect it as a bias
  targetBand?: number;
  // future: allow override of difficulty or length if you want
};

type SmartConfigResult = {
  difficulty: AiReadingDifficulty;
  config: AiReadingTestConfig;
};

/**
 * Fetch last N AI reading attempts + per-question performance by question_type.
 */
async function loadUserReadingHistory(options: {
  supabase: PublicClient;
  userId: string;
  limitAttempts?: number;
}): Promise<UserReadingHistory> {
  const { supabase, userId, limitAttempts = 20 } = options;

  // 1) Last N attempts
  const { data: attempts, error: attemptsError } = await supabase
    .from('ai_reading_attempts')
    .select(
      'id, raw_score, max_score, band_score, accuracy_percent, user_id'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limitAttempts);

  if (attemptsError) {
    console.error(
      '[ai-test/reading/personalization] Failed to load attempts',
      attemptsError
    );
    return {
      attempts: [],
      accuracyByType: {} as UserReadingHistory['accuracyByType'],
    };
  }

  if (!attempts || !attempts.length) {
    return {
      attempts: [],
      accuracyByType: {} as UserReadingHistory['accuracyByType'],
    };
  }

  const attemptIds = attempts.map((a) => a.id);

  // 2) All answers for those attempts
  const { data: answers, error: answersError } = await supabase
    .from('ai_reading_attempt_answers')
    .select('attempt_id, question_id, is_correct')
    .in('attempt_id', attemptIds);

  if (answersError || !answers?.length) {
    if (answersError) {
      console.error(
        '[ai-test/reading/personalization] Failed to load answers',
        answersError
      );
    }
    return {
      attempts,
      accuracyByType: {} as UserReadingHistory['accuracyByType'],
    };
  }

  const questionIds = Array.from(
    new Set(answers.map((a) => a.question_id))
  );

  if (!questionIds.length) {
    return {
      attempts,
      accuracyByType: {} as UserReadingHistory['accuracyByType'],
    };
  }

  // 3) Lookup question types for those questions
  const { data: questions, error: questionsError } = await supabase
    .from('ai_reading_questions')
    .select('id, question_type')
    .in('id', questionIds);

  if (questionsError || !questions?.length) {
    if (questionsError) {
      console.error(
        '[ai-test/reading/personalization] Failed to load questions',
        questionsError
      );
    }
    return {
      attempts,
      accuracyByType: {} as UserReadingHistory['accuracyByType'],
    };
  }

  const typeByQuestionId = new Map<string, AiReadingQuestionType>();
  for (const q of questions) {
    typeByQuestionId.set(q.id, q.question_type as AiReadingQuestionType);
  }

  const accuracyByType: UserReadingHistory['accuracyByType'] = {} as any;

  for (const answer of answers) {
    const type = typeByQuestionId.get(answer.question_id);
    if (!type) continue;

    if (!accuracyByType[type]) {
      accuracyByType[type] = { correct: 0, total: 0 };
    }

    accuracyByType[type].total += 1;
    if (answer.is_correct) {
      accuracyByType[type].correct += 1;
    }
  }

  return {
    attempts,
    accuracyByType,
  };
}

/**
 * Infer a "base difficulty" from a user's performance history.
 */
function inferDifficulty(history: UserReadingHistory): AiReadingDifficulty {
  if (!history.attempts.length) {
    return 'medium';
  }

  // Prefer bandScore, otherwise approximate from accuracyPercent
  let totalBand = 0;
  let bandCount = 0;

  for (const a of history.attempts) {
    if (a.bandScore != null) {
      totalBand += a.bandScore;
      bandCount += 1;
    }
  }

  let avgBand: number | null = null;

  if (bandCount > 0) {
    avgBand = totalBand / bandCount;
  } else {
    // Rough hack: map accuracy to band
    let sumAcc = 0;
    let accCount = 0;
    for (const a of history.attempts) {
      if (a.accuracyPercent != null) {
        sumAcc += Number(a.accuracyPercent);
        accCount += 1;
      }
    }
    if (accCount > 0) {
      const avgAcc = sumAcc / accCount;
      if (avgAcc >= 85) avgBand = 8;
      else if (avgAcc >= 75) avgBand = 7;
      else if (avgAcc >= 65) avgBand = 6;
      else if (avgAcc >= 55) avgBand = 5;
      else avgBand = 4;
    }
  }

  if (avgBand == null) {
    return 'medium';
  }

  if (avgBand < 5.5) return 'easy';
  if (avgBand < 6.5) return 'medium';
  if (avgBand < 7.5) return 'hard';
  if (avgBand < 8.0) return 'cambridge_7_plus';
  return 'cambridge_8_plus';
}

/**
 * Infer a target band: "current avg + 0.5", within [5.0, 8.5].
 */
function inferTargetBand(history: UserReadingHistory): number {
  if (!history.attempts.length) return 6.5;

  let totalBand = 0;
  let bandCount = 0;

  for (const a of history.attempts) {
    if (a.bandScore != null) {
      totalBand += a.bandScore;
      bandCount += 1;
    }
  }

  let base = 6.5;
  if (bandCount > 0) {
    const avg = totalBand / bandCount;
    base = avg + 0.5;
  }

  if (base < 5.0) base = 5.0;
  if (base > 8.5) base = 8.5;
  return Number(base.toFixed(1));
}

/**
 * Decide question types to focus on based on weak performance.
 */
function inferFocusTypes(
  history: UserReadingHistory
): AiReadingQuestionType[] {
  const entries = Object.entries(history.accuracyByType) as [
    AiReadingQuestionType,
    { correct: number; total: number }
  ][];

  if (!entries.length) {
    // No data → fallback set
    return ['mcq_single', 'tfng', 'ynng'];
  }

  const weaknessList = entries
    .filter(([, stats]) => stats.total >= 3) // only consider types with some data
    .map(([type, stats]) => {
      const acc = stats.correct / stats.total;
      return {
        type,
        accuracy: acc,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy); // weakest first

  // If after filtering there's nothing, still fallback
  if (!weaknessList.length) {
    return ['mcq_single', 'tfng', 'ynng'];
  }

  // Pick top 2–3 weak types
  const selected = weaknessList.slice(0, 3).map((w) => w.type);

  // Ensure there's at least one of the "core" types
  const hasMcq = selected.includes('mcq_single');
  if (!hasMcq && selected.length < 4) {
    selected.push('mcq_single');
  }

  return Array.from(new Set(selected));
}

/**
 * Decide test length/time based on history:
 * - if very weak or new: shorter drills
 * - if stable: medium set
 * - if strong: longer near-full sets
 */
function inferLengthAndTiming(
  history: UserReadingHistory
): { timeMinutes: number; totalQuestions: number } {
  const attempts = history.attempts;
  if (!attempts.length) {
    return { timeMinutes: 25, totalQuestions: 13 };
  }

  let avgAcc = 0;
  let accCount = 0;

  for (const a of attempts) {
    if (a.accuracyPercent != null) {
      avgAcc += Number(a.accuracyPercent);
      accCount += 1;
    }
  }

  if (accCount === 0) {
    return { timeMinutes: 25, totalQuestions: 13 };
  }

  avgAcc /= accCount;

  if (avgAcc < 50) {
    // struggling → shorter, focused drills
    return { timeMinutes: 20, totalQuestions: 10 };
  }

  if (avgAcc < 70) {
    // mid-range → medium
    return { timeMinutes: 30, totalQuestions: 20 };
  }

  // stronger → challenge them with bigger sets
  return { timeMinutes: 40, totalQuestions: 30 };
}

/**
 * Public entrypoint:
 *  - Reads user history from ai_reading_* tables
 *  - Builds a smart AiReadingTestConfig + difficulty
 */
export async function buildSmartReadingConfig(options: {
  supabase: PublicClient;
  userId: string;
  overrides?: SmartConfigOverrides;
}): Promise<SmartConfigResult> {
  const { supabase, userId, overrides } = options;

  const history = await loadUserReadingHistory({ supabase, userId });

  const difficulty = inferDifficulty(history);
  const targetBand =
    overrides?.targetBand != null
      ? overrides.targetBand
      : inferTargetBand(history);
  const focusTypes = inferFocusTypes(history);
  const { timeMinutes, totalQuestions } = inferLengthAndTiming(history);

  const config: AiReadingTestConfig = {
    mode: 'smart',
    focusTypes,
    targetBand,
    timeMinutes,
    totalQuestions,
  };

  return {
    difficulty,
    config,
  };
}
