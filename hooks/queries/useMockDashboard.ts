import { useEffect, useState, useCallback } from 'react';

type MockDashboardData = any; // tighten later when API is ready

type UseMockDashboardResult = {
  data: MockDashboardData | null;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
};

export const useMockDashboard = (): UseMockDashboardResult => {
  const [data, setData] = useState<MockDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<unknown>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // TODO: replace with real call (e.g. /api/mock/dashboard)
      // For now we just return null so UI doesn’t crash
      const payload: MockDashboardData = null;

      setData(payload);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    isError: Boolean(error),
    error,
    refetch: fetchDashboard,
  };
};

export default useMockDashboard;
