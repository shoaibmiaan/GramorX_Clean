// lib/hooks/useAuthState.ts
import useSWR from 'swr';

export type AuthState = {
  user: { id: string; email: string | null; role?: string | null } | null;
  flags: {
    requiresOnboarding: boolean;
    plan: 'free' | 'starter' | 'booster' | 'master';
  };
};

async function fetcher(url: string): Promise<AuthState> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

export function useAuthState() {
  const { data, error } = useSWR<AuthState>(
    '/api/internal/auth/state',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0, // <— kill the spam
    }
  );

  return {
    user: data?.user ?? null,
    flags: data?.flags,
    loading: !data && !error,
    error,
    isAuthenticated: !!data?.user,
  };
}
