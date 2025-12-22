// lib/writing/performance/evaluationCache.ts
// Per-request in-memory cache to avoid repeated evaluation fetches.

type Loader<T> = () => Promise<T>;

export function createEvaluationCache<T>() {
  const cache = new Map<string, Promise<T>>();

  const get = (key: string, loader: Loader<T>): Promise<T> => {
    if (cache.has(key)) return cache.get(key)!;
    const promise = loader();
    cache.set(key, promise);
    return promise;
  };

  return { get };
}
