// pages/mock/writing/review/[attemptId].tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

import { WritingReviewShell } from '@/components/writing/review/WritingReviewShell';

type TaskLabel = 'Task 1' | 'Task 2';
type WritingCriteriaKey = 'TR' | 'CC' | 'LR' | 'GRA';

type AttemptMeta = {
  attemptId: string;
  testId: string;
  testSlug: string;
  testTitle: string;
  submittedAt: string | null;
  autoSubmitted: boolean;
  status: string;
};

type PromptTask = {
  taskNumber: 1 | 2;
  label: TaskLabel;
  prompt: string;
  minWords: number;
};

type AnswerTask = {
  taskNumber: 1 | 2;
  label: TaskLabel;
  text: string;
  wordCount: number;
};

type WritingEvaluation = {
  overallBand: number;
  task1Band: number;
  task2Band: number;
  criteria: Record<WritingCriteriaKey, number>;
  criteriaNotes: Partial<Record<WritingCriteriaKey, string[]>>;
  shortVerdictTask1?: string;
  shortVerdictTask2?: string;
  taskNotes?: Partial<Record<'task1' | 'task2', string[]>>;
  warnings?: string[];
  nextSteps?: string[];
};

type PageProps = {
  attempt: AttemptMeta | null;
  prompts: PromptTask[];
  answers: AnswerTask[];
  evaluation: WritingEvaluation | null;
};

