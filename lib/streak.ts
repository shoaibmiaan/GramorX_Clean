import { supabase } from '@/lib/supabaseClient';
import type { StreakDay, StreakSummary, StreakTokenSummary } from '@/types/streak';

const STREAK_TIMEOUT_MS = 10_000;

export const getDayKeyInTZ = (date: Date = new Date(), timeZone = 'Asia/Karachi'): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
};

const emptySummary = (): StreakSummary => ({
  current_streak: 0,
  longest_streak: 0,
  last_activity_date: null,
  timezone: 'Asia/Karachi',
  next_milestone_days: 1,
  streak_broken_recently: false,
  shields: 0,
});

const withTimeout = async <T>(task: (signal: AbortSignal) => Promise<T>, timeoutMs = STREAK_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const result = await task(controller.signal);
    clearTimeout(timer);
    return result;
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
};

const authenticatedFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const headers = new Headers(init?.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return withTimeout((signal) =>
    fetch(input, {
      ...init,
      headers,
      signal,
    }),
  );
};

const normalizeSummary = (payload: Partial<StreakSummary> | null | undefined): StreakSummary => {
  const fallback = emptySummary();
  const current = typeof payload?.current_streak === 'number' ? payload.current_streak : fallback.current_streak;
  const longest =
    typeof payload?.longest_streak === 'number'
      ? payload.longest_streak
      : typeof payload?.current_streak === 'number'
        ? payload.current_streak
        : fallback.longest_streak;

  return {
    current_streak: current,
    longest_streak: Math.max(longest, current),
    last_activity_date: typeof payload?.last_activity_date === 'string' ? payload.last_activity_date : fallback.last_activity_date,
    timezone: typeof payload?.timezone === 'string' ? payload.timezone : fallback.timezone,
    next_milestone_days:
      typeof payload?.next_milestone_days === 'number' && payload.next_milestone_days > 0
        ? payload.next_milestone_days
        : fallback.next_milestone_days,
    streak_broken_recently: Boolean(payload?.streak_broken_recently),
    shields: typeof payload?.shields === 'number' ? payload.shields : fallback.shields,
  };
};

export const fetchStreak = async (): Promise<StreakSummary> => {
  try {
    const res = await authenticatedFetch('/api/streak');
    if (!res.ok) {
      if (res.status === 401) {
        return emptySummary();
      }
      throw new Error(`Failed to load streak (${res.status})`);
    }
    const data = (await res.json().catch(() => null)) as Partial<StreakSummary> | null;
    return normalizeSummary(data);
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') {
      throw new Error('Streak request timed out');
    }
    throw error instanceof Error ? error : new Error('Failed to fetch streak');
  }
};

export const fetchStreakHistory = async (days = 90): Promise<StreakDay[]> => {
  const safeDays = Number.isFinite(days) && days > 0 ? Math.min(Math.floor(days), 365) : 90;
  const params = new URLSearchParams({ days: safeDays.toString() });
  const res = await authenticatedFetch(`/api/streak/history?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load streak history (${res.status})`);
  }
  const data = (await res.json().catch(() => ({ days: [] }))) as { days?: StreakDay[] };
  return Array.isArray(data.days) ? data.days : [];
};

export const fetchStreakTokens = async (): Promise<StreakTokenSummary> => {
  const res = await authenticatedFetch('/api/streak/tokens');
  if (!res.ok) {
    throw new Error(`Failed to load streak tokens (${res.status})`);
  }
  const data = (await res.json().catch(() => null)) as Partial<StreakTokenSummary> | null;
  return {
    availableTokens: typeof data?.availableTokens === 'number' ? data.availableTokens : 0,
    estimatedUsdValue: typeof data?.estimatedUsdValue === 'number' ? data.estimatedUsdValue : 0,
    nextTokenInDays: typeof data?.nextTokenInDays === 'number' ? Math.max(0, data.nextTokenInDays) : 0,
    lastUpdatedAt: typeof data?.lastUpdatedAt === 'string' ? data.lastUpdatedAt : null,
    lastClaimedAt: typeof data?.lastClaimedAt === 'string' ? data.lastClaimedAt : null,
  };
};
