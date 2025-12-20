// pages/api/writing/worker/run-once.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import { evaluateWritingAttempt } from '@/lib/writing/evaluation/evaluate';
import type { WritingEvalInput } from '@/lib/writing/evaluation/types';

type ApiOk =
  | { ok: true; processed: true; attemptId: string; mode: 'queued' | 'forced' | 'already_done' }
  | { ok: true; processed: false; reason: 'no_jobs' };

type ApiErr = { ok: false; error: string };

const Body = z.object({
  // Optional: run worker for a specific attempt (debug / admin)
  attemptId: z.string().uuid().optional(),
});

const ANSWER_TABLE_CANDIDATES = [
  // common names
  'writing_attempt_answers',
  'writing_user_answers',
] as const;

type AnswerRow = {
  task_number: number | null;
  text: string | null;
};

const pickText = (rows: AnswerRow[] | null | undefined, taskNumber: 1 | 2) => {
  const row = rows?.find((r) => Number(r.task_number) === taskNumber);
  return String(row?.text ?? '').trim();
};

async function loadAnswers(supabase: ReturnType<typeof getServerClient>, attemptId: string) {
  for (const table of ANSWER_TABLE_CANDIDATES) {
    const { data, error } = await supabase
      .from(table)
      .select('task_number, text')
      .eq('attempt_id', attemptId);

    if (!error && Array.isArray(data)) {
      return { tableUsed: table, rows: data as AnswerRow[] };
    }
  }
  return { tableUsed: null as string | null, rows: [] as AnswerRow[] };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>,
) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  // Worker auth
  const secret = process.env.WRITING_WORKER_SECRET;
  const headerSecret = req.headers['x-worker-secret'];
  const provided = Array.isArray(headerSecret) ? headerSecret[0] : headerSecret;

  if (!secret) return res.status(500).json({ ok: false, error: 'WRITING_WORKER_SECRET not set' });
  if (!provided || provided !== secret) return res.status(401).json({ ok: false, error: 'Unauthorized' });

  const parse = Body.safeParse(req.body ?? {});
  if (!parse.success) return res.status(400).json({ ok: false, error: 'Invalid body' });

  const supabase = getServerClient(req, res);

  const forcedAttemptId = parse.data.attemptId;

  // 1) Find a job (or create one if forced)
  let attemptId: string | null = null;

  if (forcedAttemptId) {
    attemptId = forcedAttemptId;

    // Ensure job row exists so your UI + DB stays consistent
    await supabase.from('writing_eval_jobs').upsert(
      {
        attempt_id: attemptId,
        status: 'queued',
        attempts: 0,
        locked_at: null,
        last_error: null,
      },
      { onConflict: 'attempt_id' },
    );
  } else {
    const { data: jobRow, error: jobErr } = await supabase
      .from('writing_eval_jobs')
      .select('attempt_id, status, attempts')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (jobErr) return res.status(500).json({ ok: false, error: 'Failed to fetch job' });
    if (!jobRow) return res.status(200).json({ ok: true, processed: false, reason: 'no_jobs' });

    attemptId = String(jobRow.attempt_id);
  }

  if (!attemptId) return res.status(200).json({ ok: true, processed: false, reason: 'no_jobs' });

  // 2) Lock job
  const { data: existingJob, error: jobFetchErr } = await supabase
    .from('writing_eval_jobs')
    .select('attempt_id, status, attempts')
    .eq('attempt_id', attemptId)
    .maybeSingle();

  if (jobFetchErr || !existingJob) {
    return res.status(500).json({ ok: false, error: 'Job not found (unexpected)' });
  }

  // If someone else is running it, we still proceed in dev; but keep it safe:
  const nextAttempts = Number(existingJob.attempts ?? 0) + 1;

  const { error: lockErr } = await supabase
    .from('writing_eval_jobs')
    .update({
      status: 'running',
      locked_at: new Date().toISOString(),
      attempts: nextAttempts,
      last_error: null,
    })
    .eq('attempt_id', attemptId)
    .in('status', ['queued', 'running']); // allow resume

  if (lockErr) return res.status(500).json({ ok: false, error: 'Failed to lock job' });

  try {
    // 3) If evaluation already exists, mark job done and exit (idempotent)
    const { data: existingEval, error: existingEvalErr } = await supabase
      .from('writing_evaluations')
      .select('attempt_id')
      .eq('attempt_id', attemptId)
      .maybeSingle();

    if (existingEvalErr) throw new Error('Failed to check existing evaluation');

    if (existingEval?.attempt_id) {
      await supabase.from('writing_eval_jobs').update({ status: 'done', last_error: null }).eq('attempt_id', attemptId);

      // attempt might have evaluated_at empty, set it
      await supabase
        .from('writing_attempts')
        .update({ evaluated_at: new Date().toISOString() })
        .eq('id', attemptId)
        .is('evaluated_at', null);

      return res.status(200).json({ ok: true, processed: true, attemptId, mode: 'already_done' });
    }

    // 4) Load attempt
    const { data: attempt, error: attemptErr } = await supabase
      .from('writing_attempts')
      .select('id, user_id, mode, status')
      .eq('id', attemptId)
      .maybeSingle();

    if (attemptErr) throw new Error('Failed to load attempt');
    if (!attempt) throw new Error('Attempt not found');

    const attemptStatus = String(attempt.status ?? '');
    if (attemptStatus !== 'submitted' && attemptStatus !== 'locked') {
      throw new Error(`Attempt not ready (status=${attemptStatus})`);
    }

    const userId = String(attempt.user_id);

    // 5) Load answers (tries multiple table names)
    const { tableUsed, rows } = await loadAnswers(supabase, attemptId);

    const task1Text = pickText(rows, 1);
    const task2Text = pickText(rows, 2);

    // If nothing found, fail clearly (don’t store fake eval)
    if (!task1Text && !task2Text) {
      throw new Error(
        `No answers found for attempt. Checked tables: ${ANSWER_TABLE_CANDIDATES.join(', ')}.`,
      );
    }

    // 6) Prompts / mins (fallback defaults — your schema didn’t show test linkage)
    const task1Prompt = '';
    const task2Prompt = '';

    const task1Min = 150;
    const task2Min = 250;

    // 7) Evaluate (Day 23 strict rules)
    const input: WritingEvalInput = {
      attemptId,
      userId,
      task1: { prompt: task1Prompt, text: task1Text, minWords: task1Min },
      task2: { prompt: task2Prompt, text: task2Text, minWords: task2Min },
      meta: { answers_table: tableUsed ?? 'unknown', mode: String(attempt.mode ?? '') },
    };

    const evalResult = await evaluateWritingAttempt(input);

    // 8) Store evaluation (idempotent upsert)
    const { error: storeErr } = await supabase.from('writing_evaluations').upsert(
      {
        attempt_id: attemptId,
        user_id: userId,

        overall_band: evalResult.overallBand,
        task1_band: evalResult.task1Band,
        task2_band: evalResult.task2Band,

        criteria_tr: evalResult.criteria.TR,
        criteria_cc: evalResult.criteria.CC,
        criteria_lr: evalResult.criteria.LR,
        criteria_gra: evalResult.criteria.GRA,

        short_verdict_task1: evalResult.shortVerdictTask1 ?? null,
        short_verdict_task2: evalResult.shortVerdictTask2 ?? null,

        criteria_notes: evalResult.criteriaNotes ?? {},
        task_notes: evalResult.taskNotes ?? {},

        warnings: evalResult.warnings ?? [],
        next_steps: evalResult.nextSteps ?? [],

        provider: evalResult.provider,
        model: evalResult.model,
        meta: evalResult.meta ?? {},
      },
      { onConflict: 'attempt_id' },
    );

    if (storeErr) throw new Error('Failed to store evaluation');

    // 9) Update attempt evaluated_at
    const { error: attemptUpdateErr } = await supabase
      .from('writing_attempts')
      .update({ evaluated_at: new Date().toISOString() })
      .eq('id', attemptId);

    if (attemptUpdateErr) throw new Error('Failed to update attempt evaluated_at');

    // 10) Mark job done
    const { error: doneErr } = await supabase
      .from('writing_eval_jobs')
      .update({ status: 'done', last_error: null })
      .eq('attempt_id', attemptId);

    if (doneErr) throw new Error('Failed to mark job done');

    return res.status(200).json({
      ok: true,
      processed: true,
      attemptId,
      mode: forcedAttemptId ? 'forced' : 'queued',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Worker failed';

    await supabase
      .from('writing_eval_jobs')
      .update({ status: 'failed', last_error: msg })
      .eq('attempt_id', attemptId);

    return res.status(500).json({ ok: false, error: msg });
  }
}
