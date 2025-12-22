// lib/writing/performance/autosaveThrottle.ts
// Simple guard to avoid spamming autosave requests.

export type AutosaveSnapshot = {
  contentHash: string;
  timestamp: number;
};

export function createAutosaveThrottle(minIntervalMs = 2000) {
  let last: AutosaveSnapshot | null = null;

  const shouldSend = (content: string | undefined): boolean => {
    const hash = String(content ?? '').trim();
    const now = Date.now();
    if (!hash) return false;
    if (!last) {
      last = { contentHash: hash, timestamp: now };
      return true;
    }
    const unchanged = last.contentHash === hash;
    const tooSoon = now - last.timestamp < minIntervalMs;

    if (unchanged && tooSoon) return false;

    last = { contentHash: hash, timestamp: now };
    return true;
  };

  const reset = () => {
    last = null;
  };

  return { shouldSend, reset };
}
