// pages/api/writing/start-attempt.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabaseServer';

const Body = z.object({
  mode: z.enum(['academic', 'general']),
  durationSeconds: z.number().int().positive().optional(), // fallback 3600
  testId: z.string().uuid().optional(), // ✅ optional real test linkage
});

type StartAttemptResponse =
  | {
      ok: true;
      attemptId: string;
      mode: 'academic' | 'general';
      status: 'created';
      startedAt: string;
      durationSeconds: number;
    }
  | { ok: false; error: string; details?: unknown };

type TaskSeed = {
  taskNumber: 1 | 2;
  title: string;
  instruction: string;
  prompt: string;
  wordLimit: number;
};

function buildInstruction(mode: 'academic' | 'general', taskNumber: 1 | 2) {
  if (taskNumber === 1) {
    return mode === 'academic'
      ? 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.'
      : 'Write a letter. Use the correct tone and cover all bullet points.';
  }
  return 'Write an essay in response to the question below. Give reasons for your answer and include any relevant examples from your own knowledge or experience.';
}

function fallbackTasks(mode: 'academic' | 'general'): TaskSeed[] {
  // ✅ Not “placeholder” garbage; proper usable prompts
  if (mode === 'academic') {
    return [
      {
        taskNumber: 1,
        title: 'Writing Task 1',
        instruction: buildInstruction('academic', 1),
        prompt:
          'The chart below shows the percentage of households in a country that owned different types of technology in 2000 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        wordLimit: 150,
      },
      {
        taskNumber: 2,
        title: 'Writing Task 2',
        instruction: buildInstruction('academic', 2),
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
      instruction: buildInstruction('general', 1),
      prompt:
        'You recently bought a product online, but it arrived damaged.\n\nWrite a letter to the company. In your letter:\n- explain what happened\n- describe how this has affected you\n- say what you would like the company to do',
      wordLimit: 150,
    },
    {
      taskNumber: 2,
      title: 'Writing Task 2',
      instruction: buildInstruction('general', 2),
      prompt:
        'In many countries, people are working longer hours and have less free time.\n\nWhat do you think are the causes of this? What solutions can governments and employers provide?',
      wordLimit: 250,
    },
  ];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<StartAttemptResponse>) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const parse = Body.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ ok: false, error: 'Invalid body', details: parse.error.flatten() });

  const { mode, durationSeconds, testId } = parse.data;

  const supabase = getServerClient(req, res);

  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user) return res.status(401).json({ ok: false, error: 'Unauthorized', details: authErr ?? null });

  const user = auth.user;

  // ✅ Build tasks (from DB if testId is present, else fallback prompts)
  let tasks: TaskSeed[] | null = null;

  if (testId) {
    const { data: taskRows, error: tasksErr } = await supabase
      .from('writing_tasks')
      .select('task_number, prompt, word_limit_min')
      .eq('test_id', testId)
      .order('task_number', { ascending: true });

    if (!tasksErr && Array.isArray(taskRows) && taskRows.length >= 2) {
      const t1 = taskRows.find((t) => Number(t.task_number) === 1);
      const t2 = taskRows.find((t) => Number(t.task_number) === 2);

      if (t1?.prompt && t2?.prompt) {
        tasks = [
          {
            taskNumber: 1,
            title: 'Writing Task 1',
            instruction: buildInstruction(mode, 1),
            prompt: String(t1.prompt),
            wordLimit: Number(t1.word_limit_min ?? 150),
          },
          {
            taskNumber: 2,
            title: 'Writing Task 2',
            instruction: buildInstruction(mode, 2),
            prompt: String(t2.prompt),
            wordLimit: Number(t2.word_limit_min ?? 250),
          },
        ];
      }
    }
  }

  if (!tasks) tasks = fallbackTasks(mode);

  const dur = durationSeconds ?? 3600;

  // 1) Create attempt
  const { data: attempt, error: attemptErr } = await supabase
    .from('writing_attempts')
    .insert({
      user_id: user.id,
      mode,
      status: 'created',
      duration_seconds: dur,
      remaining_seconds: dur,
    })
    .select('id, mode, status, started_at, duration_seconds')
    .single();

  if (attemptErr || !attempt) {
    return res.status(500).json({ ok: false, error: 'Failed to create attempt', details: attemptErr ?? null });
  }

  // 2) Pre-create Task 1 & 2 answer rows (empty) + ✅ store prompts here
  const { error: ansErr } = await supabase.from('writing_attempt_answers').insert([
    {
      attempt_id: attempt.id,
      task_number: 1,
      answer_text: '',
      word_count: 0,
      prompt_title: tasks[0].title,
      prompt_instruction: tasks[0].instruction,
      prompt_text: tasks[0].prompt,
      word_limit: tasks[0].wordLimit,
    },
    {
      attempt_id: attempt.id,
      task_number: 2,
      answer_text: '',
      word_count: 0,
      prompt_title: tasks[1].title,
      prompt_instruction: tasks[1].instruction,
      prompt_text: tasks[1].prompt,
      word_limit: tasks[1].wordLimit,
    },
  ]);

  if (ansErr) {
    return res.status(500).json({ ok: false, error: 'Failed to create answer rows', details: ansErr ?? null });
  }

  return res.status(200).json({
    ok: true,
    attemptId: attempt.id,
    mode: attempt.mode,
    status: 'created',
    startedAt: attempt.started_at,
    durationSeconds: attempt.duration_seconds,
  });
}
