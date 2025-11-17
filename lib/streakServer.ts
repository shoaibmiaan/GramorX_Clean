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

const diffDays = (a: string, b: string): number => {
  const aDate = parseDayKey(a);
  const bDate = parseDayKey(b);
  if (!aDate || !bDate) return Number.POSITIVE_INFINITY;
  return Math.round((bDate.getTime() - aDate.getTime()) / MS_PER_DAY);
};

export const computeSummaryFromMap = (
  activity: ActivityMap,
  timeZone: string,
  now: Date = new Date(),
): StreakSummary => {
  const todayKey = formatInTimeZone(now, timeZone);
  const allKeys = Array.from(activity.keys()).sort();
  const lastActivityDate = allKeys.length ? allKeys[allKeys.length - 1] : null;

  let current = 0;
  let cursor = todayKey;
  while (activity.has(cursor)) {
    current += 1;
    cursor = shiftDayKey(cursor, -1);
  }

  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const key of allKeys) {
    if (previous && diffDays(previous, key) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > best) best = run;
    previous = key;
  }

  if (best === 0 && current > 0) {
    best = current;
  }

  const yesterdayKey = shiftDayKey(todayKey, -1);
  const streakBrokenRecently = !activity.has(todayKey) && activity.has(yesterdayKey);
  const milestoneBase = Math.max(current, 1);
  const milestoneMultiplier = Math.max(1, Math.ceil(milestoneBase / 7));
  let nextMilestone = milestoneMultiplier * 7;
  if (nextMilestone === current) {
    nextMilestone += 7;
  }

  return {
    current_streak: current,
    longest_streak: Math.max(best, current),
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
  const summary = computeSummaryFromMap(activityMap, timeZone, now);
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
