// utils/streak.ts
// Local streak tracker (SSR-safe)

export type Streak = {
  count: number;          // consecutive days
  lastLearnedISO: string | null;
};

const KEY_STREAK = 'ieltsStreak';
const KEY_LAST   = 'ieltsLastLearned';

const hasWindow = () => typeof window !== 'undefined';

const readLocal = (k: string) => {
  if (!hasWindow()) return null;
  try { return window.localStorage.getItem(k); } catch { return null; }
};

const writeLocal = (k: string, v: string) => {
  if (!hasWindow()) return;
  try { window.localStorage.setItem(k, v); } catch {}
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const diffDays = (aISO: string, bISO: string) => {
  const a = new Date(aISO + 'T00:00:00Z').getTime();
  const b = new Date(bISO + 'T00:00:00Z').getTime();
  return Math.round((a - b) / 86400000);
};

export function getStreak(): Streak {
  const rawCount = readLocal(KEY_STREAK);
  const rawLast  = readLocal(KEY_LAST);

  const count = rawCount ? Number(rawCount) : 0;
  const lastLearnedISO = rawLast ?? null;

  // reset if user missed more than a day
  if (lastLearnedISO) {
    const missed = diffDays(todayISO(), lastLearnedISO);
    if (missed > 1) {
      return { count: 0, lastLearnedISO: null };
    }
  }

  return { count, lastLearnedISO };
}

export function setStreak(s: Streak) {
  writeLocal(KEY_STREAK, String(s.count));
  if (s.lastLearnedISO) writeLocal(KEY_LAST, s.lastLearnedISO);
}

export function markLearnedOncePerDay(): Streak {
  const t = todayISO();
  const current = getStreak();

  // already counted today
  if (current.lastLearnedISO === t) return current;

  // increment or reset based on gap
  const nextCount =
    current.lastLearnedISO && diffDays(t, current.lastLearnedISO) <= 1
      ? current.count + 1
      : 1;

  const updated: Streak = { count: nextCount, lastLearnedISO: t };
  setStreak(updated);
  return updated;
}

export function resetStreak(): Streak {
  const s: Streak = { count: 0, lastLearnedISO: null };
  setStreak(s);
  return s;
}