const bandFmt = (n: number | null | undefined) => {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  const fixed = Math.round(n * 2) / 2;
  return fixed % 1 === 0 ? `${fixed.toFixed(0)}.0` : `${fixed.toFixed(1)}`;
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const attemptId = typeof ctx.params?.attemptId === 'string' ? ctx.params.attemptId : null;
  if (!attemptId) return { notFound: true };

  const supabase = getServerClient(ctx.req, ctx.res);
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=/mock/writing/review/${encodeURIComponent(attemptId)}`,
        permanent: false,
      },
    };
  }

  // Attempt + test meta (ownership enforced)
  const { data: attemptRow, error: attemptErr } = await supabase
    .from('writing_attempts')
    .select('id, user_id, test_id, status, submitted_at, auto_submitted, writing_tests:writing_tests(id, slug, title)')
    .eq('id', attemptId)
    .maybeSingle();

  if (attemptErr || !attemptRow) return { notFound: true };
  if (String(attemptRow.user_id) !== String(user.id)) return { notFound: true };

  const testTitle = (attemptRow as any)?.writing_tests?.title ?? 'Writing Mock';
  const testSlug = (attemptRow as any)?.writing_tests?.slug ?? 'writing-mock';

  const attempt: AttemptMeta = {
    attemptId: String(attemptRow.id),
    testId: String(attemptRow.test_id),
    testSlug: String(testSlug),
    testTitle: String(testTitle),
    submittedAt: attemptRow.submitted_at ? String(attemptRow.submitted_at) : null,
    autoSubmitted: Boolean(attemptRow.auto_submitted),
    status: String(attemptRow.status ?? ''),
  };

  // Prompts (task 1/2)
  const { data: taskRows } = await supabase
    .from('writing_tasks')
    .select('task_number, prompt, word_limit_min')
    .eq('test_id', attempt.testId)
    .order('task_number', { ascending: true });

  const prompts: PromptTask[] =
    (taskRows ?? []).map((t) => {
      const num = t.task_number === 2 ? 2 : 1;
      return {
        taskNumber: num,
        label: (num === 2 ? 'Task 2' : 'Task 1') as TaskLabel,
        prompt: String(t.prompt ?? ''),
        minWords: typeof t.word_limit_min === 'number' ? t.word_limit_min : num === 2 ? 250 : 150,
      };
    });

  // Answers
  const { data: ansRows } = await supabase
    .from('writing_user_answers')
    .select('task_number, label, text, word_count')
    .eq('attempt_id', attemptId)
    .order('task_number', { ascending: true });

  const answers: AnswerTask[] =
    (ansRows ?? []).map((r) => {
      const num = r.task_number === 2 ? 2 : 1;
      return {
        taskNumber: num,
        label: (num === 2 ? 'Task 2' : 'Task 1') as TaskLabel,
        text: String(r.text ?? ''),
        wordCount: typeof r.word_count === 'number' ? r.word_count : 0,
      };
    });

  // Evaluation (stored only)
  const { data: evalRow } = await supabase
    .from('writing_evaluations')
    .select(
      'overall_band, task1_band, task2_band, criteria_tr, criteria_cc, criteria_lr, criteria_gra, criteria_notes, task_notes, warnings, next_steps, short_verdict_task1, short_verdict_task2',
    )
    .eq('attempt_id', attemptId)
    .maybeSingle();

  let evaluation: WritingEvaluation | null = null;

  if (evalRow) {
    const criteriaNotesRaw = evalRow.criteria_notes as unknown;
    const taskNotesRaw = evalRow.task_notes as unknown;

    const criteriaNotes =
      typeof criteriaNotesRaw === 'object' && criteriaNotesRaw !== null
        ? (criteriaNotesRaw as WritingEvaluation['criteriaNotes'])
        : {};

    const taskNotes =
      typeof taskNotesRaw === 'object' && taskNotesRaw !== null
        ? (taskNotesRaw as WritingEvaluation['taskNotes'])
        : {};

    evaluation = {
      overallBand: Number(evalRow.overall_band),
      task1Band: Number(evalRow.task1_band),
      task2Band: Number(evalRow.task2_band),
      criteria: {
        TR: Number(evalRow.criteria_tr),
        CC: Number(evalRow.criteria_cc),
        LR: Number(evalRow.criteria_lr),
        GRA: Number(evalRow.criteria_gra),
      },
      criteriaNotes,
      taskNotes,
      shortVerdictTask1: evalRow.short_verdict_task1 ? String(evalRow.short_verdict_task1) : undefined,
      shortVerdictTask2: evalRow.short_verdict_task2 ? String(evalRow.short_verdict_task2) : undefined,
      warnings: Array.isArray(evalRow.warnings) ? (evalRow.warnings as string[]) : [],
      nextSteps: Array.isArray(evalRow.next_steps) ? (evalRow.next_steps as string[]) : [],
    };
  }

  return { props: { attempt, prompts, answers, evaluation } };
};

const WritingReviewPage: NextPage<PageProps> = ({ attempt, prompts, answers, evaluation }) => {
  if (!attempt) {
    return (
      <>
        <Head>
          <title>Writing Review · Not found · GramorX</title>
        </Head>
        <main className="min-h-screen bg-lightBg">
          <Container className="max-w-3xl py-10">
            <Card className="rounded-ds-2xl border border-border bg-card p-6 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Icon name="TriangleAlert" size={18} />
              </div>
              <h1 className="mt-3 text-h4 font-semibold">Review not found</h1>
              <p className="mt-1 text-small text-muted-foreground">
                This attempt doesn’t exist or you don’t have access.
              </p>
              <div className="mt-4 flex justify-center">
                <Button asChild variant="secondary">
                  <Link href="/mock/writing">Back to Writing mocks</Link>
                </Button>
              </div>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  const hasEval = Boolean(evaluation);
  const overallBand = hasEval ? bandFmt(evaluation!.overallBand) : '—';

  return (
    <>
      <Head>
        <title>{attempt.testTitle} · Review · GramorX</title>
      </Head>

      <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
        <section className="border-b border-border bg-card/70">
          <Container className="max-w-6xl py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral" size="sm">
                    Writing Review
                  </Badge>
                  {attempt.autoSubmitted ? (
                    <Badge variant="accent" size="sm">
                      Auto-submitted
                    </Badge>
                  ) : null}
                  <Badge variant={hasEval ? 'success' : 'neutral'} size="sm">
                    {hasEval ? 'Evaluated' : 'Pending'}
                  </Badge>
                  <Badge variant="neutral" size="sm">
                    Attempt {attempt.attemptId.slice(0, 8)}
                  </Badge>
                </div>

                <h1 className="text-h3 font-semibold text-foreground">{attempt.testTitle}</h1>

                <p className="text-caption text-muted-foreground">
                  Training band: <span className="font-semibold text-foreground">{overallBand}</span>
                  {attempt.submittedAt ? (
                    <>
                      {' • '}Submitted: {formatDateTime(attempt.submittedAt)}
                    </>
                  ) : null}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/mock/writing/result/${encodeURIComponent(attempt.attemptId)}`}>
                    <Icon name="BarChart3" className="mr-1.5 h-4 w-4" />
                    Result
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/mock/writing">
                    <Icon name="ArrowLeft" className="mr-1.5 h-4 w-4" />
                    Back
                  </Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>

        <Container className="max-w-6xl py-6">
          <WritingReviewShell prompts={prompts} answers={answers} evaluation={evaluation} />
        </Container>
      </main>
    </>
  );
};

export default WritingReviewPage;
