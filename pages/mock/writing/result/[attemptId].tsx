// pages/mock/writing/result/[attemptId].tsx
import * as React from 'react';
import Head from 'next/head';
import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import { Alert } from '@/components/design-system/Alert';

type PageProps = {
  ok: boolean;
  error?: string;
  attempt?: {
    id: string;
    createdAt: string;
    testId: string;
    overallBand: number | null;
    task1Band: number | null;
    task2Band: number | null;
    totalWords: number | null;
  };
  test?: {
    id: string;
    slug: string;
    title: string;
    taskType: string | null;
    durationMinutes: number | null;
  };
};

const WritingResultPage: NextPage<PageProps> = ({ ok, error, attempt, test }) => {
  if (!ok || !attempt || !test) {
    return (
      <Container className="py-10">
        <Alert tone="danger" title="Result not available">
          {error ?? 'We could not find this Writing attempt or you do not have access.'}
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
        <title>
          Writing result · {test.title} | GramorX
        </title>
      </Head>

      <Container className="py-8 lg:py-10 space-y-6">
        {/* Top header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
              <Icon name="CheckCircle2" className="h-3.5 w-3.5" />
              <span>Writing mock completed</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">
              Result – {test.title}
            </h1>
            <p className="text-xs text-muted-foreground lg:text-sm">
              Attempt ID {attempt.id.slice(0, 8)} · {formattedDate}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button as={Link} href="/mock/writing/review" size="sm" tone="neutral" variant="outline">
              <Icon name="Eye" className="mr-1.5 h-4 w-4" />
              Review this attempt
            </Button>
            <Button as={Link} href="/mock/writing" size="sm">
              <Icon name="RefreshCw" className="mr-1.5 h-4 w-4" />
              Try another mock
            </Button>
          </div>
        </div>

        {/* Score cards */}
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="flex flex-col items-center justify-center gap-1 py-5 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Overall band
            </div>
            <div className="text-3xl font-semibold">
              {attempt.overallBand ?? '—'}
            </div>
            <div className="text-xs text-muted-foreground">Estimated Writing band</div>
          </Card>

          <Card className="flex flex-col items-center justify-center gap-1 py-5 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Task 1 band
            </div>
            <div className="text-2xl font-semibold">
              {attempt.task1Band ?? '—'}
            </div>
            <div className="text-xs text-muted-foreground">
              Based on your Task 1 response
            </div>
          </Card>

          <Card className="flex flex-col items-center justify-center gap-1 py-5 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Task 2 band
            </div>
            <div className="text-2xl font-semibold">
              {attempt.task2Band ?? '—'}
            </div>
            <div className="text-xs text-muted-foreground">
              Based on your Task 2 response
            </div>
          </Card>
        </div>

        {/* Meta + AI coach hook */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2 space-y-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon name="FileText" className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Mock details</h2>
              </div>
              <Badge size="xs" tone="info">
                {test.taskType ?? 'writing'}
              </Badge>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <div>
                <dt className="font-medium">Test title</dt>
                <dd className="truncate">{test.title}</dd>
              </div>
              <div>
                <dt className="font-medium">Duration</dt>
                <dd>{test.durationMinutes ?? 60} minutes</dd>
              </div>
              <div>
                <dt className="font-medium">Attempted on</dt>
                <dd>{formattedDate}</dd>
              </div>
              <div>
                <dt className="font-medium">Total words (approx.)</dt>
                <dd>{attempt.totalWords ?? '—'}</dd>
              </div>
            </dl>
          </Card>

          <Card className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Icon name="Brain" className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">AI Coach summary</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              This card is ready for your AI evaluation output. Once your scoring
              pipeline is wired, show key strengths, weaknesses, and next steps
              for the candidate here.
            </p>
            <Button
              as={Link}
              href={`/mock/writing/review/${attempt.id}`}
              size="sm"
              tone="primary"
              variant="outline"
            >
              <Icon name="Sparkles" className="mr-1.5 h-4 w-4" />
              Open detailed feedback
            </Button>
          </Card>
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
        destination: `/login?next=/mock/writing/result/${encodeURIComponent(
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

  const { data: attemptRow, error: attemptError } = await supabase
    .from('attempts_writing')
    .select(
      'id, user_id, test_id, created_at, overall_band, task1_band, task2_band, total_words'
    )
    .eq('id', attemptId)
    .maybeSingle();

  if (attemptError) {
    console.error('[mock/writing/result/[attemptId]] attempt error', attemptError);
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
    .select('id, slug, title, task_type, duration_minutes')
    .eq('id', attemptRow.test_id)
    .maybeSingle();

  if (testError) {
    console.error('[mock/writing/result/[attemptId]] test error', testError);
  }

  if (!testRow) {
    return {
      props: {
        ok: false,
        error: 'Test for this attempt no longer exists.',
      },
    };
  }

  const attempt: PageProps['attempt'] = {
    id: attemptRow.id,
    createdAt: attemptRow.created_at,
    testId: attemptRow.test_id ?? '',
    overallBand: (attemptRow as any).overall_band ?? null,
    task1Band: (attemptRow as any).task1_band ?? null,
    task2Band: (attemptRow as any).task2_band ?? null,
    totalWords: (attemptRow as any).total_words ?? null,
  };

  const test: PageProps['test'] = {
    id: testRow.id,
    slug: testRow.slug,
    title: testRow.title,
    taskType: (testRow as any).task_type ?? null,
    durationMinutes: (testRow as any).duration_minutes ?? null,
  };

  return {
    props: {
      ok: true,
      attempt,
      test,
    },
  };
};

export default WritingResultPage;
