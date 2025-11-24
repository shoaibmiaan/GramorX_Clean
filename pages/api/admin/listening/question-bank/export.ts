// pages/api/admin/listening/question-bank/export.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import { withPlan } from '@/lib/withPlan';

const Query = z.object({
  testId: z.string().uuid().optional(),
  slug: z.string().optional(),
});

type ExportQuestionRow = {
  sectionNumber: number;
  sectionTitle: string | null;
  sectionDescription: string | null;
  questionNumber: number;
  type: string;
  prompt: string;
  context: string | null;
  correctAnswers: string[];
  maxScore: number;
};

type Data =
  | {
      test: {
        id: string;
        slug: string;
        title: string;
      };
      questions: ExportQuestionRow[];
    }
  | { error: string; details?: unknown };

async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = Query.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({
      error: 'Invalid query',
      details: parse.error.flatten(),
    });
  }

  const { testId, slug } = parse.data;

  if (!testId && !slug) {
    return res.status(400).json({
      error: 'Either testId or slug is required',
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

  // Load test
  let testQuery = supabase
    .from('listening_tests')
    .select('id, slug, title')
    .limit(1);

  if (testId) {
    testQuery = testQuery.eq('id', testId);
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

  // Load sections + questions
  const { data: sectionRows, error: sectionError } = await supabase
    .from('listening_sections')
    .select(
      'id, section_number, title, description, listening_questions(id, question_number, type, prompt, context, correct_answers, max_score)',
    )
    .eq('test_id', testRow.id)
    .order('section_number', { ascending: true });

  if (sectionError) {
    return res.status(500).json({
      error: 'Failed to load sections',
      details: sectionError.message,
    });
  }

  const questions: ExportQuestionRow[] = [];

  (sectionRows ?? []).forEach((section: any) => {
    const sectionNumber = section.section_number;
    const sectionTitle = section.title ?? null;
    const sectionDescription = section.description ?? null;

    (section.listening_questions ?? []).forEach((q: any) => {
      questions.push({
        sectionNumber,
        sectionTitle,
        sectionDescription,
        questionNumber: q.question_number,
        type: q.type,
        prompt: q.prompt,
        context: q.context ?? null,
        correctAnswers: Array.isArray(q.correct_answers)
          ? q.correct_answers
          : [],
        maxScore: q.max_score ?? 1,
      });
    });
  });

  return res.status(200).json({
    test: {
      id: testRow.id,
      slug: testRow.slug,
      title: testRow.title,
    },
    questions,
  });
}

export default withPlan('master', handler, { allowRoles: ['admin'] });
