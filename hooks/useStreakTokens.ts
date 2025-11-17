'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchStreakTokens } from '@/lib/streak';
import type { StreakTokenSummary } from '@/types/streak';

type TokenState = {
  loading: boolean;
  data: StreakTokenSummary | null;
  error: string | null;
};

const defaultState: TokenState = {
  loading: true,
  data: null,
  error: null,
};

export function useStreakTokens(initial?: StreakTokenSummary) {
  const mountedRef = useRef(true);
  const [state, setState] = useState<TokenState>({
    ...defaultState,
    data: initial ?? null,
    loading: initial ? false : defaultState.loading,
  });

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetchStreakTokens();
      if (!mountedRef.current) return;
      setState({ loading: false, data, error: null });
    } catch (error) {
      if (!mountedRef.current) return;
      const message = error instanceof Error ? error.message : 'Failed to load rewards';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  useEffect(() => {
    if (initial) return;
    void load();
  }, [initial, load]);

  return { ...state, reload: load };
}
