// lib/listening/listeningPaper.ts

import { supabaseBrowser as supabase } from '@/lib/supabaseBrowser';

export type ListeningQuestionType = 'mcq' | 'gap' | 'map' | 'short';

export type ListeningQuestion = {
  id: string;
  prompt: string;
  type: ListeningQuestionType;
  options?: string[];
  answer: string;
};

export type ListeningSection = {
  id: string;
  title: string;
  audioUrl?: string;
  questions: ListeningQuestion[];
};

export type ListeningPaper = {
  id: string; // test_slug
  title: string;
  durationSec: number;
  transcript?: string;
  sections: ListeningSection[];
};

// DB row types (subset of columns we actually use)
type LmListeningTestRow = {
  test_slug: string;
  title: string;
  master_audio_url: string | null;
  meta: Record<string, unknown> | null;
};

type LmListeningQuestionRow = {
  id: string;
  test_slug: string;
  section_order: number;
  q_no: number;
  type: 'mcq' | 'gap';
  prompt: string;
  options: string[] | null;
  answer: string;
};

/**
 * Canonical loader: builds a ListeningPaper from lm_listening_* tables.
 * slug = lm_listening_tests.test_slug (e.g. "sample-listening-1")
 */
export async function fetchListeningPaperBySlug(
  slug: string,
): Promise<ListeningPaper> {
  // 1) Load test meta
  const { data: test, error: testError } = await supabase
    .from<LmListeningTestRow>('lm_listening_tests')
    .select('*')
    .eq('test_slug', slug)
    .single();

  if (testError || !test) {
    console.error('fetchListeningPaperBySlug: testError', testError);
    throw new Error(`Listening test not found for slug: ${slug}`);
  }

  // 2) Load all questions for this test
  const { data: questions, error: qError } = await supabase
    .from<LmListeningQuestionRow>('lm_listening_questions')
    .select('*')
    .eq('test_slug', slug)
    .order('section_order', { ascending: true })
    .order('q_no', { ascending: true });

  if (qError || !questions || questions.length === 0) {
    console.error('fetchListeningPaperBySlug: questionError', qError);
    throw new Error(`No questions found for listening test: ${slug}`);
  }

  // 3) Group by section_order → sections
  const sectionMap = new Map<number, ListeningSection>();

  for (const row of questions) {
    if (!sectionMap.has(row.section_order)) {
      sectionMap.set(row.section_order, {
        id: `${slug}-s${row.section_order}`,
        title: `Section ${row.section_order}`,
        audioUrl: test.master_audio_url || undefined,
        questions: [],
      });
    }

    const section = sectionMap.get(row.section_order)!;

    section.questions.push({
      id: row.id,
      prompt: row.prompt,
      type: row.type, // 'mcq' | 'gap'
      options: row.options ?? undefined,
      answer: row.answer,
    });
  }

  const sections = Array.from(sectionMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, s]) => s);

  // 4) Duration: default 30 minutes (1800 sec) unless you store it in meta
  let durationSec = 1800;
  const meta = test.meta || {};
  const maybeDuration =
    (meta as any).duration_sec ??
    (meta as any).durationSec ??
    (meta as any).duration_seconds;

  if (typeof maybeDuration === 'number' && Number.isFinite(maybeDuration)) {
    durationSec = Math.max(60, Math.round(maybeDuration));
  }

  return {
    id: test.test_slug,
    title: test.title,
    durationSec,
    sections,
  };
}

/**
 * Backwards-compatible alias if other code expects getListeningPaperById.
 * id === test_slug.
 */
export async function getListeningPaperById(
  id: string,
): Promise<ListeningPaper> {
  return fetchListeningPaperBySlug(id);
}
