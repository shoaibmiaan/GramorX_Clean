// lib/listening/analytics.ts

import type {
  ListeningAnalyticsSummary,
  ListeningBandSnapshot,
  ListeningQuestionTypeStats,
} from './types';
import { LISTENING_BAND_TABLE, LISTENING_MAX_SCORE } from './constants';

type FetchOptions = {
  signal?: AbortSignal;
};

type SummaryResponse = {
  summary: ListeningAnalyticsSummary;
};

type AttemptsResponse = {
  attempts: ListeningBandSnapshot[];
  total: number;
};

type AttemptDetailResponse = {
  attempt: ListeningBandSnapshot;
  questionTypeStats: ListeningQuestionTypeStats[];
};

/**
 * Compute band score from raw score using the configured band table.
 */
export function computeListeningBandFromRaw(rawScore: number, maxScore = LISTENING_MAX_SCORE): number {
  if (!Number.isFinite(rawScore) || rawScore < 0) return 0;

  // If maxScore differs, scale to 40-based score first.
  const normalizedScore = maxScore === LISTENING_MAX_SCORE
    ? rawScore
    : Math.round((rawScore / maxScore) * LISTENING_MAX_SCORE);

  for (const row of LISTENING_BAND_TABLE) {
    if (normalizedScore >= row.min && normalizedScore <= row.max) {
      return row.band;
    }
  }

  // Fallback
  return 0;
}

/**
 * Rounded to nearest 0.5 step (just in case).
 */
export function roundBandToHalf(band: number): number {
  const scaled = Math.round(band * 2);
  return scaled / 2;
}

/**
 * Get overall per-user listening analytics.
 */
export async function fetchListeningAnalyticsSummary(
  options?: FetchOptions,
): Promise<ListeningAnalyticsSummary> {
  const res = await fetch('/api/listening/analytics/summary', {
    method: 'GET',
    signal: options?.signal,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Failed to load listening analytics summary (${res.status})`);
  }

  const json = (await res.json()) as SummaryResponse;
  return json.summary;
}

/**
 * Paginated list of attempts for listening (for attempts table, timeline, etc.).
 */
export async function fetchListeningAttempts(
  params: {
    page?: number;
    pageSize?: number;
    mode?: 'practice' | 'mock';
  } = {},
  options?: FetchOptions,
): Promise<AttemptsResponse> {
  const url = new URL('/api/listening/analytics/attempts', window.location.origin);

  if (params.page != null) url.searchParams.set('page', String(params.page));
  if (params.pageSize != null) url.searchParams.set('pageSize', String(params.pageSize));
  if (params.mode) url.searchParams.set('mode', params.mode);

  const res = await fetch(url.toString(), {
    method: 'GET',
    signal: options?.signal,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Failed to load listening attempts (${res.status})`);
  }

  const json = (await res.json()) as AttemptsResponse;
  return json;
}

/**
 * Detailed analytics for a specific attempt.
 */
export async function fetchListeningAttemptDetail(
  attemptId: string,
  options?: FetchOptions,
): Promise<AttemptDetailResponse> {
  const url = new URL('/api/listening/analytics/attempt-detail', window.location.origin);
  url.searchParams.set('attemptId', attemptId);

  const res = await fetch(url.toString(), {
    method: 'GET',
    signal: options?.signal,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Failed to load listening attempt detail (${res.status})`);
  }

  const json = (await res.json()) as AttemptDetailResponse;
  return json;
}
