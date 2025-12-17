// pages/api/mock/writing/submit.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabaseServer';

const Body = z.object({
  testSlug: z.string().min(1), // we'll save this into writing_attempts.prompt_id
  durationSeconds: z.number().int().nonnegative(),
  task1: z.object({
    text: z.string().min(1),
    wordCount: z.number().int().nonnegative(),
  }),
  task2: z.object({
    text: z.string().min(1),
    wordCount: z.number().int().nonnegative(),
  }),
});

type BodyType = z.infer<typeof Body>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  const body: BodyType = parse.data;

  const supabase = getServerClient(req, res);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return res.status(500).json({
      error: 'Failed to fetch user',
      details: userError.message,
    });
  }

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Optional sanity check: make sure the writing test exists
  const { data: test, error: testError } = await supabase
    .from('writing_tests')
    .select('id')
    .eq('slug', body.testSlug)
    .eq('is_active', true)
    .maybeSingle();

  if (testError) {
    // don't hard fail if you want, but better to be strict
    return res.status(500).json({
      error: 'Failed to load writing test',
      details: testError.message,
    });
  }

  if (!test) {
    return res.status(404).json({ error: 'Writing test not found' });
  }

  // 1) Create attempt in writing_attempts
  // prompt_id is TEXT in your schema, we store the test slug there.
  const { data: attemptInsert, error: attemptError } = await supabase
    .from('writing_attempts')
    .insert({
      user_id: user.id,
      prompt_id: body.testSlug,
      // started_at uses DEFAULT now(); we just set submitted_at explicitly.
      submitted_at: new Date().toISOString(),
      // content_text is TEXT, nullable with default ''; we pack both answers as JSON string.
      content_text: JSON.stringify({
        durationSeconds: body.durationSeconds,
        task1: {
          text: body.task1.text,
          wordCount: body.task1.wordCount,
        },
        task2: {
          text: body.task2.text,
          wordCount: body.task2.wordCount,
        },
      }),
      // score_json & ai_feedback_json have default '{}', so no need to touch them now.
    })
    .select('id')
    .single();

  if (attemptError || !attemptInsert) {
    return res.status(500).json({
      error: 'Failed to create writing attempt',
      details: attemptError?.message,
    });
  }

  const attemptId = attemptInsert.id;

  // 2) Insert per-task answers into writing_attempts_answers
  const { error: answersError } = await supabase
    .from('writing_attempts_answers')
    .insert([
      {
        attempt_id: attemptId,
        task_number: 1,
        answer_text: body.task1.text,
        word_count: body.task1.wordCount,
        ai_feedback: null, // fill later when AI scores
      },
      {
        attempt_id: attemptId,
        task_number: 2,
        answer_text: body.task2.text,
        word_count: body.task2.wordCount,
        ai_feedback: null,
      },
    ]);

  if (answersError) {
    return res.status(500).json({
      error: 'Failed to save writing answers',
      details: answersError.message,
    });
  }

  // TODO: later → enqueue AI scoring job and populate score_json / ai_feedback_json

  return res.status(200).json({
    ok: true,
    attemptId,
  });
}
