// logic/update-streak.ts
//
// Pure functions for updating a user’s streak based on a new activity
// timestamp.  These helpers encapsulate the calendar‑day logic used
// on the server and can be used for simulation or unit testing.

export interface StreakState {
  current: number;
  longest: number;
  lastActivityAt: string | null; // YYYY‑MM‑DD
}

/**
 * Given the previous streak state (or null if none) and a timestamp
 * representing a new activity, compute the updated state.  All date
 * comparisons are performed in UTC calendar days.  Out‑of‑order
 * events (timestamps before the last activity) do not affect the
 * streak.
 *
 * @param prev    The previous streak snapshot or null if none
 * @param ts      The time of the new activity
 * @returns       A new streak state with updated current/longest counts
 */
export function updateStreakForUser(prev: StreakState | null, ts: Date): StreakState {
  // Normalize the timestamp to UTC date (YYYY‑MM‑DD)
  const dateKey = ts.toISOString().split('T')[0];

  // Initialize new values
  let newCurrent: number;
  let newLongest: number;

  if (!prev) {
    // First ever activity for this user
    newCurrent = 1;
    newLongest = 1;
  } else {
    const prevDate = prev.lastActivityAt;
    const prevCurrent = prev.current;
    const prevLongest = prev.longest;

    if (!prevDate) {
      // We had a row but no lastActivityAt set
      newCurrent = 1;
    } else if (dateKey === prevDate) {
      // Same UTC calendar day -> streak count unchanged
      newCurrent = prevCurrent;
    } else {
      // Compute one day after prevDate
      const prevDateObj = new Date(prevDate + 'T00:00:00Z');
      const nextDay = new Date(prevDateObj.getTime() + 24 * 60 * 60 * 1000);
      const nextDayKey = nextDay.toISOString().split('T')[0];
      if (dateKey === nextDayKey) {
        // Next calendar day -> streak continues
        newCurrent = (prevCurrent || 0) + 1;
      } else if (new Date(dateKey).getTime() > nextDay.getTime()) {
        // Gap of two or more days -> streak resets
        newCurrent = 1;
      } else {
        // Out‑of‑order (earlier than last activity) -> ignore for streak progression
        newCurrent = prevCurrent;
      }
    }
    newLongest = Math.max(prevLongest || 0, newCurrent);
  }

  return {
    current: newCurrent,
    longest: newLongest,
    lastActivityAt: dateKey,
  };
}
