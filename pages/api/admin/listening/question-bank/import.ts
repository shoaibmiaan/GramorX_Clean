// pages/api/admin/listening/question-bank/import.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import { withPlan } from '@/lib/withPlan';

const QuestionInput = z.object({
  sectionNumber: z.number().int().min(1),
  sectionTitle: z.string().optional().nullable(),
  sectionDescription: z.string().optional().nullable(),
  questionNumber: z.number().int().min(1),
  type: z.string().min(1),
  prompt: z.string().min(1),
  context: z.string().optional().nullable(),
  correctAnswers: z.array(z.string()).optional().default([]),
  maxScore: z.number().int().positive().optional().default(1),
});

const Body = z.object({
  testId: z.string().uuid(),
  questions: z.array(QuestionInput).min(1),
  overwrite: z.boolean().optional().default(true),
});

type Data =
  | { importedCount: number }
  | { error: string; details?: unknown };

async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = Body.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      error: 'Invalid body',
      details: parse.error.flatten(),
    });
  }

  const { testId, questions, overwrite } = parse.data;

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

  // Optionally wipe existing bank for this test
  if (overwrite) {
    const { error: delQuestionsError } = await supabase
      .from('listening_questions')
      .delete()
      .eq('test_id', testId);

    if (delQuestionsError) {
      return res.status(500).json({
        error: 'Failed to clear existing questions',
        details: delQuestionsError.message,
      });
    }

    const { error: delSectionsError } = await supabase
      .from('listening_sections')
      .delete()
      .eq('test_id', testId);

    if (delSectionsError) {
      return res.status(500).json({
        error: 'Failed to clear existing sections',
        details: delSectionsError.message,
      });
    }
  }

  // Load existing sections for mapping
  const { data: existingSections, error: sectionsLoadError } = await supabase
    .from('listening_sections')
    .select('id, section_number')
    .eq('test_id', testId);

  if (sectionsLoadError) {
    return res.status(500).json({
      error: 'Failed to load sections',
      details: sectionsLoadError.message,
    });
  }

  const sectionMap = new Map<number, string>();
  (existingSections ?? []).forEach((s: any) => {
    sectionMap.set(s.section_number, s.id);
  });

  // Ensure sections for all sectionNumbers
  const neededSectionNumbers = Array.from(
    new Set(questions.map((q) => q.sectionNumber)),
  ).sort((a, b) => a - b);

  const sectionsToInsert = neededSectionNumbers
    .filter((nr) => !sectionMap.has(nr))
    .map((nr) => {
      const sample = questions.find((q) => q.sectionNumber === nr);
      return {
        test_id: testId,
        section_number: nr,
        title: sample?.sectionTitle ?? null,
        description: sample?.sectionDescription ?? null,
      };
    });

  if (sectionsToInsert.length > 0) {
    const { data: insertedSections, error: insertSectionsError } = await supabase
      .from('listening_sections')
      .insert(sectionsToInsert)
      .select('id, section_number');

    if (insertSectionsError) {
      return res.status(500).json({
        error: 'Failed to create sections',
        details: insertSectionsError.message,
      });
    }

    (insertedSections ?? []).forEach((s: any) => {
      sectionMap.set(s.section_number, s.id);
    });
  }

  // Prepare questions for insert
  const questionsPayload = questions.map((q) => {
    const sectionId = sectionMap.get(q.sectionNumber);
    if (!sectionId) {
      throw new Error(`Missing section id for sectionNumber=${q.sectionNumber}`);
    }
    return {
      test_id: testId,
      section_id: sectionId,
      section_number: q.sectionNumber,
      question_number: q.questionNumber,
      type: q.type,
      prompt: q.prompt,
      context: q.context ?? null,
      correct_answers: q.correctAnswers ?? [],
      max_score: q.maxScore ?? 1,
    };
  });

  const { error: insertQuestionsError } = await supabase
    .from('listening_questions')
    .insert(questionsPayload);

  if (insertQuestionsError) {
    return res.status(500).json({
      error: 'Failed to insert questions',
      details: insertQuestionsError.message,
    });
  }

  return res.status(200).json({ importedCount: questionsPayload.length });
}

export default withPlan('master', handler, { allowRoles: ['admin'] });
