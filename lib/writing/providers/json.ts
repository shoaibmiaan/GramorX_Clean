export function safeJsonParse(text: string): { ok: true; json: unknown } | { ok: false; error: string } {
  try {
    return { ok: true, json: JSON.parse(text) };
  } catch {
    // Try to salvage: find first {...} block
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const slice = text.slice(start, end + 1);
      try {
        return { ok: true, json: JSON.parse(slice) };
      } catch (e) {
        return { ok: false, error: `JSON parse failed (salvage failed): ${(e as Error).message}` };
      }
    }
    return { ok: false, error: 'JSON parse failed (no object found)' };
  }
}
