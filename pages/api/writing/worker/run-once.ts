// pages/api/writing/worker/run-once.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { evaluateWritingAttempt } from '@/lib/writing/evaluation/evaluate';
import type { WritingEvalInput } from '@/lib/writing/evaluation/types';

type ApiOk =
  | { ok: true; processed: true; attemptId: string; mode: 'queued' | 'forced' | 'already_done' }
  | { ok: true; processed: false; reason: 'no_jobs' };

type ApiErr = { ok: false; error: string };

const Body = z.object({
  attemptId: z.string().uuid().optional(),
});

function fallbackPrompts(mode: 'academic' | 'general') {
  if (mode === 'academic') {
    return {
      t1: {
        prompt:
          'The chart below shows the percentage of households in a country that owned different types of technology in 2000 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        minWords: 150,
      },
      t2: {
        prompt:
          'Some people think schools should teach practical skills like managing money, while others believe traditional academic subjects should remain the focus.\n\nDiscuss both views and give your own opinion.',
        minWords: 250,
      },
    };
  }
  return {
    t1: {
      prompt:
        'You recently bought a product online, but it arrived damaged.\n\nWrite a letter to the company. In your letter:\n- explain what happened\n- describe how this has affected you\n- say what you would like the company to do',
      minWords: 150,
    },
    t2: {
      prompt:
        'In many countries, people are working longer hours and have less free time.\n\nWhat do you think are the causes of this? What solutions can governments and employers provide?',
      minWords: 250,
    },
  };
}

