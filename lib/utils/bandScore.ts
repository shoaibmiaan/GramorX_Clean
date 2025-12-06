// lib/utils/bandScore.ts
export function formatBandScore(score: number): string {
  if (score === null || score === undefined) return '—';
  return score.toFixed(1);
}

export function calculateImprovementRate(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function calculatePredictedBand(
  currentBand: number,
  studyHours: number,
  consistency: number
): number {
  // Simplified prediction formula
  const improvementFactor = (studyHours * consistency) / 1000;
  return Math.min(9, currentBand + improvementFactor);
}