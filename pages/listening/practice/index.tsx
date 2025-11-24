// pages/listening/practice/index.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';
import ListeningModuleHero from '@/components/listening/ListeningModuleHero';
import ListeningNavTabs from '@/components/listening/ListeningNavTabs';

type BandRange = {
  min: number;
  max: number;
};

type ListeningTestSummary = {
  slug: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  totalQuestions: number;
  durationMinutes: number;
  estimatedBandRange: BandRange | null; // 👈 null, not undefined
  isMock: boolean;
};

type Props = {
  tests: ListeningTestSummary[];
};

const ListeningPracticePage: NextPage<Props> = ({ tests }) => {
  const hasTests = tests.length > 0;

  return (
    <>
      <Head>
        <title>Listening Practice • GramorX</title>
        <meta
          name="description"
          content="IELTS Listening practice tests with flexible timers, instant band estimates, and detailed review."
        />
      </Head>

      <main className="min-h-screen bg-background">
        <ListeningModuleHero activeTab="practice" />
        <ListeningNavTabs active="practice" />

        <section className="py-6 sm:py-8">
          <Container>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                  Listening practice tests
                </h1>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Repeatable practice tests with flexible pacing. Use these before you burn a full
                  strict mock.
                </p>
              </div>

              <Button asChild size="sm" variant="outline">
                <Link href="/mock/listening">
                  <Icon name="Shield" size={14} />
                  <span>Go to strict mocks</span>
                </Link>
              </Button>
            </div>

            {!hasTests ? (
              <Card className="border-dashed border-border bg-card/60 p-6 text-center">
                <div className="mb-3 flex justify-center">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Icon
                      name="Headphones"
                      size={16}
                      className="text-muted-foreground"
                    />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-foreground sm:text-base">
                  No practice tests yet
                </h3>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Once you add Listening tests in the admin area, they will show up here.
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tests.map((test) => (
                  <Card
                    key={test.slug}
                    className="flex flex-col justify-between border-border bg-card/60 p-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <h2 className="text-sm font-semibold text-foreground sm:text-base">
                          {test.title}
                        </h2>
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                          <Icon name="FlaskConical" size={11} />
                          <span>Practice</span>
                        </span>
                      </div>

                      {test.description && (
                        <p className="text-xs text-muted-foreground sm:text-sm">
                          {test.description}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground sm:text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Icon name="CircleDot" size={11} />
                          <span>
                            {test.totalQuestions} question
                            {test.totalQuestions === 1 ? '' : 's'}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Icon name="Clock" size={11} />
                          <span>{test.durationMinutes} min</span>
                        </span>
                        {test.difficulty && (
                          <span className="inline-flex items-center gap-1">
                            <Icon name="Gauge" size={11} />
                            <span>{test.difficulty}</span>
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-[11px] text-muted-foreground sm:text-xs">
                        {test.estimatedBandRange ? (
                          <span>
                            Est. band{' '}
                            {test.estimatedBandRange.min.toFixed(1)}–{test.estimatedBandRange.max.toFixed(1)}
                          </span>
                        ) : (
                          <span>Band range not set</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <Button asChild size="sm" className="flex-1 justify-center">
                        <Link href={`/listening/practice/${encodeURIComponent(test.slug)}`}>
                          <Icon name="PlayCircle" size={14} />
                          <span>Start practice</span>
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Container>
        </section>
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
        destination: `/login?next=${encodeURIComponent('/listening/practice')}`,
        permanent: false,
      },
    };
  }

  const { data: rows, error } = await supabase
    .from('listening_tests')
    .select(
      'slug, title, description, difficulty, is_mock, total_questions, total_score, duration_seconds, estimated_band_min, estimated_band_max',
    )
    .eq('is_mock', false)
    .order('created_at', { ascending: true });

  if (error) {
    // Fallback: no tests, but page still renders
    return {
      props: {
        tests: [],
      },
    };
  }

  const tests: ListeningTestSummary[] =
    rows?.map((row: any) => {
      const hasBand =
        row.estimated_band_min !== null &&
        row.estimated_band_min !== undefined &&
        row.estimated_band_max !== null &&
        row.estimated_band_max !== undefined;

      return {
        slug: row.slug,
        title: row.title,
        description: row.description ?? null,
        difficulty: row.difficulty ?? null,
        totalQuestions: row.total_questions ?? 0,
        durationMinutes: Math.round((row.duration_seconds ?? 0) / 60),
        estimatedBandRange: hasBand
          ? {
              min: Number(row.estimated_band_min),
              max: Number(row.estimated_band_max),
            }
          : null, // 👈 key fix
        isMock: !!row.is_mock,
      };
    }) ?? [];

  return {
    props: {
      tests,
    },
  };
};

export default ListeningPracticePage;