const safeText = (v: unknown) => String(v ?? '').trim();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>,
) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  // ✅ internal worker auth
  const secret = process.env.WRITING_WORKER_SECRET;
  const headerSecret = req.headers['x-worker-secret'];
  const provided = Array.isArray(headerSecret) ? headerSecret[0] : headerSecret;

  if (!secret) return res.status(500).json({ ok: false, error: 'WRITING_WORKER_SECRET not set' });
  if (!provided || provided !== secret) return res.status(401).json({ ok: false, error: 'Unauthorized' });

  const parse = Body.safeParse(req.body ?? {});
  if (!parse.success) return res.status(400).json({ ok: false, error: 'Invalid body' });

  const forcedAttemptId = parse.data.attemptId;
  const admin = supabaseAdmin;

  // 1) Pick attemptId (forced OR oldest queued)
  let attemptId: string | null = null;

  if (forcedAttemptId) {
    attemptId = forcedAttemptId;

    // ensure job exists
    await admin.from('writing_eval_jobs').upsert(
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
    const { data: jobRow, error: jobErr } = await admin
      .from('writing_eval_jobs')
      .select('attempt_id')
      .eq('status', 'queued')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (jobErr) return res.status(500).json({ ok: false, error: jobErr.message });
    if (!jobRow) return res.status(200).json({ ok: true, processed: false, reason: 'no_jobs' });

    attemptId = String(jobRow.attempt_id);
  }

  if (!attemptId) return res.status(200).json({ ok: true, processed: false, reason: 'no_jobs' });

  // 2) Lock job
  const { data: job, error: jobFetchErr } = await admin
    .from('writing_eval_jobs')
    .select('attempt_id,status,attempts')
    .eq('attempt_id', attemptId)
    .maybeSingle();

  if (jobFetchErr || !job) {
    return res.status(500).json({ ok: false, error: 'Job not found (unexpected)' });
  }

  const nextAttempts = Number(job.attempts ?? 0) + 1;

  const { error: lockErr } = await admin
    .from('writing_eval_jobs')
    .update({
      status: 'running',
      locked_at: new Date().toISOString(),
      attempts: nextAttempts,
      last_error: null,
    })
    .eq('attempt_id', attemptId);

  if (lockErr) return res.status(500).json({ ok: false, error: 'Failed to lock job' });

  try {
    // 3) Idempotency: already evaluated?
    const { data: existingEval, error: existingEvalErr } = await admin
      .from('writing_evaluations')
      .select('attempt_id')
      .eq('attempt_id', attemptId)
      .maybeSingle();

    if (existingEvalErr) throw new Error(existingEvalErr.message);

   if (existingEval?.attempt_id) {
      await admin.from('writing_eval_jobs').update({ status: 'done', last_error: null }).eq('attempt_id', attemptId);
      await admin
        .from('writing_attempts')
        .update({ evaluated_at: new Date().toISOString() })
        .eq('id', attemptId)
        .is('evaluated_at', null);

      return res.status(200).json({ ok: true, processed: true, attemptId, mode: 'already_done' });
    }

    // 4) Load attempt (✅ ADMIN to bypass RLS)
    const { data: attempt, error: attemptErr } = await admin
      .from('writing_attempts')
      .select('id,user_id,mode,status')
      .eq('id', attemptId)
      .maybeSingle();

    if (attemptErr) throw new Error(attemptErr.message);
    if (!attempt) throw new Error('Attempt not found');

    const mode = (String(attempt.mode ?? 'academic') as 'academic' | 'general');
    const status = String(attempt.status ?? '');

    if (status !== 'submitted' && status !== 'locked') {
      throw new Error(`Attempt not ready (status=${status})`);
    }

    // 5) Load answers + prompts from canonical table
    const { data: answers, error: ansErr } = await admin
      .from('writing_attempt_answers')
      .select('task_number, answer_text, prompt_text, word_limit')
      .eq('attempt_id', attemptId)
      .order('task_number', { ascending: true });

    if (ansErr) throw new Error(ansErr.message);

    const r1 = answers?.find((a: any) => Number(a.task_number) === 1);
    const r2 = answers?.find((a: any) => Number(a.task_number) === 2);

    const task1Text = safeText(r1?.answer_text);
    const task2Text = safeText(r2?.answer_text);

    // Your SQL shows len = 0 for both → this will now fail with a REAL message.
    if (!task1Text && !task2Text) {
      throw new Error(
        'No answers found (both Task 1 and Task 2 are empty). This usually means autosave did not persist OR submit did not send answers.',
      );
    }

    const fb = fallbackPrompts(mode);

    const task1Prompt = safeText(r1?.prompt_text) || fb.t1.prompt;
    const task2Prompt = safeText(r2?.prompt_text) || fb.t2.prompt;

    const task1Min = typeof r1?.word_limit === 'number' ? r1.word_limit : fb.t1.minWords;
    const task2Min = typeof r2?.word_limit === 'number' ? r2.word_limit : fb.t2.minWords;

    const input: WritingEvalInput = {
      attemptId,
      userId: String(attempt.user_id),
      task1: { prompt: task1Prompt, text: task1Text, minWords: task1Min },
      task2: { prompt: task2Prompt, text: task2Text, minWords: task2Min },
      meta: { mode },
    };

    const evalResult = await evaluateWritingAttempt(input);

    // 6) Store evaluation (✅ matches your table: NO user_id column)
    const { error: storeErr } = await admin.from('writing_evaluations').upsert(
      {
        attempt_id: attemptId,

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

        warnings: (evalResult.warnings ?? []) as unknown as string[],
        next_steps: (evalResult.nextSteps ?? []) as unknown as string[],

        provider: evalResult.provider,
        model: evalResult.model,
        meta: evalResult.meta ?? {},
      },
      { onConflict: 'attempt_id' },
    );

    if (storeErr) throw new Error(storeErr.message);

    // 7) Mark attempt evaluated
    const { error: attemptUpdErr } = await admin
      .from('writing_attempts')
      .update({ evaluated_at: new Date().toISOString() })
      .eq('id', attemptId);

    if (attemptUpdErr) throw new Error(attemptUpdErr.message);

    // 8) Mark job done
    const { error: doneErr } = await admin
      .from('writing_eval_jobs')
      .update({ status: 'done', last_error: null })
      .eq('attempt_id', attemptId);

    if (doneErr) throw new Error(doneErr.message);

    return res.status(200).json({
      ok: true,
      processed: true,
      attemptId,
      mode: forcedAttemptId ? 'forced' : 'queued',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Worker failed';

    await admin
      .from('writing_eval_jobs')
      .update({ status: 'failed', last_error: msg })
      .eq('attempt_id', attemptId);

    return res.status(500).json({ ok: false, error: msg });
  }
}
