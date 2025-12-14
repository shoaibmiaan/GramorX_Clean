import type { SupabaseClient } from '@supabase/supabase-js';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/types/supabase';

const TIMEZONE = 'Asia/Karachi';
const DATE_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const MS_PER_DAY = 86_400_000;

type StudyTaskRow = {
  scheduled_date?: string | null;
  completed_at?: string | null;
  completed?: boolean | null;
  status?: string | null;
};

export type HeatmapLevel = 'none' | 'started' | 'in_progress' | 'on_track' | 'complete';

export type StreakResponse = {
  ok: true;
  timezone: typeof TIMEZONE;
  today: string;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  productiveDaysLast90: number;
  heatmap: Record<string, HeatmapLevel>;
};

const toDateKey = (value: string | Date): string => {
  const date = typeof value === 'string' ? new Date(value) : value;
  return DATE_FORMATTER.format(date);
};

function rangeKeys(days: number, from: Date): string[] {
  const keys: string[] = [];
  const start = new Date(from.getTime() - (days - 1) * MS_PER_DAY);
  for (let i = 0; i < days; i += 1) {
    keys.push(DATE_FORMATTER.format(new Date(start.getTime() + i * MS_PER_DAY)));
  }
  return keys;
}

type MaybeClient = SupabaseClient<Database> | null | undefined;

async function fetchStudyTaskCompletions(client: MaybeClient, userId: string, sinceISO: string) {
  if (!client || !userId) return new Map<string, number>();

  try {
    const { data, error } = await client
      .from('study_tasks')
      .select('scheduled_date, completed_at, completed, status')
      .eq('user_id', userId)
      .gte('scheduled_date', sinceISO);

    if (error || !data) {
      if (error) console.warn('[streak] study_tasks fetch error:', error.message);
      return new Map<string, number>();
    }

    const map = new Map<string, number>();
    data.forEach((row: StudyTaskRow) => {
      const key = row?.scheduled_date ? toDateKey(`${row.scheduled_date}T00:00:00Z`) : null;
      const completedFlag =
        row?.completed === true ||
        row?.status === 'completed' ||
        typeof row?.completed_at === 'string';

      if (key && completedFlag) {
        map.set(key, (map.get(key) ?? 0) + 1);
      }
    });
    return map;
  } catch (error) {
    console.warn('[streak] study_tasks not available:', (error as Error)?.message);
    return new Map<string, number>();
  }
}

async function fetchAttemptActivity(client: MaybeClient, userId: string, sinceISO: string) {
  const tables = ['attempts_reading', 'attempts_listening', 'attempts_writing', 'attempts_speaking'] as const;
  const activity = new Map<string, number>();

  await Promise.all(
    tables.map(async (table) => {
      try {
        const { data, error } = await client
          ?.from(table)
          .select('created_at')
          .eq('user_id', userId)
          .gte('created_at', sinceISO);

        if (error || !data) {
          if (error) console.warn(`[streak] ${table} fetch error:`, error.message);
          return;
        }

        data.forEach((row: { created_at?: string | null }) => {
          if (!row?.created_at) return;
          const key = toDateKey(row.created_at);
          activity.set(key, (activity.get(key) ?? 0) + 1);
        });
      } catch (error) {
        console.warn(`[streak] ${table} unavailable:`, (error as Error)?.message);
      }
    }),
  );

  return activity;
}

function computeStreaks(days: string[], activity: Set<string>, todayKey: string) {
  let current = 0;
  let longest = 0;
  let rolling = 0;

  days.forEach((key) => {
    if (activity.has(key)) {
      rolling += 1;
      longest = Math.max(longest, rolling);
    } else {
      rolling = 0;
    }
  });

  for (let i = days.length - 1; i >= 0; i -= 1) {
    const key = days[i];
    if (activity.has(key) && (current > 0 || key === todayKey)) {
      current += 1;
    } else if (current > 0 || key === todayKey) {
      break;
    }
  }

  return { currentStreak: current, longestStreak: longest };
}

export async function getServerStreakPayload(
  req: Parameters<typeof getServerClient>[0],
  res: Parameters<typeof getServerClient>[1],
  userId?: string,
) {
  const supabase = getServerClient(req as any, res as any);
  const today = new Date();
  const todayKey = toDateKey(today);
  const last90Keys = rangeKeys(90, today);
  const last365Keys = rangeKeys(365, today);
  const sinceISO = new Date(today.getTime() - (365 - 1) * MS_PER_DAY).toISOString();

  const [tasks, attempts] = await Promise.all([
    fetchStudyTaskCompletions(supabase, userId ?? '', sinceISO),
    fetchAttemptActivity(supabase, userId ?? '', sinceISO),
  ]);

  const activity = new Map<string, number>();
  attempts.forEach((count, key) => activity.set(key, count));
  tasks.forEach((count, key) => activity.set(key, (activity.get(key) ?? 0) + count));

  const activityKeys = new Set(activity.keys());

  const heatmap: Record<string, HeatmapLevel> = {};
  let productiveDaysLast90 = 0;
  last90Keys.forEach((key) => {
    const hasActivity = activityKeys.has(key);
    heatmap[key] = hasActivity ? 'complete' : 'none';
    if (hasActivity) productiveDaysLast90 += 1;
  });

  const { currentStreak, longestStreak } = computeStreaks(last365Keys, activityKeys, todayKey);

  const lastActivityDate = Array.from(activityKeys).sort().pop() ?? null;

  const response: StreakResponse = {
    ok: true,
    timezone: TIMEZONE,
    today: todayKey,
    currentStreak,
    longestStreak,
    lastActivityDate,
    productiveDaysLast90,
    heatmap,
  };

  return response;
}
