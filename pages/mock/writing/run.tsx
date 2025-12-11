// pages/mock/writing/run.tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

import { Container } from '@/components/design-system/Container';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import { ExamBreadcrumbs } from '@/components/exam/ExamBreadcrumbs';
import TextareaAutosize from '@/components/design-system/TextareaAutosize';

// ------------------------------------------------------------------------------------
// Types
// ------------------------------------------------------------------------------------

type WritingTask = {
  id: string;
  taskNumber: number;
  prompt: string;
  wordLimitMin: number | null;
  wordLimitMax: number | null;
};

type WritingTestRun = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  durationSeconds: number;
};

type PageProps = {
  test: WritingTestRun | null;
  tasks: WritingTask[];
};

type Db = Database['public'];

// ------------------------------------------------------------------------------------
// Constants & helpers
// ------------------------------------------------------------------------------------

const DEFAULT_DURATION_SECONDS = 60 * 60; // 60 minutes

function formatSeconds(seconds: number | null) {
  const s = seconds ?? 0;
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

// ------------------------------------------------------------------------------------
// getServerSideProps
// ------------------------------------------------------------------------------------

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  try {
    const { query, req, res } = ctx;

    const slug =
      typeof query.slug === 'string'
        ? query.slug
        : typeof query.testSlug === 'string'
        ? query.testSlug
        : typeof query.test === 'string'
        ? query.test
        : null;

    if (!slug) {
      return {
        redirect: {
          destination: '/mock/writing',
          permanent: false,
        },
      };
    }

    const supabase = getServerClient(req, res);

    const { data: testRow, error: testErr } = await supabase
      .from<Db['Tables']['writing_tests']['Row']>('writing_tests')
      .select('id, slug, title, description, duration_seconds, is_active')
      .eq('slug', slug)
      .maybeSingle();

    if (testErr) {
      // eslint-disable-next-line no-console
      console.error('Writing run GSSP test error', testErr);
      return {
        redirect: {
          destination: '/mock/writing',
          permanent: false,
        },
      };
    }

    if (!testRow || testRow.is_active === false) {
      return {
        notFound: true,
      };
    }

    const { data: tasksRows, error: tasksErr } = await supabase
      .from<Db['Tables']['writing_tasks']['Row']>('writing_tasks')
      .select('id, task_number, prompt, word_limit_min, word_limit_max')
      .eq('test_id', testRow.id)
      .order('task_number', { ascending: true });

    if (tasksErr) {
      // eslint-disable-next-line no-console
      console.error('Writing run GSSP tasks error', tasksErr);
      return {
        redirect: {
          destination: '/mock/writing',
          permanent: false,
        },
      };
    }

    const tasks: WritingTask[] =
      tasksRows?.map((t) => ({
        id: t.id as string,
        taskNumber: t.task_number ?? 0,
        prompt: t.prompt ?? '',
        wordLimitMin: t.word_limit_min,
        wordLimitMax: t.word_limit_max,
      })) ?? [];

    const test: WritingTestRun = {
      id: testRow.id as string,
      slug: testRow.slug as string,
      title: testRow.title ?? 'Writing Mock',
      description: testRow.description ?? null,
      durationSeconds: testRow.duration_seconds ?? DEFAULT_DURATION_SECONDS,
    };

    return {
      props: {
        test,
        tasks,
      },
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Writing run GSSP fatal error', err);
    return {
      redirect: {
        destination: '/mock/writing',
        permanent: false,
      },
    };
  }
};

// ------------------------------------------------------------------------------------
// Component
// ------------------------------------------------------------------------------------

const WritingMockRunPage: NextPage<PageProps> = ({ test, tasks }) => {
  const router = useRouter();

  // No test → simple “not found” exam-style error
  if (!test) {
    return (
      <>
        <Head>
          <title>Writing Mock · Not Found · GramorX</title>
        </Head>
        <main className="flex min-h-screen items-center bg-lightBg">
          <Container className="max-w-3xl py-10">
            <div className="space-y-4 rounded-ds-xl border border-border bg-card p-6 text-center shadow-sm">
              <h2 className="text-lg font-semibold">Writing mock not found</h2>
              <p className="text-sm text-muted-foreground">
                The mock you&apos;re trying to open does not exist or is no longer available.
              </p>
              <Button asChild>
                <Link href="/mock/writing">
                  <Icon name="ArrowLeft" className="mr-1.5 h-4 w-4" />
                  Back to Writing mocks
                </Link>
              </Button>
            </div>
          </Container>
        </main>
      </>
    );
  }

  // --------------------------------------------------------------------------
  // Exam state
  // --------------------------------------------------------------------------

  const [activeTask, setActiveTask] = React.useState<1 | 2>(1);

  const [task1Text, setTask1Text] = React.useState('');
  const [task2Text, setTask2Text] = React.useState('');

  const [remainingSeconds, setRemainingSeconds] = React.useState<number>(
    test.durationSeconds ?? DEFAULT_DURATION_SECONDS,
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [autoSubmitted, setAutoSubmitted] = React.useState(false);

  const testId = test.id;
  const testSlug = test.slug;

  const task1 = tasks.find((t) => t.taskNumber === 1) ?? tasks[0];
  const task2 =
    tasks.find((t) => t.taskNumber === 2) ?? (tasks.length > 1 ? tasks[1] : tasks[0]);

  const totalMinutes = Math.round(
    (test.durationSeconds ?? DEFAULT_DURATION_SECONDS) / 60,
  );

  const timeLeftLabel = formatSeconds(remainingSeconds);
  const isAutosaveActive = true; // wire up later if you want real autosave

  const wordCountTask1 = React.useMemo(
    () => (task1Text.trim() ? task1Text.trim().split(/\s+/).length : 0),
    [task1Text],
  );

  const wordCountTask2 = React.useMemo(
    () => (task2Text.trim() ? task2Text.trim().split(/\s+/).length : 0),
    [task2Text],
  );

  const minWordsTask1 = task1.wordLimitMin ?? 150;
  const minWordsTask2 = task2.wordLimitMin ?? 250;

  const isBelowMinTask1 = wordCountTask1 > 0 && wordCountTask1 < minWordsTask1;
  const isBelowMinTask2 = wordCountTask2 > 0 && wordCountTask2 < minWordsTask2;

  // Timer tick
  React.useEffect(() => {
    if (remainingSeconds <= 0) return;
    if (isSubmitting) return;

    const id = window.setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(id);
  }, [remainingSeconds, isSubmitting]);

  // Auto submit when time is up (IELTS-style hard stop)
  React.useEffect(() => {
    if (remainingSeconds === 0 && !isSubmitting && !autoSubmitted) {
      setAutoSubmitted(true);
      void handleSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds, isSubmitting, autoSubmitted]);

  const handleSubmit = React.useCallback(
    async (auto: boolean) => {
      if (!testId || !testSlug) return;
      if (!task1Text.trim() || !task2Text.trim()) {
        if (!auto) {
          setSubmitError('You must attempt both Task 1 and Task 2 before submitting.');
        }
        return;
      }

      try {
        setIsSubmitting(true);
        setSubmitError(null);

        const res = await fetch('/api/mock/writing/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            testId,
            testSlug,
            answers: [
              {
                taskNumber: 1,
                text: task1Text.trim(),
                wordCount: wordCountTask1,
              },
              {
                taskNumber: 2,
                text: task2Text.trim(),
                wordCount: wordCountTask2,
              },
            ],
            autoSubmitted: auto,
            durationSeconds: test.durationSeconds ?? DEFAULT_DURATION_SECONDS,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to submit attempt');
        }

        const json: { attemptId: string } = await res.json();
        await router.push(`/mock/writing/result/${encodeURIComponent(json.attemptId)}`);
      } catch (err: unknown) {
        // eslint-disable-next-line no-console
        console.error(err);
        const message =
          err instanceof Error ? err.message : 'Failed to submit the Writing mock.';
        setSubmitError(message);
        setIsSubmitting(false);
      }
    },
    [
      testId,
      testSlug,
      task1Text,
      task2Text,
      wordCountTask1,
      wordCountTask2,
      router,
      test.durationSeconds,
    ],
  );

  const handleExitMock = React.useCallback(() => {
    void router.push('/mock/writing');
  }, [router]);

  const activePrompt = activeTask === 1 ? task1.prompt : task2.prompt;

  const timerIsCritical = remainingSeconds <= 5 * 60 && remainingSeconds > 0;
  const timerIsExpired = remainingSeconds <= 0;

  // --------------------------------------------------------------------------
  // JSX — IELTS-style shell
  // --------------------------------------------------------------------------

  return (
    <>
      <Head>
        <title>{test.title} · Writing Mock · GramorX</title>
      </Head>

      <main className="flex min-h-screen flex-col bg-lightBg">
        {/* TOP EXAM HEADER (IELTS CBT style) */}
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-3">
            {/* Breadcrumbs */}
            <div className="mb-2">
              <ExamBreadcrumbs
                items={[
                  { label: 'Full Mock Tests', href: '/mock' },
                  { label: 'Writing', href: '/mock/writing' },
                  { label: test.title, active: true },
                ]}
              />
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              {/* Left: Test meta */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="rounded-full bg-muted px-2 py-[2px] font-semibold uppercase tracking-[0.16em]">
                    IELTS Academic • Writing
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.18em]">
                    Full mock · Tasks 1 & 2
                  </span>
                </div>
                <h1 className="font-slab text-lg leading-tight text-foreground">
                  {test.title}
                </h1>
                <p className="max-w-xl text-[11px] text-muted-foreground">
                  Complete both Task 1 and Task 2 in a single{' '}
                  <span className="font-semibold">{totalMinutes}-minute</span> session. The
                  interface mirrors the IELTS computer-based exam, with strict timing.
                </p>
              </div>

              {/* Right: Timer + autosave + exit */}
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      Time remaining
                    </span>
                    <div
                      className={[
                        'inline-flex items-center rounded-full border px-3 py-1 font-mono text-sm',
                        timerIsExpired
                          ? 'border-destructive/50 bg-destructive/10 text-destructive'
                          : timerIsCritical
                          ? 'border-accent/60 bg-accent/10 text-accent-foreground'
                          : 'border-border bg-muted text-foreground',
                      ].join(' ')}
                    >
                      {timeLeftLabel}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-0.5 text-[11px] text-muted-foreground">
                    <span>Total time: {totalMinutes} minutes</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={[
                          'inline-flex h-2 w-2 rounded-full',
                          isAutosaveActive
                            ? 'bg-emerald-500'
                            : 'bg-muted-foreground/60',
                        ].join(' ')}
                      />
                      <span>Auto-save enabled</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="px-2 text-[11px]"
                    onClick={handleExitMock}
                    disabled={isSubmitting}
                  >
                    <Icon name="ArrowLeft" className="mr-1.5 h-3.5 w-3.5" />
                    Exit mock
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* MAIN EXAM AREA */}
        <div className="flex-1">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4">
            {/* Exam hint bar */}
            <div className="rounded-ds-xl border border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
              Your answers are submitted automatically when time runs out. You must attempt
              <span className="font-semibold"> both Task 1 and Task 2</span> before
              submission, just like the real exam.
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
              {/* LEFT: TASK INSTRUCTIONS PANE */}
              <section className="flex min-h-[360px] flex-col rounded-ds-xl border border-border bg-card">
                <header className="border-b border-border px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {activeTask === 1 ? 'Writing Task 1' : 'Writing Task 2'}
                  </p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    You should spend about{' '}
                    <span className="font-semibold">
                      {activeTask === 1 ? '20 minutes' : '40 minutes'}
                    </span>{' '}
                    on this task.
                  </p>
                </header>

                <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted/70 flex-1 overflow-auto px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  {activePrompt.split('\n').map((line) => (
                    <p key={line} className="mb-2 last:mb-0">
                      {line}
                    </p>
                  ))}
                </div>
              </section>

              {/* RIGHT: ANSWER EDITOR PANE */}
              <section className="flex min-h-[420px] flex-col rounded-ds-xl border border-border bg-card">
                {/* Editor header: task tabs + word summary */}
                <div className="border-b border-border px-4 pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Answer area
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Type your answers exactly as you would in the official test. Do not
                        copy-paste from outside.
                      </span>
                    </div>

                    <div className="flex flex-col items-end gap-0.5 text-[11px] text-muted-foreground">
                      <div>
                        Task 1:{' '}
                        <span
                          className={[
                            'font-medium',
                            isBelowMinTask1 ? 'text-destructive' : 'text-foreground',
                          ].join(' ')}
                        >
                          {wordCountTask1}
                        </span>{' '}
                        / {minWordsTask1} words
                      </div>
                      <div>
                        Task 2:{' '}
                        <span
                          className={[
                            'font-medium',
                            isBelowMinTask2 ? 'text-destructive' : 'text-foreground',
                          ].join(' ')}
                        >
                          {wordCountTask2}
                        </span>{' '}
                        / {minWordsTask2} words
                      </div>
                    </div>
                  </div>

                  {/* Task tabs */}
                  <div className="border-t border-border pt-2">
                    <div className="inline-flex rounded-none border border-border text-[11px]">
                      <button
                        type="button"
                        onClick={() => setActiveTask(1)}
                        className={[
                          'min-w-[90px] px-3 py-1.5 text-center',
                          activeTask === 1
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'bg-card text-foreground',
                        ].join(' ')}
                      >
                        Task 1 · {wordCountTask1} words
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTask(2)}
                        className={[
                          'min-w-[90px] px-3 py-1.5 text-center',
                          activeTask === 2
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'bg-card text-foreground',
                        ].join(' ')}
                      >
                        Task 2 · {wordCountTask2} words
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submission error */}
                {submitError && (
                  <p className="px-4 pt-2 text-[11px] text-destructive">{submitError}</p>
                )}

                {/* Textarea */}
                <div className="flex-1 px-4 py-3">
                  <label className="mb-1 block text-[11px] text-muted-foreground">
                    {activeTask === 1 ? 'Task 1 answer' : 'Task 2 answer'}
                  </label>

                  <TextareaAutosize
                    value={activeTask === 1 ? task1Text : task2Text}
                    onChange={(e) =>
                      activeTask === 1
                        ? setTask1Text(e.target.value)
                        : setTask2Text(e.target.value)
                    }
                    minRows={12}
                    maxRows={18}
                    className="w-full resize-none rounded-ds-md border border-border bg-background px-3 py-2 text-sm leading-relaxed shadow-sm"
                    autoFocus
                  />
                </div>

                {/* Bottom bar: Exit + Submit */}
                <div className="flex items-center justify-between border-t border-border px-4 py-3 text-[11px]">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="px-2 text-[11px]"
                      onClick={handleExitMock}
                      disabled={isSubmitting}
                    >
                      <Icon name="ArrowLeft" className="mr-1 h-3.5 w-3.5" />
                      Exit mock
                    </Button>
                    <span className="text-muted-foreground">
                      Make sure both tasks are completed before submitting.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {autoSubmitted && (
                      <span className="text-[11px] text-muted-foreground">
                        Time&apos;s up. Submitting automatically…
                      </span>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSubmit(false)}
                      disabled={isSubmitting || timerIsExpired}
                    >
                      {isSubmitting ? 'Submitting…' : 'Submit Writing test'}
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default WritingMockRunPage;
