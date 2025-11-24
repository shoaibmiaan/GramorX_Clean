// lib/listeningBandMap.ts

/**
 * IELTS Listening band mapping helper.
 *
 * We normalise the raw score to a 40-mark scale and then
 * apply an approximate IELTS band table.
 */

export type ListeningBandInput = {
  rawScore: number;
  totalQuestions: number;
};

type BandRange = {
  min: number;
  max: number;
  band: number;
};

// Simple approximate table for 40-mark scale
const BAND_TABLE: BandRange[] = [
  { min: 39, max: 40, band: 9.0 },
  { min: 37, max: 38, band: 8.5 },
  { min: 35, max: 36, band: 8.0 },
  { min: 32, max: 34, band: 7.5 },
  { min: 30, max: 31, band: 7.0 },
  { min: 26, max: 29, band: 6.5 },
  { min: 23, max: 25, band: 6.0 },
  { min: 18, max: 22, band: 5.5 },
  { min: 16, max: 17, band: 5.0 },
  { min: 13, max: 15, band: 4.5 },
  { min: 10, max: 12, band: 4.0 },
  { min: 7, max: 9, band: 3.5 },
  { min: 5, max: 6, band: 3.0 },
  { min: 3, max: 4, band: 2.5 },
  { min: 1, max: 2, band: 2.0 },
  { min: 0, max: 0, band: 1.0 },
];

/**
 * Map a Listening raw score to an estimated band.
 *
 * - rawScore: marks obtained
 * - totalQuestions: total marks available
 *
 * We:
 * 1) Clamp raw score within [0, totalQuestions]
 * 2) Scale to 0–40
 * 3) Use BAND_TABLE
 */
export function mapListeningRawToBand(rawScore: number, totalQuestions: number): number {
  if (!Number.isFinite(rawScore) || !Number.isFinite(totalQuestions) || totalQuestions <= 0) {
    return 0;
  }

  const clampedRaw = Math.max(0, Math.min(rawScore, totalQuestions));

  // Already a 40-mark test
  if (totalQuestions === 40) {
    return lookupBand(clampedRaw);
  }

  const scaled = (clampedRaw / totalQuestions) * 40;
  const roundedScaled = Math.round(scaled);

  return lookupBand(roundedScaled);
}

function lookupBand(normalisedScore: number): number {
  const score = Math.max(0, Math.min(40, Math.round(normalisedScore)));

  const row = BAND_TABLE.find((entry) => score >= entry.min && score <= entry.max);
  if (!row) {
    // Fallback: if weird value somehow, clamp roughly by proportion.
    if (score >= 35) return 8.0;
    if (score >= 30) return 7.0;
    if (score >= 23) return 6.0;
    if (score >= 18) return 5.5;
    if (score >= 13) return 4.5;
    return 4.0;
  }

  return row.band;
}
