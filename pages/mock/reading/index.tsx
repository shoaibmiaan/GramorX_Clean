// pages/mock/reading/index.tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';

import { ReadingFilterBar } from '@/components/reading/ReadingFilterBar';
import { ReadingForecastPanel } from '@/components/reading/ReadingForecastPanel';
import { AISummaryCard } from '@/components/reading/AISummaryCard';
import { DailyChallengeBanner } from '@/components/reading/daily/DailyChallengeBanner';
import { BandPredictorCard } from '@/components/reading/analytics/BandPredictorCard';
import type { ReadingAttemptSummary } from '@/lib/reading/bandPredictor';
import { computeDailyStreak } from '@/lib/reading/streak';

type ReadingMockListItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  examType: string;
  difficulty: string | null;
  totalQuestions: number;
  totalPassages: number;
  durationSeconds: number;
  tags: string[];
};

type PageProps = {
  tests: ReadingMockListItem[];
  attemptSummaries: ReadingAttemptSummary[];
  streakCurrent: number;
  error?: string;
};

const ReadingMockIndexPage: NextPage<PageProps> = ({
  tests,
  attemptSummaries,
  streakCurrent,
  error,
}) => {
  if (error) {
    return (
      <>
        <Head>
          <title>Error · Reading Mocks · GramorX</title>
        </Head>
        <section className="py-10 bg-background">
          <Container className="max-w-5xl space-y-6">
            <Card className="p-6 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <Icon name="alert-triangle" className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold">Unable to load Reading mocks</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button asChild>
                <Link href="/">
                  <Icon name="home" className="h-4 w-4 mr-2" />
                  Go Home
                </Link>
              </Button>
            </Card>
          </Container>
        </section>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Reading Mocks · GramorX</title>
      </Head>
      <Container className="py-8 space-y-8">
        {/* Hero + right rail (design from file 2) */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Badge size="xs" variant="outline">
                Reading Module
              </Badge>
              <h1 className="text-2xl font-semibold tracking-tight">
                Strict IELTS Reading Mock Room
              </h1>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Full-length, exam-style reading tests with proper band scoring, timing
                and analytics. Three full passages, 40 questions, exam-room strict –
                plus AI explanations, daily drills and analytics that actually move your band.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <Button asChild size="sm">
                <Link href="/mock/reading/daily">
                  <Icon name="play-circle" className="h-4 w-4 mr-1" />
                  Start daily challenge
                </Link>
              </Button>
              <Badge variant="subtle" className="rounded-ds-xl">
                <Icon name="Sparkles" className="mr-1 h-3 w-3" />
                AI feedback ready
              </Badge>
              <Badge variant="outline" className="rounded-ds-xl">
                Tracks band from each attempt
              </Badge>
              <Badge variant="outline" className="rounded-ds-xl">
                DB-backed · enterprise-safe
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <ReadingForecastPanel />
            <AISummaryCard />
          </div>
        </div>

        {/* Daily challenge strip (from file 1) */}
        <DailyChallengeBanner streakCurrent={streakCurrent} />

        {/* Filter bar (from file 2) */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Available Reading Mocks</h2>
            <p className="text-xs text-muted-foreground">
              Each card maps directly to a row in <code>reading_tests</code>.
            </p>
          </div>
          <ReadingFilterBar className="justify-end" />
        </div>

        {/* Main grid: test cards + right-side power tools / band predictor */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)]">
          {/* Tests grid – design from file 2 */}
          <div className="space-y-3">
            {tests.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                No reading mocks are active yet. Seed some rows into{' '}
                <code>public.reading_tests</code> and refresh.
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {tests.map((t) => (
                  <Card key={t.id} className="flex flex-col p-4 justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="soft" className="uppercase rounded-ds text-[10px]">
                          {t.examType === 'gt' ? 'General Training' : 'Academic'}
                        </Badge>
                        {t.difficulty && (
                          <Badge variant="subtle" className="rounded-ds text-[10px]">
                            {t.difficulty}
                          </Badge>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold line-clamp-2">{t.title}</h3>
                      {t.description && (
                        <p className="text-xs text-muted-foreground line-clamp-3">
                          {t.description}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {t.totalQuestions} questions · {t.totalPassages} passages ·{' '}
                        {Math.round(t.durationSeconds / 60)} minutes
                      </p>
                      {t.tags?.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {t.tags.slice(0, 4).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="rounded-ds text-[10px] px-1.5 py-0.5"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <Link href={`/mock/reading/${t.slug}`} className="flex-1">
                        <Button
                          variant="primary"
                          className="w-full rounded-ds-xl text-xs font-semibold"
                        >
                          Enter full mock
                        </Button>
                      </Link>
                      <Button
                        asChild
                        variant="secondary"
                        size="icon"
                        className="rounded-ds"
                        aria-label="View attempts for this test"
                      >
                        <Link
                          href={`/mock/reading/history?test=${encodeURIComponent(t.slug)}`}
                        >
                          <Icon name="History" className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Right side: Band predictor + Power tools (from file 1) */}
          <div className="space-y-3">
            <BandPredictorCard attempts={attemptSummaries} />

            <Card className="p-3 space-y-2 text-xs">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                Power tools
              </p>
              <div className="space-y-1.5">
                <Link
                  href="/mock/reading/drill/question-type?type=TFNG"
                  className="flex items-center justify-between rounded-md border px-2 py-1.5 hover:bg-muted/60 transition-colors"
                >
                  <span>Question-type drills</span>
                  <Icon name="target" className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/mock/reading/drill/passage?test=any&p=1"
                  className="flex items-center justify-between rounded-md border px-2 py-1.5 hover:bg-muted/60 transition-colors"
                >
                  <span>Single-passage practice</span>
                  <Icon name="file-text" className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/mock/reading/drill/speed"
                  className="flex items-center justify-between rounded-md border px-2 py-1.5 hover:bg-muted/60 transition-colors"
                >
                  <span>Speed training modes</span>
                  <Icon name="zap" className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/mock/reading/techniques"
                  className="flex items-center justify-between rounded-md border px-2 py-1.5 hover:bg-muted/60 transition-colors"
                >
                  <span>Techniques trainer</span>
                  <Icon name="book-open" className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/mock/reading/analytics"
                  className="flex items-center justify-between rounded-md border px-2 py-1.5 hover:bg-muted/60 transition-colors"
                >
                  <span>Analytics & weaknesses</span>
                  <Icon name="activity" className="h-3.5 w-3.5" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  try {
    const supabase = getServerClient<Database>(ctx);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      // eslint-disable-next-line no-console
      console.error('reading index auth error', authError);
    }

    // Tests from reading_tests (schema from your latest dump)
    const { data: testsRows, error: testsError } = await supabase
      .from('reading_tests')
      .select(
        'id, slug, title, description, exam_type, difficulty, total_questions, total_passages, duration_seconds, tags, created_at',
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (testsError) {
      throw new Error(`Failed to load tests: ${testsError.message}`);
    }

    // Attempts for current user from reading_attempts
    let attemptSummaries: ReadingAttemptSummary[] = [];
    let streakCurrent = 0;

    if (user) {
      const { data: attemptsRows, error: attemptsError } = await supabase
        .from('reading_attempts')
        .select(
          'id, test_id, raw_score, band_score, created_at, reading_tests(total_questions)',
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (attemptsError) {
        throw new Error(`Failed to load attempts: ${attemptsError.message}`);
      }

      const attempts =
        (attemptsRows ?? []) as {
          id: string;
          test_id: string;
          raw_score: number | null;
          band_score: number | null;
          created_at: string;
          reading_tests: { total_questions: number | null } | null;
        }[];

      attemptSummaries = attempts.map((a) => ({
        rawScore: a.raw_score ?? 0,
        totalQuestions: a.reading_tests?.total_questions ?? 40,
        bandScore: a.band_score ?? null,
        createdAt: a.created_at,
      }));

      const { currentStreak } = computeDailyStreak(
        attempts.map((a) => ({ date: a.created_at })),
      );
      streakCurrent = currentStreak;
    }

    const tests: ReadingMockListItem[] =
      testsRows?.map((row) => ({
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description ?? null,
        examType: row.exam_type,
        difficulty: row.difficulty ?? null,
        totalQuestions: row.total_questions ?? 40,
        totalPassages: row.total_passages ?? 3,
        durationSeconds: row.duration_seconds ?? 3600,
        tags: row.tags ?? [],
      })) ?? [];

    return {
      props: {
        tests,
        attemptSummaries,
        streakCurrent,
      },
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[reading index] error:', err);
    return {
      props: {
        tests: [],
        attemptSummaries: [],
        streakCurrent: 0,
        error:
          err instanceof Error ? err.message : 'Failed to load Reading mocks',
      },
    };
  }
};

export default ReadingMockIndexPage;
