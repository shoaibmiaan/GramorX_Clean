// pages/mock/listening/index.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

import ListeningNavTabs from '@/components/listening/ListeningNavTabs';
import ListeningInfoBanner from '@/components/listening/ListeningInfoBanner';
import type { ListeningTestSummary } from '@/lib/listening/types';

type Props = {
  tests: ListeningTestSummary[];
};

const ListeningMockIndexPage: NextPage<Props> = ({ tests }) => {
  const defaultTestSlug = tests[0]?.slug ?? null;

  return (
    <>
      <Head>
        <title>Listening Mock Tests • GramorX</title>
        <meta
          name="description"
          content="Full IELTS-style Listening mock tests in strict exam mode."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          {/* Header */}
          <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Mock exams · Listening
              </p>
              <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                Listening mock tests (strict mode)
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Real exam timing, no cheating, no second chances. Exactly how IELTS computer-based
                Listening feels.
              </p>
            </div>
            <ListeningNavTabs activeKey="mock" />
          </section>

          {/* Banner */}
          <section className="mb-6">
            <ListeningInfoBanner
              variant="warning"
              title="This is strict exam mode"
              body="Once you start a mock, the timer runs and you cannot casually jump around or reset like practice. Treat each mock like the real exam — use them rarely, not daily."
            />
          </section>

          {/* Quick start */}
          <section className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground sm:text-sm">
              {tests.length > 0
                ? `${tests.length} Listening mock test${tests.length > 1 ? 's' : ''} available.`
                : 'No Listening mocks configured yet.'}
            </p>
            {defaultTestSlug && (
              <Button asChild size="sm">
                <Link
                  href={`/mock/listening/overview?slug=${encodeURIComponent(defaultTestSlug)}`}
                >
                  <Icon name="PlayCircle" size={14} />
                  <span>Start a mock</span>
                </Link>
              </Button>
            )}
          </section>

          {/* Tests grid */}
          <section>
            {tests.length === 0 ? (
              <Card className="border-border bg-card/60 p-4 text-xs text-muted-foreground sm:text-sm">
                No Listening mock tests yet. In the admin panel, mark at least one{' '}
                <code className="text-[11px]">listening_tests.is_mock = true</code> to show it here.
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {tests.map((test) => (
                  <Card
                    key={test.id}
                    className="flex flex-col justify-between border-border bg-card/60 p-4"
                  >
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        <Icon name="Headphones" size={13} />
                        <span>Strict IELTS mock</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground sm:text-base">
                        {test.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {test.totalQuestions} questions ·{' '}
                        {Math.round(test.durationSeconds / 60)} min · {test.difficulty}
                      </p>
                      {test.estimatedBandRange && (
                        <p className="text-[11px] text-muted-foreground">
                          Typical band range:{' '}
                          <span className="font-medium text-foreground">
                            {test.estimatedBandRange.min.toFixed(1)}–
                            {test.estimatedBandRange.max.toFixed(1)}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/mock/listening/overview?slug=${encodeURIComponent(test.slug)}`}
                        >
                          <Icon name="FileText" size={13} />
                          <span>View instructions</span>
                        </Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link
                          href={`/mock/listening/overview?slug=${encodeURIComponent(test.slug)}`}
                        >
                          <Icon name="PlayCircle" size={13} />
                          <span>Start mock</span>
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </Container>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      props: {
        tests: [],
      },
    };
  }

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent('/mock/listening')}`,
        permanent: false,
      },
    };
  }

  const { data: rows, error } = await supabase
    .from('listening_tests')
    .select(
      'id, slug, title, difficulty, is_mock, total_questions, duration_seconds, estimated_band_min, estimated_band_max',
    )
    .eq('is_mock', true)
    .order('created_at', { ascending: false });

  if (error || !rows) {
    return {
      props: {
        tests: [],
      },
    };
  }

  const tests: ListeningTestSummary[] = rows.map((row: any) => {
    const base: ListeningTestSummary = {
      id: row.id,
      slug: row.slug,
      title: row.title,
      difficulty: row.difficulty,
      isMock: !!row.is_mock,
      totalQuestions: row.total_questions ?? 0,
      durationSeconds: row.duration_seconds ?? 0,
    };

    if (row.estimated_band_min != null && row.estimated_band_max != null) {
      return {
        ...base,
        estimatedBandRange: {
          min: Number(row.estimated_band_min),
          max: Number(row.estimated_band_max),
        },
      };
    }

    // no estimatedBandRange field at all when not set (avoids `undefined` in JSON)
    return base;
  });

  return {
    props: {
      tests,
    },
  };
};

export default ListeningMockIndexPage;
