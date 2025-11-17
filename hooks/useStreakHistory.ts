'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchStreakHistory } from '@/lib/streak';
import type { StreakDay } from '@/types/streak';

const DEFAULT_HISTORY_DAYS = 120;

type Options = {
  /**
   * Seed data returned from the server. Prevents flashing the loading state
   * when hydration already includes history data.
   */
  initial?: StreakDay[];
  /** Number of days to request from the API. */
  days?: number;
};

type HistoryState = {
  loading: boolean;
  data: StreakDay[];
  error: string | null;
};

export function useStreakHistory(options?: Options) {
  const { initial, days = DEFAULT_HISTORY_DAYS } = options ?? {};
  const mountedRef = useRef(true);
  const [state, setState] = useState<HistoryState>({
    loading: !initial,
    data: initial ?? [],
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
      const history = await fetchStreakHistory(days);
      if (!mountedRef.current) return;
      setState({ loading: false, data: history, error: null });
    } catch (error) {
      if (!mountedRef.current) return;
      const message = error instanceof Error ? error.message : 'Failed to load streak history';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [days]);

  useEffect(() => {
    if (initial) return;
    void load();
  }, [initial, load]);

  return { ...state, reload: load };
}
