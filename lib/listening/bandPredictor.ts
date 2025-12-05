// lib/listening/bandPredictor.ts

/**
 * Minimal payload we need for band graphs / summaries.
 * Mirrors ReadingAttemptSummary shape but for Listening.
 */
export type ListeningAttemptSummary = {
  rawScore: number;        // 0–40
  totalQuestions: number;  // usually 40
  bandScore: number | null;
  createdAt: string;       // ISO date from DB
};

/**
 * Approx IELTS Listening conversion for 40 questions.
 * If totalQuestions !== 40, we scale rawScore to 40 first.
 */
export function estimateListeningBand(
  rawScore: number,
  totalQuestions: number = 40,
): number {
  if (!Number.isFinite(rawScore) || !Number.isFinite(totalQuestions) || totalQuestions <= 0) {
    return 0;
  }

  // Normalise to 40-question scale
  const scaled = Math.round((rawScore / totalQuestions) * 40);

  if (scaled >= 39) return 9;
  if (scaled >= 37) return 8.5;
  if (scaled >= 35) return 8;
  if (scaled >= 32) return 7.5;
  if (scaled >= 30) return 7;
  if (scaled >= 26) return 6.5;
  if (scaled >= 23) return 6;
  if (scaled >= 18) return 5.5;
  if (scaled >= 16) return 5;
  if (scaled >= 13) return 4.5;
  if (scaled >= 10) return 4;
  if (scaled >= 8) return 3.5;
  if (scaled >= 6) return 3;
  if (scaled >= 4) return 2.5;
  if (scaled >= 2) return 2;
  if (scaled >= 1) return 1;
  return 0;
}

/**
 * Attach bandScore to a raw attempt. Safe to call with partial data.
 */
export function withEstimatedBand(
  attempt: Omit<ListeningAttemptSummary, 'bandScore'> & { bandScore?: number | null },
): ListeningAttemptSummary {
  const totalQuestions = attempt.totalQuestions || 40;
  const band =
    typeof attempt.bandScore === 'number'
      ? attempt.bandScore
      : estimateListeningBand(attempt.rawScore, totalQuestions);

  return {
    rawScore: attempt.rawScore,
    totalQuestions,
    bandScore: band,
    createdAt: attempt.createdAt,
  };
}

/**
 * Simple aggregate helpers for analytics cards if/when you need them.
 */

export type ListeningBandAggregate = {
  bestBand: number | null;
  avgBand: number | null;
};

export function aggregateBands(attempts: ListeningAttemptSummary[]): ListeningBandAggregate {
  const bands = attempts
    .map((a) => (typeof a.bandScore === 'number' ? a.bandScore : null))
    .filter((v): v is number => v !== null);

  if (bands.length === 0) {
    return { bestBand: null, avgBand: null };
  }

  const bestBand = Math.max(...bands);
  const avgRaw = bands.reduce((acc, v) => acc + v, 0) / bands.length;
  const avgBand = Math.round((avgRaw + Number.EPSILON) * 10) / 10;

  return { bestBand, avgBand };
}
