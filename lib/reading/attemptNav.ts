// lib/reading/attemptNav.ts
export const carryAttemptCtx = (query: Record<string, any>) => {
  const q = new URLSearchParams();

  // carry lightweight context flags (keeps Weekly/Daily flows coherent)
  if (query.weekly) q.set('weekly', '1');
  if (query.daily) q.set('daily', '1');

  // optional: where user came from (future-proof)
  if (query.from) q.set('from', String(query.from));

  const s = q.toString();
  return s ? `?${s}` : '';
};
