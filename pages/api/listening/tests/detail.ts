// pages/api/listening/tests/detail.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';

const QuerySchema = z.object({
  slug: z.string().min(1).optional(),
  id: z.string().uuid().optional(),
});

type ListeningDifficulty = 'easy' | 'medium' | 'hard';

type ListeningQuestionAPI = {
  id: string;
  questionNumber: number;
  sectionNumber: number;
  type: string;
  prompt: string;
  context: string | null;
  maxScore: number;
  correctAnswers: string[];
};

type ListeningSectionAPI = {
  id: string;
  sectionNumber: number;
  title: string | null;
  description: string | null;
  questions: ListeningQuestionAPI[];
};

type ListeningTestDetailAPI = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: ListeningDifficulty;
  isMock: boolean;
  totalQuestions: number;
  totalScore: number;
  durationSeconds: number;
  audioStorageKey: string | null;
  sections: ListeningSectionAPI[];
};

type Data =
  | { test: ListeningTestDetailAPI }
  | { error: string; details?: unknown };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({
      error: 'Invalid query',
      details: parse.error.flatten(),
    });
  }

  const { slug, id } = parse.data;

  if (!slug && !id) {
    return res.status(400).json({
      error: 'Either slug or id is required',
    });
  }

  const supabase = getServerClient(req, res);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return res.status(500).json({ error: 'Failed to load auth user' });
  }
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // --- Fetch base test ---
  let testQuery = supabase
    .from('listening_tests')
    .select(
      'id, slug, title, description, difficulty, is_mock, total_questions, total_score, duration_seconds, audio_storage_key',
    )
    .limit(1);

  if (id) {
    testQuery = testQuery.eq('id', id);
  } else if (slug) {
    testQuery = testQuery.eq('slug', slug);
  }

  const { data: testRows, error: testError } = await testQuery;

  if (testError) {
    return res.status(500).json({
      error: 'Failed to load listening test',
      details: testError.message,
    });
  }

  if (!testRows || testRows.length === 0) {
    return res.status(404).json({ error: 'Listening test not found' });
  }

  const testRow: any = testRows[0];

  // --- Fetch sections + questions ---
  const { data: sectionRows, error: sectionError } = await supabase
    .from('listening_sections')
    .select(
      'id, section_number, title, description, listening_questions(id, question_number, section_number, type, prompt, context, correct_answers, max_score)',
    )
    .eq('test_id', testRow.id)
    .order('section_number', { ascending: true });

  if (sectionError) {
    return res.status(500).json({
      error: 'Failed to load listening sections',
      details: sectionError.message,
    });
  }

  const sections: ListeningSectionAPI[] =
    sectionRows?.map((s: any) => ({
      id: s.id,
      sectionNumber: s.section_number,
      title: s.title,
      description: s.description,
      questions:
        s.listening_questions?.map((q: any) => ({
          id: q.id,
          questionNumber: q.question_number,
          sectionNumber: q.section_number,
          type: q.type,
          prompt: q.prompt,
          context: q.context,
          maxScore: q.max_score,
          correctAnswers: Array.isArray(q.correct_answers)
            ? q.correct_answers
            : [],
        })) ?? [],
    })) ?? [];

  const test: ListeningTestDetailAPI = {
    id: testRow.id,
    slug: testRow.slug,
    title: testRow.title,
    description: testRow.description,
    difficulty: testRow.difficulty as ListeningDifficulty,
    isMock: !!testRow.is_mock,
    totalQuestions: testRow.total_questions ?? 0,
    totalScore: testRow.total_score ?? 40,
    durationSeconds: testRow.duration_seconds ?? 0,
    audioStorageKey: testRow.audio_storage_key ?? null,
    sections,
  };

  return res.status(200).json({ test });
}
