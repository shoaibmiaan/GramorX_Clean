import { supabaseService } from '@/lib/supabaseServer';
import type { Database } from '@/types/supabase';

import { supabaseBrowser as supabase } from '@/lib/supabaseBrowser';

export type ListeningTestMeta = {
  id: string;
  slug: string;
  test_slug: string;
  title: string;
  level?: 'easy' | 'medium' | 'hard' | null;
  createdAt?: string | null;
  master_audio_url: string | null;
  sections: number;
  totalQuestions: number;
  level?: 'easy' | 'medium' | 'hard' | null;
  createdAt?: string | null;

type ListeningTestRow = {
  test_slug: string;
  title: string | null;
  master_audio_url: string | null;
  level: ListeningTestSummary['level'];
  created_at: string | null;
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

export async function fetchAllListeningTests(): Promise<ListeningTestSummary[]> {
  const client = supabaseService<Database>();

  const { data: tests, error } = await client
    .from('lm_listening_tests')
    .select('test_slug, title, master_audio_url, level, created_at')
    .order('test_slug', { ascending: true })
    .returns<ListeningTestRow[]>();

  if (error || !tests) {
    console.error('[listeningTests] Failed to load tests', error);
    return [];
  }

  const { data: questionRows, error: questionError } = await client
    .from('lm_listening_questions')
    .select('test_slug, section_order')
    .returns<ListeningQuestionRow[]>();

  if (questionError) {
    console.error('[listeningTests] Failed to load question stats', questionError);
  }

  const stats = new Map<string, { sections: Set<number>; questions: number }>();

  for (const row of questionRows ?? []) {
    const slug = row.test_slug;
    if (!slug) continue;

    const entry = stats.get(slug) ?? { sections: new Set<number>(), questions: 0 };
    if (typeof row.section_order === 'number') {
      entry.sections.add(row.section_order);
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

  return tests.map((test) => {
    const slug = test.test_slug;
    const stat = stats.get(slug);

    return {
      id: slug,
      slug,
      title: test.title ?? slug,
      level: test.level ?? null,
      createdAt: test.created_at ?? null,
      master_audio_url: test.master_audio_url ?? null,
      sections: stat ? stat.sections.size : 0,
      totalQuestions: stat?.questions ?? 0,
    } satisfies ListeningTestSummary;
  });
}

export async function fetchAllListeningTests(): Promise<ListeningTestMeta[]> {
  const rows = await fetchAllListeningTestsWithStats(null);
  return rows;
}
