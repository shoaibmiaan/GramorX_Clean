import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const Query = z.object({
  attemptId: z.string().uuid(),
});

type AttemptStatus = 'created' | 'in_progress' | 'submitted' | 'evaluated';

type TaskPrompt = {
  taskNumber: 1 | 2;
  title: string | null;
  instruction: string | null;
  prompt: string | null;
  wordLimit: number | null;
};

type GetAttemptResponse =
  | {
      ok: true;
      attempt: {
        id: string;
        mode: 'academic' | 'general';
        status: AttemptStatus;
        startedAt: string;
        submittedAt: string | null;
        evaluatedAt: string | null;
        durationSeconds: number;
        remainingSeconds: number | null;
      };
      answers: Array<{
        taskNumber: 1 | 2;
        answerText: string;
        wordCount: number;
        lastSavedAt: string;
      }>;
      tasks: TaskPrompt[];
    }
  | { ok: false; error: string; details?: unknown };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetAttemptResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const parse = Query.safeParse(req.query);
  if (!parse.success) {
    return res
      .status(400)
      .json({ ok: false, error: 'Invalid query', details: parse.error.flatten() });
  }

  // ✅ Auth via cookie session
  const supabase = getServerClient(req, res);
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  const user = auth?.user;

  if (authErr || !user) {
    return res.status(401).json({ ok: false, error: 'Unauthorized', details: authErr ?? null });
  }

  const { attemptId } = parse.data;

  // ✅ Read attempt via service role to avoid RLS “ghost 404”
  // NOTE: your writing_attempts table DOES NOT have test_id
  const { data: attempt, error: attemptErr } = await supabaseAdmin
    .from('writing_attempts')
    .select(
      'id, user_id, mode, status, started_at, submitted_at, evaluated_at, duration_seconds, remaining_seconds'
    )
    .eq('id', attemptId)
    .single();

  if (attemptErr || !attempt) {
    return res.status(404).json({
      ok: false,
      error: 'Attempt not found',
      details: attemptErr ?? null,
    });
  }

  // ✅ Ownership guard (security)
  if (attempt.user_id !== user.id) {
    return res.status(403).json({ ok: false, error: 'Forbidden' });
  }

  // Answers (service role read)
  const { data: answers, error: ansErr } = await supabaseAdmin
    .from('writing_attempt_answers')
    .select('task_number, answer_text, word_count, last_saved_at')
    .eq('attempt_id', attemptId)
    .order('task_number', { ascending: true });

  if (ansErr) {
    return res.status(500).json({ ok: false, error: 'Failed to load answers', details: ansErr });
  }

  // ✅ TEMP FIX: Always return prompts, even without test_id
  // Later: replace with writing_tasks lookup once you add attempt.test_id.
  const tasks: TaskPrompt[] = [
    {
      taskNumber: 1,
      title: 'Writing Task 1',
      instruction:
        attempt.mode === 'academic'
          ? 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
          : 'Write a letter. Use the correct tone and cover all bullet points.',
      prompt:
        attempt.mode === 'academic'
          ? 'The chart below gives information about ... (placeholder). Summarise the information by selecting and reporting the main features.'
          : 'You recently had a problem with a service you purchased. Write a letter to the company. In your letter:\n- explain the problem\n- describe what you have already done\n- say what action you would like the company to take',
      wordLimit: 150,
    },
    {
      taskNumber: 2,
      title: 'Writing Task 2',
      instruction:
        'Write an essay in response to the question below. Give reasons for your answer and include any relevant examples from your own knowledge or experience.',
      prompt:
        'Some people think that technology has made life more complicated, while others believe it has made life easier. Discuss both views and give your own opinion.',
      wordLimit: 250,
    },
  ];

  return res.status(200).json({
    ok: true,
    attempt: {
      id: attempt.id,
      mode: attempt.mode,
      status: attempt.status,
      startedAt: attempt.started_at,
      submittedAt: attempt.submitted_at,
      evaluatedAt: attempt.evaluated_at,
      durationSeconds: attempt.duration_seconds ?? 3600,
      remainingSeconds: attempt.remaining_seconds ?? null,
    },
    answers: (answers ?? []).map((a: any) => ({
      taskNumber: a.task_number,
      answerText: a.answer_text ?? '',
      wordCount: a.word_count ?? 0,
      lastSavedAt: a.last_saved_at,
    })),
    tasks,
  });
}
