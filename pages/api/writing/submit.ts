// pages/api/writing/submit.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type ApiOk = {
  ok: true;
  attemptId: string;
  submittedAt: string;
  workerTriggered: boolean;
};

type ApiErr = { error: string; details?: unknown };

const Answer = z.object({
  taskNumber: z.union([z.literal(1), z.literal(2)]),
  text: z.string(),
  wordCount: z.number().int().nonnegative().optional(),
});

const Body = z.object({
  attemptId: z.string().uuid(),
  autoSubmitted: z.boolean().optional(),
  // Optional: allow passing answers on submit (useful when you bypass autosave)
  answers: z.array(Answer).length(2).optional(),
});

const countWords = (text: string) => {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
};

async function ensureEvalJobQueued(attemptId: string) {
  const admin = supabaseAdmin;

  const { data: job, error: jobErr } = await admin
    .from('writing_eval_jobs')
    .select('attempt_id,status')
    .eq('attempt_id', attemptId)
    .maybeSingle();

  if (jobErr) throw new Error(jobErr.message);

  if (job?.status === 'done') return;

  if (!job) {
    const { error: insErr } = await admin.from('writing_eval_jobs').insert({
      attempt_id: attemptId,
      status: 'queued',
      attempts: 0,
      locked_at: null,
      last_error: null,
    });
    if (insErr) throw new Error(insErr.message);
    return;
  }

  const { error: updErr } = await admin
    .from('writing_eval_jobs')
    .update({ status: 'queued', locked_at: null, last_error: null })
    .eq('attempt_id', attemptId);

  if (updErr) throw new Error(updErr.message);
}

async function triggerWorkerNow(req: NextApiRequest, attemptId: string): Promise<boolean> {
  const secret = process.env.WRITING_WORKER_SECRET;
  if (!secret) return false;

  const host = (req.headers['x-forwarded-host'] ?? req.headers.host) as string | undefined;
  const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'http';

  // Local dev fallback if host headers are weird
  const baseUrl =
    host ? `${proto}://${host}` : process.env.NODE_ENV !== 'production' ? 'http://localhost:3000' : null;

  if (!baseUrl) return false;

  const r = await fetch(`${baseUrl}/api/writing/worker/run-once`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-worker-secret': secret,
    },
    body: JSON.stringify({ attemptId }),
  });

  return r.ok;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiOk | ApiErr>) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const parse = Body.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid body', details: parse.error.flatten() });

  const { attemptId, answers } = parse.data;

  const supabase = getServerClient(req, res);

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized', details: authErr ?? null });

  // Use admin for DB ops (avoid RLS surprises), but ONLY after ownership check.
  const admin = supabaseAdmin;

  const { data: attempt, error: attemptErr } = await admin
    .from('writing_attempts')
    .select('id,user_id,status,submitted_at,evaluated_at')
    .eq('id', attemptId)
    .maybeSingle();

  if (attemptErr) return res.status(500).json({ error: 'Failed to load attempt', details: attemptErr });
  if (!attempt) return res.status(404).json({ error: 'Attempt not found' });
  if (attempt.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

  // If caller sends answers at submit time, persist them.
  if (answers?.length === 2) {
    const nowIso = new Date().toISOString();
    const rows = answers.map((a) => ({
      attempt_id: attemptId,
      task_number: a.taskNumber,
      answer_text: a.text,
      word_count: typeof a.wordCount === 'number' ? a.wordCount : countWords(a.text),
      last_saved_at: nowIso,
    }));

    const { error: saveErr } = await admin
      .from('writing_attempt_answers')
      .upsert(rows, { onConflict: 'attempt_id,task_number' });

    if (saveErr) return res.status(500).json({ error: 'Failed to save answers', details: saveErr });
  }

  // Mark submitted if not already
  const submittedAtIso = attempt.submitted_at ? new Date(attempt.submitted_at).toISOString() : new Date().toISOString();

  if (!attempt.submitted_at) {
    const { error: updErr } = await admin
      .from('writing_attempts')
      .update({ status: 'submitted', submitted_at: submittedAtIso })
      .eq('id', attemptId);

    if (updErr) return res.status(500).json({ error: 'Failed to submit attempt', details: updErr });
  }

  // Queue job if not evaluated
  if (!attempt.evaluated_at) {
    try {
      await ensureEvalJobQueued(attemptId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to queue evaluation job';
      return res.status(500).json({ error: msg });
    }
  }

  // Trigger worker now (non-fatal if it fails; job stays queued)
  let workerTriggered = false;
  try {
    workerTriggered = await triggerWorkerNow(req, attemptId);
  } catch (e) {
    console.error('triggerWorkerNow failed', e);
    workerTriggered = false;
  }

  return res.status(200).json({
    ok: true,
    attemptId,
    submittedAt: submittedAtIso,
    workerTriggered,
  });
}
