// lib/writing/format/highlightMistakes.ts
// Safe helper to highlight phrases without injecting dangerous HTML.

type HighlightedPart = {
  text: string;
  highlight: boolean;
};

export const highlightMistakes = (text: string, phrases: string[]): HighlightedPart[] => {
  if (!text) return [];
  const safePhrases = (phrases ?? []).filter(Boolean).map((p) => p.toLowerCase());

  const tokens = text.split(/\s+/);
  return tokens.map((t) => {
    const normalized = t.replace(/[^\w']/g, '').toLowerCase();
    const highlight = safePhrases.some((p) => normalized.includes(p));
    return { text: t, highlight };
  });
};
