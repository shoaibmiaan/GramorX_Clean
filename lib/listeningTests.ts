// lib/listeningTests.ts

import { supabaseBrowser as supabase } from '@/lib/supabaseBrowser';

export type ListeningTestMeta = {
  id: string;
  slug: string;
  test_slug: string;
  title: string;
  master_audio_url: string | null;

  sections: number;
  totalQuestions: number;
  level?: 'easy' | 'medium' | 'hard' | null;
  createdAt?: string | null;

  lastAttempt?: {
    submitted_at: string | null;
    score_json?: any;
  };
};

export type ListeningTestSummary = Pick<
  ListeningTestMeta,
  'id' | 'slug' | 'title' | 'level' | 'createdAt'
>;

export async function fetchAllListeningTestsWithStats(
  userId: string | null,
): Promise<ListeningTestMeta[]> {
  // 1) Base tests
  const { data: tests, error } = await supabase
    .from('lm_listening_tests')
    .select('test_slug, title, master_audio_url, level, created_at')
    .order('test_slug', { ascending: true });

  if (error || !tests) return [];

  const results: ListeningTestMeta[] = [];

  for (const test of tests) {
    const slug = test.test_slug;

    // 2) Count sections
    const { count: sectionCount } = await supabase
      .from('lm_listening_questions')
      .select('section_order', { count: 'exact', head: true })
      .eq('test_slug', slug);

    // 3) Count total questions
    const { count: questionCount } = await supabase
      .from('lm_listening_questions')
      .select('id', { count: 'exact', head: true })
      .eq('test_slug', slug);

    // 4) User’s last attempt (resume or completed)
    let lastAttempt = null;
    if (userId) {
      const { data: attempt } = await supabase
        .from('attempts_listening')
        .select('submitted_at, score_json')
        .eq('user_id', userId)
        .eq('paper_id', slug)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      lastAttempt = attempt || null;
    }

    results.push({
      id: slug,
      slug,
      test_slug: slug,
      title: test.title,
      master_audio_url: test.master_audio_url,
      sections: sectionCount ?? 0,
      totalQuestions: questionCount ?? 0,
      level: (test as { level?: ListeningTestMeta['level'] }).level ?? null,
      createdAt: (test as { created_at?: string | null }).created_at ?? null,
      lastAttempt,
    });
  }

  return results;
}

export async function fetchAllListeningTests(): Promise<ListeningTestMeta[]> {
  const rows = await fetchAllListeningTestsWithStats(null);
  return rows;
}
