// hooks/useUserPlan.ts
import { useEffect, useState, useCallback } from 'react';
import type { PlanId } from '@/lib/pricing';
import { PlanIdEnum } from '@/lib/pricing';

type AuthStateUnauthenticated = {
  authenticated: false;
};

type AuthStateAuthenticated = {
  authenticated: true;
  userId: string;
  role: string | null;
  onboardingComplete: boolean;
  planId: PlanId;
};

type ErrorResponse = { error: string };

type AuthStateResponse = AuthStateUnauthenticated | AuthStateAuthenticated | ErrorResponse;

type UseUserPlanResult = {
  loading: boolean;
  isAuthenticated: boolean;
  plan: PlanId | null;
  userId: string | null;
  role: string | null;
  onboardingComplete: boolean;
  isFree: boolean;
  isStarterOrAbove: boolean;
  isBoosterOrAbove: boolean;
  isMaster: boolean;
  error: string | null;
  refetch: () => void;
};

export const useUserPlan = (): UseUserPlanResult => {
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<AuthStateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const fetchState = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/internal/auth/state', {
        method: 'GET',
        credentials: 'include',
      });

      const json: AuthStateResponse = await res.json();
      if (!res.ok) {
        const errMsg =
          'error' in json && typeof json.error === 'string'
            ? json.error
            : `Request failed with status ${res.status}`;
        setError(errMsg);
      } else {
        setData(json);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load auth state',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchState();
  }, [fetchState, refreshToken]);

  const refetch = () => setRefreshToken((prev) => prev + 1);

  const authenticated =
    data && 'authenticated' in data ? data.authenticated === true : false;

  const plan: PlanId | null =
    authenticated && 'planId' in (data as AuthStateAuthenticated)
      ? (data as AuthStateAuthenticated).planId
      : null;

  const userId =
    authenticated && 'userId' in (data as AuthStateAuthenticated)
      ? (data as AuthStateAuthenticated).userId
      : null;

  const role =
    authenticated && 'role' in (data as AuthStateAuthenticated)
      ? (data as AuthStateAuthenticated).role
      : null;

  const onboardingComplete =
    authenticated && 'onboardingComplete' in (data as AuthStateAuthenticated)
      ? Boolean((data as AuthStateAuthenticated).onboardingComplete)
      : false;

  const isFree = !plan || plan === PlanIdEnum.Free;
  const isStarterOrAbove =
    plan === PlanIdEnum.Starter ||
    plan === PlanIdEnum.Booster ||
    plan === PlanIdEnum.Master;
  const isBoosterOrAbove =
    plan === PlanIdEnum.Booster || plan === PlanIdEnum.Master;
  const isMaster = plan === PlanIdEnum.Master;

  return {
    loading,
    isAuthenticated: authenticated,
    plan,
    userId,
    role,
    onboardingComplete,
    isFree,
    isStarterOrAbove,
    isBoosterOrAbove,
    isMaster,
    error,
    refetch,
  };
};
