// pages/mock/reading/result/[attemptId].tsx
import * as React from 'react';
import Head from 'next/head';
import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { Icon } from '@/components/design-system/Icon';
import { ReadingResultSummary } from '@/components/reading/ReadingResultSummary';

type AttemptSummary = {
  id: string;
  rawScore: number | null;
  bandScore: number | null;
  questionCount: number | null;
  durationSeconds: number | null;
  createdAt: string;
};

type TestSummary = {
  id: string;
  slug: string;
  title: string;
  examType: string;
  totalQuestions: number | null;
  durationSeconds: number | null;
};

type PageProps = {
  attempt: AttemptSummary | null;
  test: TestSummary | null;
  isLoggedIn: boolean;
};

const ReadingResultPage: NextPage<PageProps> = ({ attempt, test, isLoggedIn }) => {
  const notFound = !attempt || !test;

  if (notFound) {
    return (
      <>
        <Head>
          <title>Reading result · GramorX</title>
        </Head>
        <Container className="py-10">
          <Card className="mx-auto max-w-xl p-8 space-y-4 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface-elevated">
              <Icon name="alert-triangle" className="h-5 w-5 text-destructive" />
            </div>

            <p className="text-sm text-foreground">
              {isLoggedIn
                ? "We couldn’t find your attempt. Please try the test again."
                : 'You need to be logged in to view this result.'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              {!isLoggedIn && (
                <Button asChild size="sm">
                  <Link href="/login?role=student">
                    <Icon name="log-in" className="h-4 w-4 mr-1" />
                    Log in
                  </Link>
                </Button>
              )}
              <Button asChild size="sm" variant="outline">
                <Link href="/mock/reading">
                  <Icon name="arrow-left" className="h-4 w-4 mr-1" />
                  Back to Reading mocks
                </Link>
              </Button>
            </div>
          </Card>
        </Container>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>
          Result – {test.title} · Reading Mock · GramorX
        </title>
      </Head>
      <Container className="py-10 max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Reading mock result
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              {test.title}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {test.examType === 'gt' ? 'General Training' : 'Academic'} ·{' '}
              {test.totalQuestions ?? attempt.questionCount ?? 40} questions ·{' '}
              {Math.round((test.durationSeconds ?? attempt.durationSeconds ?? 3600) / 60)} minutes
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="soft" className="text-[11px]">
              Attempted on {new Date(attempt.createdAt).toLocaleString()}
            </Badge>
            <div className="flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href={`/mock/reading/review/${attempt.id}`}>
                  <Icon name="eye" className="h-4 w-4 mr-1" />
                  Review answers
                </Link>
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link href="/mock/reading/history">
                  <Icon name="history" className="h-4 w-4 mr-1" />
                  View history
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <ReadingResultSummary attempt={attempt} test={test} />

        <Card className="p-4 text-xs text-muted-foreground space-y-2">
          <p>
            This result is based on IELTS-style band mapping for Reading. Actual exam bands may vary
            slightly, but this gives you a realistic snapshot of where you stand right now.
          </p>
          <p>
            For detailed question-by-question feedback, go to{' '}
            <span className="font-medium">Review answers</span>.
          </p>
        </Card>
      </Container>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const attemptIdParam = ctx.params?.attemptId;

  const supabase = getServerClient(ctx.req, ctx.res);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoggedIn = !!user;

  if (!attemptIdParam || typeof attemptIdParam !== 'string') {
    return {
      props: {
        attempt: null,
        test: null,
        isLoggedIn,
      },
    };
  }

  type AttemptRow = Database['public']['Tables']['reading_attempts']['Row'];
  type TestRow = Database['public']['Tables']['reading_tests']['Row'];

  // 1) get attempt
  const { data: attemptRow, error: attemptError } = await supabase
    .from('reading_attempts')
    .select('*')
    .eq('id', attemptIdParam)
    .maybeSingle<AttemptRow>();

  if (attemptError || !attemptRow) {
    // eslint-disable-next-line no-console
    console.error('reading_result: attempt error', attemptError);
    return {
      props: {
        attempt: null,
        test: null,
        isLoggedIn,
      },
    };
  }

  // extra safety: prevent viewing someone else’s attempt (in case RLS is loose)
  if (user && attemptRow.user_id !== user.id) {
    return {
      props: {
        attempt: null,
        test: null,
        isLoggedIn,
      },
    };
  }

  // 2) get test
  const { data: testRow, error: testError } = await supabase
    .from('reading_tests')
    .select('*')
    .eq('id', attemptRow.test_id)
    .maybeSingle<TestRow>();

  if (testError || !testRow) {
    // eslint-disable-next-line no-console
    console.error('reading_result: test error', testError);
    return {
      props: {
        attempt: null,
        test: null,
        isLoggedIn,
      },
    };
  }

  const attempt: AttemptSummary = {
    id: attemptRow.id,
    rawScore: attemptRow.raw_score,
    bandScore: attemptRow.band_score,
    // table doesn’t have question_count, pull from section_stats if present
    questionCount: (attemptRow.section_stats as any)?.totalQuestions ?? null,
    durationSeconds: attemptRow.duration_seconds,
    createdAt: attemptRow.started_at ?? attemptRow.created_at,
  };

  const test: TestSummary = {
    id: testRow.id,
    slug: testRow.slug,
    title: testRow.title,
    examType: testRow.exam_type,
    totalQuestions: testRow.total_questions,
    durationSeconds: testRow.duration_seconds,
  };

  return {
    props: {
      attempt,
      test,
      isLoggedIn,
    },
  };
};

export default ReadingResultPage;
