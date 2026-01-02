// pages/mock/writing/result/[attemptId].tsx
import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';

const Params = z.object({
  attemptId: z.string().uuid(),
});

type AttemptRow = {
  id: string;
  user_id: string;
  mode: 'academic' | 'general' | string | null;
  status: string | null;
  created_at?: string | null;
  submitted_at?: string | null;
  evaluated_at?: string | null;
};

type EvaluationRow = {
  attempt_id: string;

  overall_band: number | null;
  task1_band: number | null;
  task2_band: number | null;

  criteria_tr: number | null;
  criteria_cc: number | null;
  criteria_lr: number | null;
  criteria_gra: number | null;

  short_verdict_task1: string | null;
  short_verdict_task2: string | null;

  criteria_notes: Record<string, unknown> | null;
  task_notes: Record<string, unknown> | null;

  warnings: string[] | null;
  next_steps: string[] | null;

  provider: string | null;
  model: string | null;
  meta: Record<string, unknown> | null;

  // ✅ this is the one that was coming as undefined in your props
  warningNotes?: unknown;
};

type PageProps = {
  attemptId: string;
  attempt: AttemptRow;
  evaluation: (EvaluationRow & { warningNotes: unknown | null }) | null;
  jobStatus: 'queued' | 'running' | 'done' | 'failed' | 'missing';
  jobLastError: string | null;
};

function sanitizeForNext<T>(value: T): T {
  // ✅ replaces any undefined anywhere with null so Next can serialize props
  return JSON.parse(JSON.stringify(value, (_k, v) => (v === undefined ? null : v))) as T;
}

const WritingResultPage: NextPage<PageProps> = ({ attempt, evaluation, jobStatus, jobLastError }) => {
  const isPending = !evaluation;

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-fg">Writing Mock</h1>
            <p className="mt-1 text-sm text-muted">
              Training band can be slightly stricter than IELTS. Real exam is usually within ±0.5.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/mock/writing"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Retry test
            </Link>
            <Link href="/mock" className="rounded-xl border border-border px-4 py-2 text-sm text-fg">
              Back
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-fg">
              Status: {attempt.status ?? '—'}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-fg">
              Mode: {attempt.mode ?? 'academic'}
            </span>
            <span className="rounded-full bg-muted px-3 py-1 text-xs text-fg">
              Job: {jobStatus}
            </span>
          </div>

          {jobStatus === 'failed' && jobLastError ? (
            <div className="mt-3 rounded-xl border border-border bg-muted p-3 text-sm text-fg">
              <div className="font-medium">Worker failed</div>
              <div className="mt-1 text-muted">{jobLastError}</div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          {isPending ? (
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-semibold text-fg">Evaluation pending</div>
                <div className="mt-1 text-sm text-muted">
                  Your attempt is submitted. Evaluation hasn’t been stored yet.
                </div>
                <div className="mt-1 text-xs text-muted">Auto-refresh will keep checking.</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Refresh now
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-base font-semibold text-fg">Training Band</div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="rounded-xl border border-border bg-muted px-4 py-3">
                  <div className="text-xs text-muted">Overall</div>
                  <div className="text-lg font-semibold text-fg">{evaluation?.overall_band ?? '—'}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted px-4 py-3">
                  <div className="text-xs text-muted">Task 1</div>
                  <div className="text-lg font-semibold text-fg">{evaluation?.task1_band ?? '—'}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted px-4 py-3">
                  <div className="text-xs text-muted">Task 2</div>
                  <div className="text-lg font-semibold text-fg">{evaluation?.task2_band ?? '—'}</div>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-sm font-medium text-fg">Next steps</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                  {(evaluation?.next_steps ?? []).map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-5">
                <div className="text-sm font-medium text-fg">Warnings</div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
                  {(evaluation?.warnings ?? []).map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Debug safe values */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-5">
          <div className="text-sm font-medium text-fg">Debug</div>
          <div className="mt-2 text-xs text-muted">
            evaluation.warningNotes: {String(evaluation?.warningNotes ?? null)}
          </div>
        </div>
      </div>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const parse = Params.safeParse(ctx.params ?? {});
  if (!parse.success) return { notFound: true };

  const { attemptId } = parse.data;

  const supabase = getServerClient(ctx.req, ctx.res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: false,
      },
    };
  }

  // Attempt (ownership enforced)
  const { data: attempt, error: attemptErr } = await supabase
    .from('writing_attempts')
    .select('id,user_id,mode,status,created_at,submitted_at,evaluated_at')
    .eq('id', attemptId)
    .maybeSingle();

  if (attemptErr) {
    return { notFound: true };
  }
  if (!attempt) return { notFound: true };
  if (attempt.user_id !== user.id) return { notFound: true };

  // Evaluation (can be missing while pending)
  const { data: evaluation } = await supabase
    .from('writing_evaluations')
    .select(
      [
        'attempt_id',
        'overall_band',
        'task1_band',
        'task2_band',
        'criteria_tr',
        'criteria_cc',
        'criteria_lr',
        'criteria_gra',
        'short_verdict_task1',
        'short_verdict_task2',
        'criteria_notes',
        'task_notes',
        'warnings',
        'next_steps',
        'provider',
        'model',
        'meta',
      ].join(','),
    )
    .eq('attempt_id', attemptId)
    .maybeSingle();

  // Job status (optional)
  const { data: job } = await supabase
    .from('writing_eval_jobs')
    .select('status,last_error')
    .eq('attempt_id', attemptId)
    .maybeSingle();

  // ✅ IMPORTANT: warningNotes must never be undefined in props
  const evaluationSafe = evaluation
    ? ({
        ...evaluation,
        warningNotes: (evaluation as any)?.warningNotes ?? null,
      } as EvaluationRow & { warningNotes: unknown | null })
    : null;

  const props: PageProps = {
    attemptId,
    attempt: attempt as AttemptRow,
    evaluation: evaluationSafe,
    jobStatus: (job?.status as PageProps['jobStatus']) ?? 'missing',
    jobLastError: job?.last_error ?? null,
  };

  return { props: sanitizeForNext(props) };
};

export default WritingResultPage;
