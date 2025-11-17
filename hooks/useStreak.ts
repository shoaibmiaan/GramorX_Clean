'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchStreak } from '@/lib/streak';

export type StreakState = {
  loading: boolean;
  current: number;
  longest: number;
  lastDayKey: string | null;
  timezone: string;
  nextMilestone: number;
  streakBrokenRecently: boolean;
  shields: number;
  error: string | null;
};

const baseState: StreakState = {
  loading: true,
  current: 0,
  longest: 0,
  lastDayKey: null,
  timezone: 'Asia/Karachi',
  nextMilestone: 1,
  streakBrokenRecently: false,
  shields: 0,
  error: null,
};

export function useStreak(initial?: Partial<Omit<StreakState, 'loading' | 'error'>>) {
  const mountedRef = useRef(true);
  const [state, setState] = useState<StreakState>({
    ...baseState,
    ...initial,
    loading: initial ? false : baseState.loading,
    error: null,
  });

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchStreak();
      if (!mountedRef.current) return;
      setState({
        loading: false,
        current: data.current_streak,
        longest: data.longest_streak,
        lastDayKey: data.last_activity_date ?? null,
        timezone: data.timezone,
        nextMilestone: data.next_milestone_days,
        streakBrokenRecently: Boolean(data.streak_broken_recently),
        shields: data.shields ?? 0,
        error: null,
      });
    } catch (error) {
      if (!mountedRef.current) return;
      const message = error instanceof Error ? error.message : 'Failed to load streak';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, reload: load };
}
