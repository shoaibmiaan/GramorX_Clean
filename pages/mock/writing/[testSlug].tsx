// pages/mock/writing/[testSlug].tsx
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

import {
  WritingExamShell,
  type WritingTaskConfig,
  type WritingExamShellSubmitPayload,
} from '@/components/writing/WritingExamShell';

type Db = Database['public'];

type WritingTestRun = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  durationSeconds: number;
};

type PageProps = {
  test: WritingTestRun | null;
  tasks: WritingTaskConfig[];
};

const DEFAULT_DURATION_SECONDS = 60 * 60;

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const testSlug = typeof ctx.params?.testSlug === 'string' ? ctx.params.testSlug : null;

  if (!testSlug) {
    return { redirect: { destination: '/mock/writing', permanent: false } };
  }

  const supabase = getServerClient(ctx.req, ctx.res);

  const { data: testRow, error: testErr } = await supabase
    .from<Db['Tables']['writing_tests']['Row']>('writing_tests')
    .select('id, slug, title, description, duration_seconds, is_active')
    .eq('slug', testSlug)
    .maybeSingle();

  if (testErr || !testRow || testRow.is_active === false) return { notFound: true };

  const { data: taskRows, error: tasksErr } = await supabase
    .from<Db['Tables']['writing_tasks']['Row']>('writing_tasks')
    .select('id, task_number, prompt, word_limit_min')
    .eq('test_id', testRow.id)
    .order('task_number', { ascending: true });

  if (tasksErr) return { redirect: { destination: '/mock/writing', permanent: false } };

  const tasks: WritingTaskConfig[] =
    (taskRows ?? []).map((t) => {
      const num = t.task_number ?? 0;
      const label = num === 2 ? 'Task 2' : 'Task 1';
      const minWords = t.word_limit_min ?? (num === 2 ? 250 : 150);

      return {
        id: String(t.id),
        label,
        heading: '',
        body: t.prompt ?? '',
        recommendedMinutes: num === 2 ? 40 : 20,
        minWords,
      };
    }) ?? [];

  const test: WritingTestRun = {
    id: String(testRow.id),
    slug: String(testRow.slug),
    title: testRow.title ?? 'Writing Mock',
    description: testRow.description ?? null,
    durationSeconds: testRow.duration_seconds ?? DEFAULT_DURATION_SECONDS,
  };

  return { props: { test, tasks } };
};

const WritingMockRunBySlugPage: NextPage<PageProps> = ({ test, tasks }) => {
  const router = useRouter();

  const [attemptId, setAttemptId] = React.useState<string | null>(null);
  const [startedAt, setStartedAt] = React.useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [startError, setStartError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!test?.id) return;

    let cancelled = false;

    (async () => {
      try {
        setStartError(null);

        const res = await fetch('/api/mock/writing/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testId: test.id }),
        });

        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(json?.error ?? 'Failed to start attempt');
        }

        const json = (await res.json()) as { attemptId: string; startedAt: string };
        if (cancelled) return;

        setAttemptId(json.attemptId);
        setStartedAt(json.startedAt);
      } catch (e) {
        if (cancelled) return;
        setStartError(e instanceof Error ? e.message : 'Failed to start attempt');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [test?.id]);

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

  if (startError) {
    return (
      <>
        <Head>
          <title>{test.title} · Writing Mock · GramorX</title>
        </Head>
        <main className="flex min-h-screen items-center bg-lightBg">
          <Container className="max-w-3xl py-10">
            <div className="space-y-4 rounded-ds-xl border border-destructive/40 bg-destructive/10 p-6 text-center">
              <h2 className="text-lg font-semibold text-destructive">Failed to start attempt</h2>
              <p className="text-sm text-muted-foreground">{startError}</p>
              <div className="flex justify-center gap-2">
                <Button asChild variant="secondary">
                  <Link href="/mock/writing">Back</Link>
                </Button>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            </div>
          </Container>
        </main>
      </>
    );
  }

  if (!attemptId || !startedAt) {
    return (
      <>
        <Head>
          <title>{test.title} · Writing Mock · GramorX</title>
        </Head>
        <main className="flex min-h-screen items-center bg-lightBg">
          <Container className="max-w-3xl py-10">
            <div className="space-y-3 rounded-ds-xl border border-border bg-card p-6 text-center shadow-sm">
              <p className="text-sm font-semibold">Starting your attempt…</p>
              <p className="text-xs text-muted-foreground">This should take a second.</p>
            </div>
          </Container>
        </main>
      </>
    );
  }

  const onSubmit = async (payload: WritingExamShellSubmitPayload) => {
    if (isSubmitting) return;
    if (!attemptId) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const t1 = payload.answers.find((a) => a.label === 'Task 1');
      const t2 = payload.answers.find((a) => a.label === 'Task 2');
      if (!t1 || !t2) throw new Error('Both tasks are required');

      const res = await fetch('/api/mock/writing/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId,
          autoSubmitted: payload.autoSubmitted,
          answers: [
            { taskNumber: 1, text: t1.text, wordCount: t1.wordCount },
            { taskNumber: 2, text: t2.text, wordCount: t2.wordCount },
          ],
        }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(json?.error ?? 'Failed to submit attempt');
      }

      await router.push(`/mock/writing/result/${encodeURIComponent(attemptId)}`);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to submit attempt');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{test.title} · Writing Mock · GramorX</title>
      </Head>

      {submitError ? (
        <div className="bg-lightBg">
          <Container className="max-w-6xl pt-4">
            <div className="rounded-ds-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          </Container>
        </div>
      ) : null}

      <WritingExamShell
        attemptId={attemptId}
        startedAt={startedAt}
        durationSeconds={test.durationSeconds}
        testTitle={test.title}
        examType="Academic"
        tasks={tasks}
        submitMode="enabled"
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
        onExit={() => router.push('/mock/writing')}
      />
    </>
  );
};

export default WritingMockRunBySlugPage;
