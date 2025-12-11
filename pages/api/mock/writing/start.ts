// pages/api/mock/writing/start.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerClient } from '@/lib/supabaseServer';
import { writingStartSchema } from '@/lib/validation/writing';
import { withPlan } from '@/lib/withPlan';
import type {
  WritingPrompt,
  WritingTaskType,
  WritingModule,
} from '@/types/writing';

type DbWritingPromptRow = {
  id: string;
  slug: string | null;
  topic: string | null;
  prompt_text: string | null;
  task_type: WritingTaskType | null;
  module: WritingModule | null;
  difficulty?: 'easy' | 'medium' | 'hard' | null;
  word_target?: number | null;
  test_slug?: string | null;
  test_title?: string | null;
};

type DbExamAttemptRow = {
  id: string;
  started_at: string | null;
  duration_seconds: number | null;
  status: string | null;
  created_at: string | null;
};

const SELECT_FIELDS =
  'id, slug, topic, prompt_text, task_type, module, difficulty, word_target, test_slug, test_title';

const mapPrompt = (row: DbWritingPromptRow): WritingPrompt => {
  const taskType: WritingTaskType = row.task_type ?? 'task2';
  const module: WritingModule = row.module ?? 'academic';

  return {
    id: row.id,
    slug: row.slug ?? row.id,
    title: row.topic?.trim() || row.test_title?.trim() || 'Untitled',
    promptText: row.prompt_text ?? '',
    taskType,
    module,
    difficulty: row.difficulty ?? null,
    source: null,
    tags: null,
    estimatedMinutes: taskType === 'task1' ? 20 : 40,
    wordTarget:
      row.word_target ??
      (taskType === 'task1' ? 150 : 250),
    metadata: row.test_slug
      ? {
          testSlug: row.test_slug,
          testTitle: row.test_title,
        }
      : null,
  };
};

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
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
      return res
        .status(400)
        .json({ error: 'Invalid payload', issues: parsed.error.flatten() });
    }

    const { promptId, goalBand, mockId } = parsed.data;

    // ===== 1) Resolve "anchor" prompt (which test are we talking about?) =====
    let anchorPrompt: DbWritingPromptRow | null = null;

    // Priority 1: explicit promptId (id OR slug)
    if (promptId) {
      const { data, error } = await supabase
        .from<DbWritingPromptRow>('writing_prompts')
        .select(SELECT_FIELDS)
        .or(`id.eq.${promptId},slug.eq.${promptId}`)
        .maybeSingle();

      if (error) {
        console.error('[writing/start] anchor via promptId failed:', error);
      }
      if (data) {
        anchorPrompt = data;
      }
    }

    // Priority 2: mockId as test_slug if anchor still not found
    if (!anchorPrompt && mockId) {
      const { data, error } = await supabase
        .from<DbWritingPromptRow>('writing_prompts')
        .select(SELECT_FIELDS)
        .eq('test_slug', mockId)
        .eq('task_type', 'task2')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[writing/start] anchor via mockId test_slug failed:', error);
      }
      if (data) {
        anchorPrompt = data;
      }
    }

    // Priority 3: mockId as prompt slug/id if still not found
    if (!anchorPrompt && mockId) {
      const { data, error } = await supabase
        .from<DbWritingPromptRow>('writing_prompts')
        .select(SELECT_FIELDS)
        .or(`id.eq.${mockId},slug.eq.${mockId}`)
        .maybeSingle();

      if (error) {
        console.error('[writing/start] anchor via mockId prompt failed:', error);
      }
      if (data) {
        anchorPrompt = data;
      }
    }

    // Fallback: latest Task 2 in the bank
    if (!anchorPrompt) {
      const { data, error } = await supabase
        .from<DbWritingPromptRow>('writing_prompts')
        .select(SELECT_FIELDS)
        .eq('task_type', 'task2')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        console.error('[writing/start] fallback Task 2 fetch failed:', error);
        return res
          .status(500)
          .json({ error: 'No Task 2 Writing prompt available.' });
      }
      anchorPrompt = data;
    }

    // ===== 2) Pair Task 1 + Task 2 from the same test (enterprise level) =====
    const testSlug =
      anchorPrompt.test_slug || anchorPrompt.slug || anchorPrompt.id;

    let task1Row: DbWritingPromptRow | null = null;
    let task2Row: DbWritingPromptRow | null = null;

    if (anchorPrompt.test_slug) {
      // Ideal path: test_slug is set → use it to fetch both tasks
      const { data: allForTest, error: pairError } = await supabase
        .from<DbWritingPromptRow>('writing_prompts')
        .select(SELECT_FIELDS)
        .eq('test_slug', anchorPrompt.test_slug);

      if (pairError || !allForTest || allForTest.length === 0) {
        console.error('[writing/start] pairing by test_slug failed:', pairError);
        return res.status(500).json({
          error:
            'Writing test misconfigured. No prompts found for this test.',
        });
      }

      task1Row = allForTest.find((p) => p.task_type === 'task1') ?? null;
      task2Row = allForTest.find((p) => p.task_type === 'task2') ?? null;

      if (!task1Row || !task2Row) {
        console.error('[writing/start] missing task in test_slug pairing', {
          testSlug: anchorPrompt.test_slug,
          hasTask1: Boolean(task1Row),
          hasTask2: Boolean(task2Row),
        });
        return res.status(500).json({
          error:
            'Writing test requires both Task 1 and Task 2 prompts. Please contact support.',
        });
      }
    } else {
      // Legacy fallback: no test_slug, just pair "some" Task 1 with this anchor
      if (anchorPrompt.task_type === 'task1') {
        task1Row = anchorPrompt;

        const { data: t2, error: t2Error } = await supabase
          .from<DbWritingPromptRow>('writing_prompts')
          .select(SELECT_FIELDS)
          .eq('task_type', 'task2')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (t2Error || !t2) {
          console.error('[writing/start] legacy Task 2 fetch failed:', t2Error);
          return res
            .status(500)
            .json({ error: 'Task 2 prompt unavailable for Writing test.' });
        }
        task2Row = t2;
      } else {
        task2Row = anchorPrompt;

        const { data: t1, error: t1Error } = await supabase
          .from<DbWritingPromptRow>('writing_prompts')
          .select(SELECT_FIELDS)
          .eq('task_type', 'task1')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (t1Error || !t1) {
          console.error('[writing/start] legacy Task 1 fetch failed:', t1Error);
          return res
            .status(500)
            .json({ error: 'Task 1 prompt unavailable for Writing test.' });
        }
        task1Row = t1;
      }
    }

    // By here we must have both
    if (!task1Row || !task2Row) {
      return res.status(500).json({
        error:
          'Writing test misconfigured. Both Task 1 and Task 2 are required.',
      });
    }

    const durationSeconds = 60 * 60;
    const derivedMockId = testSlug || 'adhoc-writing';

    // ===== 3) Create exam_attempts row for this full test =====
    const { data: attempt, error: attemptError } = await supabase
      .from<DbExamAttemptRow>('exam_attempts')
      .insert({
        user_id: user.id,
        exam_type: 'writing',
        status: 'in_progress',
        duration_seconds: durationSeconds,
        goal_band: goalBand ?? null,
        mock_id: derivedMockId,
        started_at: new Date().toISOString(),
        metadata: {
          mockId: derivedMockId,
          module: 'writing',
          testSlug: anchorPrompt.test_slug ?? null,
          testTitle: anchorPrompt.test_title ?? null,
          promptIds: { task1: task1Row.id, task2: task2Row.id },
        },
      })
      .select('id, started_at, duration_seconds, status, created_at')
      .single();

    if (attemptError || !attempt) {
      console.error('[exam_attempts] Insert failed:', attemptError);
      return res.status(500).json({
        error: 'Failed to create Writing attempt',
        details: attemptError?.message,
      });
    }

    // ===== 4) Non-critical exam_events log =====
    const { error: eventError } = await supabase.from('exam_events').insert({
      attempt_id: attempt.id,
      user_id: user.id,
      event_type: 'start',
      payload: {
        mockId: derivedMockId,
        testSlug: anchorPrompt.test_slug ?? null,
        promptIds: { task1: task1Row.id, task2: task2Row.id },
      },
    });

    if (eventError) {
      console.warn(
        '[exam_events] Insert failed (non-critical for writing/start):',
        eventError,
      );
    }

    // ===== 5) Shape response for CBE client =====
    return res.status(200).json({
      ok: true,
      attempt: {
        id: attempt.id,
        startedAt:
          attempt.started_at ??
          attempt.created_at ??
          new Date().toISOString(),
        durationSeconds: attempt.duration_seconds ?? durationSeconds,
        status: attempt.status ?? 'in_progress',
      },
      prompts: {
        task1: mapPrompt(task1Row),
        task2: mapPrompt(task2Row),
      },
    });
  } catch (error: any) {
    console.error('[/api/mock/writing/start] ERROR:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
    });
  }
}

export default withPlan('free', handler, { allowRoles: ['admin', 'teacher'] });
