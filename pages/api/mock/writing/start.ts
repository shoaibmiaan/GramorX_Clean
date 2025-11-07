// pages/api/mock/writing/start.ts
// Creates an exam_attempts row and returns the prompts required for the session.

import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import { writingStartSchema } from '@/lib/validation/writing';
import type { WritingPrompt } from '@/types/writing';

const mapPrompt = (row: any): WritingPrompt => {
  // Normalize fields coming from `writing_prompts` (topic/outline_json) or older schemas
  const topic: string | null =
    (typeof row.topic === 'string' && row.topic) ? row.topic : null;

  const promptText: string | null =
    (typeof row.prompt_text === 'string' && row.prompt_text) ? row.prompt_text
    : (row?.outline_json?.outline_summary ? String(row.outline_json.outline_summary) : null) ||
      topic || null;

  const taskType: string =
    (typeof row.task_type === 'string' && row.task_type) ? row.task_type : 'task2';

  // difficulty could be int; keep original but provide a readable fallback if needed
  const difficulty =
    row?.difficulty ?? null;

  return {
    id: row.id,
    slug: row.slug ?? row.id,
    title: topic ?? 'Untitled',
    promptText,                      // may be null — never undefined
    taskType,                        // 'task1' | 'task2' (fallback 'task2')
    module: row.module ?? 'academic',
    difficulty,
    source: row.source ?? null,
    tags: row.tags ?? null,
    estimatedMinutes: row.estimated_minutes ?? null,
    wordTarget: row.word_target ?? null,
    metadata: row.metadata ?? null,
  } as WritingPrompt;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getServerClient(req, res);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = writingStartSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', issues: parsed.error.flatten() });
  }

  const { promptId, goalBand, mockId } = parsed.data;

  // Pick latest Task 1
  const { data: task1Row, error: task1Error } = await supabase
    .from('writing_prompts')
    .select('*')
    .eq('task_type', 'task1')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (task1Error || !task1Row) {
    return res.status(500).json({ error: 'Task 1 prompt unavailable' });
  }

  // Get Task 2 (explicit promptId match by id/slug if provided; otherwise latest)
  let task2Row: any = null;
  if (promptId) {
    const { data } = await supabase
      .from('writing_prompts')
      .select('*')
      .or(`id.eq.${promptId},slug.eq.${promptId}`)
      .maybeSingle();
    task2Row = data ?? null;
  }
  if (!task2Row) {
    const { data, error } = await supabase
      .from('writing_prompts')
      .select('*')
      .eq('task_type', 'task2')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) {
      return res.status(500).json({ error: 'Task 2 prompt unavailable' });
    }
    task2Row = data;
  }

  const durationSeconds = 60 * 60;

  // Satisfy NOT NULL constraints you have on exam_attempts: module + mock_id
  const derivedMockId =
    (typeof mockId === 'string' && mockId) ? mockId
    : (task2Row?.slug ?? task2Row?.id ?? 'adhoc');

  const { data: attempt, error: attemptError } = await supabase
    .from('exam_attempts')
    .insert({
      user_id: user.id,
      module: 'writing',                 // ✅ satisfies exam_attempts_module_check
      mock_id: derivedMockId,            // ✅ satisfies NOT NULL mock_id
      exam_type: 'writing',              // keep for backward-compat if present
      status: 'in_progress',
      duration_seconds: durationSeconds,
      goal_band: goalBand ?? null,
      metadata: {
        mockId: derivedMockId,
        promptIds: {
          task1: task1Row.id,
          task2: task2Row.id,
        },
      },
    })
    .select('*')
    .single();

  if (attemptError || !attempt) {
    // Extra logging helped earlier — keep it concise
    return res.status(500).json({ error: 'Failed to create attempt' });
  }

  await supabase.from('exam_events').insert({
    attempt_id: attempt.id,
    user_id: user.id,
    event_type: 'start',
    payload: {
      mockId: derivedMockId,
      promptIds: {
        task1: task1Row.id,
        task2: task2Row.id,
      },
    },
  });

  return res.status(200).json({
    ok: true,
    attempt: {
      id: attempt.id,
      startedAt: attempt.started_at ?? null,
      durationSeconds: attempt.duration_seconds ?? durationSeconds,
      status: attempt.status ?? 'in_progress',
    },
    prompts: {
      task1: mapPrompt(task1Row),
      task2: mapPrompt(task2Row),
    },
  });
}
