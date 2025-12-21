// pages/api/writing/get-attempt.ts
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

function fallbackTasks(mode: 'academic' | 'general'): TaskPrompt[] {
  // only used for legacy attempts created before we stored prompt fields
  if (mode === 'academic') {
    return [
      {
        taskNumber: 1,
        title: 'Writing Task 1',
        instruction:
          'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        prompt:
          'The chart below shows the percentage of households in a country that owned different types of technology in 2000 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        wordLimit: 150,
      },
      {
        taskNumber: 2,
        title: 'Writing Task 2',
        instruction:
          'Write an essay in response to the question below. Give reasons for your answer and include any relevant examples from your own knowledge or experience.',
        prompt:
          'Some people think schools should teach practical skills like managing money, while others believe traditional academic subjects should remain the focus.\n\nDiscuss both views and give your own opinion.',
        wordLimit: 250,
      },
    ];
  }

  return [
    {
      taskNumber: 1,
      title: 'Writing Task 1',
      instruction: 'Write a letter. Use the correct tone and cover all bullet points.',
      prompt:
        'You recently bought a product online, but it arrived damaged.\n\nWrite a letter to the company. In your letter:\n- explain what happened\n- describe how this has affected you\n- say what you would like the company to do',
      wordLimit: 150,
    },
    {
      taskNumber: 2,
      title: 'Writing Task 2',
      instruction:
        'Write an essay in response to the question below. Give reasons for your answer and include any relevant examples from your own knowledge or experience.',
      prompt:
        'In many countries, people are working longer hours and have less free time.\n\nWhat do you think are the causes of this? What solutions can governments and employers provide?',
      wordLimit: 250,
    },
  ];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<GetAttemptResponse>) {
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const parse = Query.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({ ok: false, error: 'Invalid query', details: parse.error.flatten() });
  }

  const supabase = getServerClient(req, res);
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  const user = auth?.user;

  if (authErr || !user) return res.status(401).json({ ok: false, error: 'Unauthorized', details: authErr ?? null });

  const { attemptId } = parse.data;

  const { data: attempt, error: attemptErr } = await supabaseAdmin
    .from('writing_attempts')
    .select('id, user_id, mode, status, started_at, submitted_at, evaluated_at, duration_seconds, remaining_seconds')
    .eq('id', attemptId)
    .single();

  if (attemptErr || !attempt) {
    return res.status(404).json({ ok: false, error: 'Attempt not found', details: attemptErr ?? null });
  }

  if (attempt.user_id !== user.id) return res.status(403).json({ ok: false, error: 'Forbidden' });

  const { data: answers, error: ansErr } = await supabaseAdmin
    .from('writing_attempt_answers')
    .select('task_number, answer_text, word_count, last_saved_at, prompt_title, prompt_instruction, prompt_text, word_limit')
    .eq('attempt_id', attemptId)
    .order('task_number', { ascending: true });

  if (ansErr) return res.status(500).json({ ok: false, error: 'Failed to load answers', details: ansErr });

  // ✅ Build tasks from stored prompt fields (new attempts)
  const t1 = (answers ?? []).find((a: any) => Number(a.task_number) === 1);
  const t2 = (answers ?? []).find((a: any) => Number(a.task_number) === 2);

  const hasStoredPrompts =
    Boolean(t1?.prompt_text) && Boolean(t2?.prompt_text) && (t1?.word_limit != null) && (t2?.word_limit != null);

  const tasks: TaskPrompt[] = hasStoredPrompts
    ? [
        {
          taskNumber: 1,
          title: t1?.prompt_title ?? 'Writing Task 1',
          instruction: t1?.prompt_instruction ?? null,
          prompt: t1?.prompt_text ?? null,
          wordLimit: typeof t1?.word_limit === 'number' ? t1.word_limit : 150,
        },
        {
          taskNumber: 2,
          title: t2?.prompt_title ?? 'Writing Task 2',
          instruction: t2?.prompt_instruction ?? null,
          prompt: t2?.prompt_text ?? null,
          wordLimit: typeof t2?.word_limit === 'number' ? t2.word_limit : 250,
        },
      ]
    : fallbackTasks(attempt.mode);

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
