// lib/listening/streak.ts

export type StreakInput = {
  date: string | Date;
};

export type StreakResult = {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string | null;
};

/**
 * Normalise to YYYY-MM-DD (no time, no timezone issues).
 */
function toDayKey(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();

  const mm = month < 10 ? `0${month}` : `${month}`;
  const dd = day < 10 ? `0${day}` : `${day}`;

  return `${year}-${mm}-${dd}`;
}

/**
 * Compute daily streak from an array of attempt dates.
 *
 * - `currentStreak`: consecutive days up to the most recent activity day.
 * - `longestStreak`: best streak in history.
 */
export function computeDailyStreak(entries: StreakInput[]): StreakResult {
  if (!entries.length) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    };
  }

  const daySet = new Set<string>();
  for (const e of entries) {
    const key = toDayKey(e.date);
    if (key) daySet.add(key);
  }

  if (daySet.size === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
    };
  }

  const days = Array.from(daySet).sort(); // ascending

  const lastActiveDate = days[days.length - 1];

  // Helper to convert YYYY-MM-DD → number of days since epoch
  const toDayIndex = (key: string): number => {
    const [yStr, mStr, dStr] = key.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    const d = Number(dStr);
    const date = new Date(Date.UTC(y, m - 1, d));
    return Math.floor(date.getTime() / (24 * 60 * 60 * 1000));
  };

  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < days.length; i++) {
    const prev = toDayIndex(days[i - 1]);
    const curr = toDayIndex(days[i]);

    if (curr - prev === 1) {
      currentRun += 1;
    } else {
      if (currentRun > longestStreak) longestStreak = currentRun;
      currentRun = 1;
    }
  }

  if (currentRun > longestStreak) longestStreak = currentRun;

  // currentStreak is streak ending on the most recent activity day
  const currentStreak = currentRun;

  return {
    currentStreak,
    longestStreak,
    lastActiveDate,
  };
}
