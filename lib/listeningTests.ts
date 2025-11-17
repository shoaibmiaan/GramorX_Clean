import { supabaseService } from '@/lib/supabaseServer';
import type { Database } from '@/types/supabase';

export type ListeningTestSummary = {
  id: string;
  slug: string;
  title: string;
  level?: 'easy' | 'medium' | 'hard' | null;
  createdAt?: string | null;
  master_audio_url: string | null;
  sections: number;
  totalQuestions: number;
};

type ListeningTestRow = {
  test_slug: string;
  title: string | null;
  master_audio_url: string | null;
  level: ListeningTestSummary['level'];
  created_at: string | null;
};

type ListeningQuestionRow = {
  test_slug: string;
  section_order: number | null;
};

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
    entry.questions += 1;
    stats.set(slug, entry);
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
