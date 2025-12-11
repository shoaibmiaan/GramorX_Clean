// pages/mock/writing/review/[attemptId].tsx
import * as React from 'react';
import Head from 'next/head';
import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import { Alert } from '@/components/design-system/Alert';
import { Badge } from '@/components/design-system/Badge';

type PageProps = {
  ok: boolean;
  error?: string;
  attempt?: {
    id: string;
    createdAt: string;
    testId: string;
  };
  test?: {
    id: string;
    slug: string;
    title: string;
  };
  answers?: {
    taskNumber: number;
    label: 'Task 1' | 'Task 2';
    text: string;
    wordCount: number | null;
    band: number | null;
  }[];
};

const WritingReviewPage: NextPage<PageProps> = ({ ok, error, attempt, test, answers }) => {
  if (!ok || !attempt || !test || !answers?.length) {
    return (
      <Container className="py-10">
        <Alert tone="danger" title="Review not available">
          {error ?? 'We could not load this Writing attempt or its answers.'}
        </Alert>
        <div className="mt-4">
          <Button as={Link} href="/mock/writing" size="sm">
            <Icon name="ArrowLeft" className="mr-1.5 h-4 w-4" />
            Back to Writing mocks
          </Button>
        </div>
      </Container>
    );
  }

  const formattedDate = new Date(attempt.createdAt).toLocaleString();

  return (
    <>
      <Head>
        <title>Review – {test.title} | Writing Mock | GramorX</title>
      </Head>

      <Container className="py-8 lg:py-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              <Icon name="Eye" className="h-3.5 w-3.5" />
              <span>Review mode · Writing mock</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">
              Review – {test.title}
            </h1>
            <p className="text-xs text-muted-foreground lg:text-sm">
              Attempt ID {attempt.id.slice(0, 8)} · {formattedDate}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              as={Link}
              href={`/mock/writing/result/${attempt.id}`}
              size="sm"
              tone="neutral"
              variant="outline"
            >
              <Icon name="BarChart3" className="mr-1.5 h-4 w-4" />
              View result summary
            </Button>
            <Button as={Link} href="/mock/writing" size="sm">
              <Icon name="Home" className="mr-1.5 h-4 w-4" />
              Back to Writing mocks
            </Button>
          </div>
        </div>

        {/* Answers */}
        <div className="space-y-4">
          {answers.map((answer) => (
            <Card key={answer.taskNumber} className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Icon name="PenSquare" className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold">
                    {answer.label}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  {answer.wordCount !== null && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5">
                      <Icon name="Type" className="h-3 w-3" />
                      {answer.wordCount} words
                    </span>
                  )}
                  {answer.band !== null && (
                    <Badge size="xs" tone="success">
                      Band {answer.band.toFixed(1)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                {answer.text || <span className="text-muted-foreground">No answer recorded.</span>}
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient(ctx);
  const attemptId = ctx.params?.attemptId as string | undefined;

  if (!attemptId) {
    return {
      props: {
        ok: false,
        error: 'Missing attempt id in URL.',
      },
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=/mock/writing/review/${encodeURIComponent(
          attemptId
        )}`,
        permanent: false,
      },
    };
  }

  type AttemptsWritingRow =
    Database['public']['Tables']['attempts_writing']['Row'];
  type WritingTestsRow =
    Database['public']['Tables']['writing_tests']['Row'];
  type WritingAnswersRow =
    Database['public']['Tables']['writing_user_answers']['Row'];

  const { data: attemptRow, error: attemptError } = await supabase
    .from('attempts_writing')
    .select('id, user_id, test_id, created_at')
    .eq('id', attemptId)
    .maybeSingle();

  if (attemptError) {
    console.error('[mock/writing/review/[attemptId]] attempt error', attemptError);
  }

  if (!attemptRow || attemptRow.user_id !== user.id) {
    return {
      props: {
        ok: false,
        error: 'Attempt not found or you do not have access.',
      },
    };
  }

  const { data: testRow, error: testError } = await supabase
    .from('writing_tests')
    .select('id, slug, title')
    .eq('id', attemptRow.test_id)
    .maybeSingle();

  if (testError) {
    console.error('[mock/writing/review/[attemptId]] test error', testError);
  }

  if (!testRow) {
    return {
      props: {
        ok: false,
        error: 'Test for this attempt no longer exists.',
      },
    };
  }

  const { data: answersRaw, error: answersError } = await supabase
    .from('writing_user_answers')
    .select(
      'task_number, label, text, word_count, band'
    )
    .eq('attempt_id', attemptRow.id)
    .order('task_number', { ascending: true });

  if (answersError) {
    console.error('[mock/writing/review/[attemptId]] answers error', answersError);
  }

  const answers =
    (answersRaw as WritingAnswersRow[] | null)?.map((a) => ({
      taskNumber: (a as any).task_number as number,
      label: ((a as any).label as 'Task 1' | 'Task 2') ?? 'Task 1',
      text: (a as any).text ?? '',
      wordCount: (a as any).word_count ?? null,
      band: (a as any).band ?? null,
    })) ?? [];

  return {
    props: {
      ok: true,
      attempt: {
        id: attemptRow.id,
        createdAt: attemptRow.created_at,
        testId: attemptRow.test_id ?? '',
      },
      test: {
        id: testRow.id,
        slug: testRow.slug,
        title: testRow.title,
      },
      answers,
    },
  };
};

export default WritingReviewPage;
