// lib/listeningTests.ts
// Canonical metadata + helpers for IELTS-style listening mock tests.

export type ListeningTestMeta = {
  id: string;
  slug: string;
  test_slug: string;
  title: string;
  estMinutes: number;
  questions: number;
  sections: number;
  level?: 'easy' | 'medium' | 'hard';
  tags?: string[];
};

// Static config for now – you can hook this to Supabase later if needed.
export const LISTENING_TESTS: ListeningTestMeta[] = [
  {
    id: 'cambridge-16-test-1',
    slug: 'cambridge-16-test-1',
    test_slug: 'cambridge-16-test-1',
    title: 'Cambridge 16 — Test 1',
    estMinutes: 30,
    questions: 40,
    sections: 4,
    level: 'medium',
    tags: ['cambridge', 'mock', 'full-test'],
  },
  {
    id: 'cambridge-16-test-2',
    slug: 'cambridge-16-test-2',
    test_slug: 'cambridge-16-test-2',
    title: 'Cambridge 16 — Test 2',
    estMinutes: 30,
    questions: 40,
    sections: 4,
    level: 'medium',
    tags: ['cambridge', 'mock'],
  },
];

// Simple getters (cover different import styles)

export function getAllListeningTests(): ListeningTestMeta[] {
  return LISTENING_TESTS;
}

export function getListeningTests(): ListeningTestMeta[] {
  return LISTENING_TESTS;
}

export function getListeningTestBySlug(
  slug: string,
): ListeningTestMeta | undefined {
  return LISTENING_TESTS.find((t) => t.slug === slug);
}

// Default export for extra safety if someone did `import x from '@/lib/listeningTests'`
const listeningTests = {
  LISTENING_TESTS,
  getAllListeningTests,
  getListeningTests,
  getListeningTestBySlug,
};

export default listeningTests;
