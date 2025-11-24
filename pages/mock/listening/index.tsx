// pages/mock/listening/index.tsx
import * as React from 'react';
import Head from 'next/head';
import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';
import MockOverviewStats from '@/components/listening/Mock/MockOverviewStats';
import type { ListeningTestSummary } from '@/lib/listening/types';

type Props = {
  tests: ListeningTestSummary[];
  stats: {
    lastBandScore: number | null;
    bestBandScore: number | null;
    totalMockAttempts: number;
  };
};

const MockListeningIndexPage: NextPage<Props> = ({ tests, stats }) => {
  const defaultTestSlug = tests[0]?.slug ?? null;

  return (
    <>
      <Head>
        <title>Listening Mocks • GramorX</title>
        <meta
          name="description"
          content="Full IELTS-style Listening mocks in strict exam mode."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          <section className="mb-6 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Icon name="Headphones" size={14} />
              <span>Listening · Full Mocks</span>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Strict IELTS Listening Mocks
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Exact exam-style timing and behaviour. No pause, no rewind, no sugar-coating.
                  Just you vs the test.
                </p>
              </div>
              {defaultTestSlug && (
                <Button asChild size="sm">
                  <Link href={`/mock/listening/run/${encodeURIComponent(defaultTestSlug)}`}>
                    <Icon name="Play" size={14} />
                    <span>Start next mock</span>
                  </Link>
                </Button>
              )}
            </div>
          </section>

          <section className="mb-6">
            <MockOverviewStats
              lastBandScore={stats.lastBandScore}
              bestBandScore={stats.bestBandScore}
              totalMockAttempts={stats.totalMockAttempts}
            />
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground sm:text-base">
                Available mock tests
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Pick any test. Behaviour will still be strict IELTS-style.
              </p>
            </div>

            {tests.length === 0 ? (
              <Card className="border-border bg-card/60 p-4 text-xs text-muted-foreground sm:text-sm">
                No listening mock tests are configured yet. Add some tests in the admin panel.
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {tests.map((test) => (
                  <Card
                    key={test.id}
                    className="flex h-full flex-col justify-between border-border bg-card/60 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                          <Icon name="Headphones" size={16} className="text-primary" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground sm:text-base">
                              {test.title}
                            </h3>
                            <Badge variant="neutral" size="sm">
                              Mock
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                            {test.totalQuestions} questions ·{' '}
                            {Math.round(test.durationSeconds / 60)} min
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Icon name="Shield" size={12} />
                        <span>Real exam conditions</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <Button asChild size="xs" variant="outline">
                          <Link
                            href={`/mock/listening/test/${encodeURIComponent(test.slug)}`}
                            className="inline-flex items-center gap-1"
                          >
                            <span>Preview</span>
                            <Icon name="Eye" size={12} />
                          </Link>
                        </Button>
                        <Button asChild size="xs">
                          <Link
                            href={`/mock/listening/run/${encodeURIComponent(test.slug)}`}
                            className="inline-flex items-center gap-1"
                          >
                            <span>Start mock</span>
                            <Icon name="ArrowRight" size={12} />
                          </Link>
                        </Button>
                      </div>
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
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent('/mock/listening')}`,
        permanent: false,
      },
    };
  }

  const { data: testsRows } = await supabase
    .from('listening_tests')
    .select(
      'id, slug, title, difficulty, is_mock, total_questions, duration_seconds',
    )
    .eq('is_mock', true)
    .order('title', { ascending: true });

  const tests: ListeningTestSummary[] =
    testsRows?.map((row: any) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      difficulty: row.difficulty,
      isMock: row.is_mock,
      totalQuestions: row.total_questions,
      durationSeconds: row.duration_seconds,
    })) ?? [];

  const { data: attemptsRows } = await supabase
    .from('attempts_listening')
    .select('band_score, submitted_at, mode, status')
    .eq('user_id', user.id)
    .eq('mode', 'mock')
    .eq('status', 'completed') // status now matches new enum
    .order('submitted_at', { ascending: false });

  let lastBandScore: number | null = null;
  let bestBandScore: number | null = null;

  if (attemptsRows && attemptsRows.length > 0) {
    const submitted = attemptsRows as Array<{ band_score: number | null }>;
    lastBandScore = submitted[0].band_score ?? null;
    bestBandScore =
      submitted.reduce<number | null>((best, a) => {
        if (a.band_score == null) return best;
        if (best == null || a.band_score > best) return a.band_score;
        return best;
      }, null) ?? null;
  }

  const stats = {
    lastBandScore,
    bestBandScore,
    totalMockAttempts: attemptsRows?.length ?? 0,
  };

  return {
    props: {
      tests,
      stats,
    },
  };
};

export default MockListeningIndexPage;
