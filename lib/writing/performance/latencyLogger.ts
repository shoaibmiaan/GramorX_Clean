// lib/writing/performance/latencyLogger.ts

export function latencyLogger(label: string) {
  const start = Date.now();
  return () => {
    const ms = Date.now() - start;
    // eslint-disable-next-line no-console
    console.info(`[perf] ${label} ${ms}ms`);
    return ms;
  };
}
