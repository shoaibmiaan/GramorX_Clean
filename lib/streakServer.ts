import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Profiles, StudyActivityLog, StreakShields } from '@/types/supabase';
import type { StreakDay, StreakSummary } from '@/types/streak';

const MS_PER_DAY = 86_400_000;

const formatterCache = new Map<string, Intl.DateTimeFormat>();

const formatInTimeZone = (date: Date, timeZone: string): string => {
  const key = timeZone || 'UTC';
  if (!formatterCache.has(key)) {
    try {
      formatterCache.set(
        key,
        new Intl.DateTimeFormat('en-CA', {
          timeZone: key,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
      );
    } catch {
      formatterCache.set(
        key,
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'UTC',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
      );
    }
  }

  return formatterCache.get(key)!.format(date);
};

const parseDayKey = (key: string | null | undefined): Date | null => {
  if (!key) return null;
  const match = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month, day));
  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date;
};

const shiftDayKey = (key: string, delta: number): string => {
  const base = parseDayKey(key);
  if (!base) return key;
  const shifted = new Date(base.getTime() + delta * MS_PER_DAY);
  return shifted.toISOString().slice(0, 10);
};

const ensureTimezone = (tz?: string | null) => {
  if (!tz) return 'Asia/Karachi';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date());
    return tz;
  } catch {
    return 'Asia/Karachi';
  }
};

export type ActivityRow = Pick<StudyActivityLog, 'activity_date' | 'created_at' | 'weight'>;

type ActivityMap = Map<string, number>;
type ActivityTimestamps = number[];

type BuildOptions = {
  supabase: SupabaseClient<Database>;
  userId: string;
  historyDays: number;
  summaryLookback?: number;
  now?: Date;
};

export const loadUserTimezone = async (
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<string> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('user_id', userId)
    .maybeSingle<Pick<Profiles, 'timezone'>>();

  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[streak] Unable to load timezone, defaulting to PKT', error.message);
  }

  return ensureTimezone(data?.timezone);
};

export const fetchActivityLog = async (
  supabase: SupabaseClient<Database>,
  userId: string,
  daysBack: number,
): Promise<ActivityRow[]> => {
  const safeDays = Number.isFinite(daysBack) && daysBack > 0 ? Math.min(Math.floor(daysBack), 730) : 90;
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (safeDays + 2));
  const sinceKey = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('study_activity_log')
    .select('activity_date,created_at,weight')
    .eq('user_id', userId)
    .gte('activity_date', sinceKey)
    .order('activity_date', { ascending: true })
    .returns<ActivityRow[]>();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return Array.isArray(data) ? data : [];
};

export const buildActivityMap = (
  rows: ActivityRow[],
  timeZone: string,
): ActivityMap => {
  const map: ActivityMap = new Map();

  for (const row of rows) {
    const timestamp = row.created_at
      ? new Date(row.created_at)
      : row.activity_date
        ? new Date(`${row.activity_date}T00:00:00Z`)
        : null;
    if (!timestamp || Number.isNaN(timestamp.getTime())) continue;
    const key = formatInTimeZone(timestamp, timeZone);
    const weight = Number.isFinite(row.weight) ? Math.max(0, Math.round(row.weight as number)) : 1;
    const previous = map.get(key) ?? 0;
    map.set(key, previous + (weight > 0 ? weight : 1));
  }

  return map;
};

const toTimestamp = (row: ActivityRow): number | null => {
  if (row.created_at) {
    const value = new Date(row.created_at);
    if (!Number.isNaN(value.getTime())) {
      return value.getTime();
    }
  }
  if (row.activity_date) {
    const value = Date.parse(`${row.activity_date}T00:00:00Z`);
    if (!Number.isNaN(value)) {
      return value;
    }
  }
  return null;
};

export const buildActivityTimeline = (rows: ActivityRow[]): ActivityTimestamps =>
  rows
    .map((row) => toTimestamp(row))
    .filter((ts): ts is number => typeof ts === 'number' && Number.isFinite(ts))
    .sort((a, b) => a - b);

const findRunStartIndex = (events: ActivityTimestamps, fromIndex: number): number => {
  let cursor = fromIndex;
  while (cursor > 0) {
    const prev = events[cursor - 1];
    const current = events[cursor];
    if (current - prev > MS_PER_DAY) break;
    cursor -= 1;
  }
  return cursor;
};

