// pages/api/mock/writing/ai-summary.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';
import type { WritingAISummary } from '@/types/writing';

const Body = z.object({
  attemptId: z.string().uuid(),
});

type Data =
  | { error: string }
  | { summary: WritingAISummary };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = Body.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      error: 'Invalid body',
    });
  }

  const { attemptId } = parse.data;

  const supabase = getServerClient<Database>(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 1) Load attempt + responses
  const { data: attempt, error: attemptErr } = await supabase
    .from('writing_attempts')
    .select(
      `
      id,
      user_id,
      test_id,
      band_score,
      created_at
    `,
    )
    .eq('id', attemptId)
    .single();

  if (attemptErr || !attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  if (attempt.user_id !== user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // TODO: Replace with your real table / columns for stored responses
  // Example guess: writing_attempts_tasks has task1_text, task2_text
  const { data: taskRows, error: tasksErr } = await supabase
    .from('writing_attempts_tasks')
    .select('task_type, content')
    .eq('attempt_id', attemptId);

  if (tasksErr || !taskRows) {
    return res.status(500).json({ error: 'Failed to load writing content' });
  }

  const task1 = taskRows.find((t) => t.task_type === 'task1');
  const task2 = taskRows.find((t) => t.task_type === 'task2');

  const combinedText = [task1?.content ?? '', task2?.content ?? '']
    .filter(Boolean)
    .join('\n\n');

  // 2) Call your AI coach (placeholder)
  // TODO: swap with your real AI call (OpenAI, Gemini, etc.)
  const summary: WritingAISummary = await fakeGenerateWritingAISummary(
    combinedText,
    attempt.band_score != null ? Number(attempt.band_score) : null,
  );

  return res.status(200).json({ summary });
}

// TEMP: stub implementation so TS compiles.
// Replace with real AI integration.
async function fakeGenerateWritingAISummary(
  text: string,
  existingBand: number | null,
): Promise<WritingAISummary> {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length || 0;

  return {
    overallBand: existingBand ?? 6.5,
    wordCount,
    criteria: [
      {
        id: 'task_response',
        label: 'Task Response',
        band: (existingBand ?? 6.5),
        comment:
          'You address most parts of the task but some ideas could be developed more fully.',
      },
      {
        id: 'coherence_and_cohesion',
        label: 'Coherence & Cohesion',
        band: (existingBand ?? 6.5),
        comment:
          'Paragraphing is mostly clear, but some ideas could be grouped or linked more logically.',
      },
      {
        id: 'lexical_resource',
        label: 'Lexical Resource',
        band: (existingBand ?? 6.5),
        comment:
          'Range is adequate with some higher-level vocabulary, but there are occasional word choice issues.',
      },
      {
        id: 'grammatical_range',
        label: 'Grammatical Range & Accuracy',
        band: (existingBand ?? 6.5),
        comment:
          'Mix of simple and complex structures; some errors reduce clarity but do not prevent understanding.',
      },
    ],
    strengths: [
      'You clearly understood the task and included a relevant response.',
      'You used some higher-level vocabulary in the right context.',
    ],
    weaknesses: [
      'Some paragraphs contain multiple ideas without clear topic sentences.',
      'A few sentences are too long and hard to follow.',
    ],
    suggestedNextSteps: [
      'Write one paragraph per main idea and start with a clear topic sentence.',
      'Practice rewriting long sentences into 2–3 shorter, clearer ones.',
      'Collect 10–15 topic-specific synonyms and practice using them in new essays.',
    ],
  };
}