const countWindowsInRange = (
  events: ActivityTimestamps,
  startIndex: number,
  endIndex: number,
): number => {
  if (startIndex > endIndex) return 0;
  let index = endIndex;
  let windows = 0;
  let windowEnd = events[endIndex];

  while (index >= startIndex) {
    const windowStart = windowEnd - MS_PER_DAY;
    let found = false;
    while (index >= startIndex) {
      const timestamp = events[index];
      if (timestamp > windowEnd) {
        index -= 1;
        continue;
      }
      if (timestamp > windowStart) {
        found = true;
        index -= 1;
        continue;
      }
      break;
    }
    if (!found) {
      break;
    }
    windows += 1;
    windowEnd = windowStart;
  }

  return windows;
};

const computeBestStreak = (events: ActivityTimestamps): number => {
  if (events.length === 0) return 0;
  let best = 1;
  let runStart = 0;

  for (let index = 0; index < events.length; index += 1) {
    const next = events[index + 1];
    const current = events[index];
    if (typeof next === 'number' && next - current <= MS_PER_DAY) {
      continue;
    }

    const runEndIndex = index;
    const runDays = countWindowsInRange(events, runStart, runEndIndex);
    if (runDays > best) {
      best = runDays;
    }
    runStart = index + 1;
  }

  return best;
};

export const computeSummaryFromEvents = (
  events: ActivityTimestamps,
  timeZone: string,
  now: Date = new Date(),
): StreakSummary => {
  const latestTimestamp = events.length ? events[events.length - 1] : null;
  const lastActivityDate = latestTimestamp ? formatInTimeZone(new Date(latestTimestamp), timeZone) : null;
  const runEndIndex = events.length - 1;
  const runStartIndex = runEndIndex >= 0 ? findRunStartIndex(events, runEndIndex) : -1;
  const hasRecentActivity = latestTimestamp ? now.getTime() - latestTimestamp <= MS_PER_DAY : false;
  const current = hasRecentActivity && runStartIndex >= 0 ? countWindowsInRange(events, runStartIndex, runEndIndex) : 0;
  const best = Math.max(current, computeBestStreak(events));
  const hoursSinceLast = latestTimestamp ? (now.getTime() - latestTimestamp) / 3_600_000 : Number.POSITIVE_INFINITY;
  const streakBrokenRecently = hoursSinceLast > 24 && hoursSinceLast <= 48;
  const milestoneBase = Math.max(current, 1);
  const milestoneMultiplier = Math.max(1, Math.ceil(milestoneBase / 7));
  let nextMilestone = milestoneMultiplier * 7;
  if (nextMilestone === current) {
    nextMilestone += 7;
  }

  return {
    current_streak: current,
    longest_streak: best,
    last_activity_date: lastActivityDate,
    timezone: timeZone,
    next_milestone_days: nextMilestone,
    streak_broken_recently: streakBrokenRecently,
    shields: 0,
  };
};

export const buildHeatmap = (
  activity: ActivityMap,
  timeZone: string,
  days: number,
  now: Date = new Date(),
): StreakDay[] => {
  const safeDays = Number.isFinite(days) && days > 0 ? Math.min(Math.floor(days), 365) : 90;
  const result: StreakDay[] = [];
  let cursor = formatInTimeZone(now, timeZone);

  for (let i = 0; i < safeDays; i += 1) {
    const count = activity.get(cursor) ?? 0;
    result.push({ date: cursor, count, isStreakDay: count > 0 });
    cursor = shiftDayKey(cursor, -1);
  }

  return result.reverse();
};

export const buildStreakAnalytics = async ({
  supabase,
  userId,
  historyDays,
  summaryLookback,
  now,
}: BuildOptions) => {
  const timeZone = await loadUserTimezone(supabase, userId);
  const lookback = Math.max(historyDays, summaryLookback ?? historyDays);
  const rows = await fetchActivityLog(supabase, userId, lookback);
  const activityMap = buildActivityMap(rows, timeZone);
  const activityTimeline = buildActivityTimeline(rows);
  const summary = computeSummaryFromEvents(activityTimeline, timeZone, now);
  const history = buildHeatmap(activityMap, timeZone, historyDays, now);
  return { summary, history };
};

export const loadShieldSummary = async (
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Pick<StreakShields, 'tokens' | 'updated_at' | 'created_at'> | null> => {
  const { data, error } = await supabase
    .from('streak_shields')
    .select('tokens,created_at,updated_at')
    .eq('user_id', userId)
    .maybeSingle<Pick<StreakShields, 'tokens' | 'created_at' | 'updated_at'>>();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data ?? null;
};
