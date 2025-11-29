// pages/mock/reading/index.tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';
import { DailyChallengeBanner } from '@/components/reading/daily/DailyChallengeBanner';
import { BandPredictorCard } from '@/components/reading/analytics/BandPredictorCard';
import type { ReadingAttemptSummary } from '@/lib/reading/bandPredictor';
import { computeDailyStreak } from '@/lib/reading/streak';

type ReadingMockTest = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  examType: string | null;
  difficulty: string | null;
  questionCount: number | null;
  durationSeconds: number | null;
  lastAttemptedAt: string | null;
  lastBand: number | null;
};

type PageProps = {
  tests: ReadingMockTest[];
  attemptSummaries: ReadingAttemptSummary[];
  streakCurrent: number;
};

const ReadingMockHomePage: NextPage<PageProps> = ({
  tests,
  attemptSummaries,
  streakCurrent,
}) => {
  return (
    <>
      <Head>
        <title>IELTS Reading Mocks · GramorX</title>
      </Head>

      <section className="py-10 bg-background">
        <Container className="max-w-5xl space-y-6">
          {/* Hero */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <Badge size="xs" variant="outline">
                Reading Module
              </Badge>
              <h1 className="text-2xl font-semibold tracking-tight">
                Serious Reading mocks.{' '}
                <span className="bg-gradient-to-r from-pink-500 via-fuchsia-500 to-purple-500 bg-clip-text text-transparent">
                  Exam-room strict.
                </span>
              </h1>
              <p className="text-xs text-muted-foreground max-w-xl">
                Three full passages, 40 questions, and a strict timer – plus AI explanations,
                analytics, and daily drills that actually move your band.
              </p>
            </div>

            <div className="flex flex-col items-end gap-2 text-xs">
              <Button asChild size="sm">
                <Link href="/mock/reading/daily">
                  <Icon name="play-circle" className="h-4 w-4 mr-1" />
                  Start daily challenge
                </Link>
              </Button>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <Icon name="info" className="h-3.5 w-3.5" />
                Full mocks · Drills · Analytics
              </div>
            </div>
          </div>

          {/* Daily challenge + band predictor */}
          <DailyChallengeBanner streakCurrent={streakCurrent} />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)]">
            {/* Tests list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Available Reading tests
                </p>
                <div className="flex gap-1 text-[11px] text-muted-foreground">
                  <Badge size="xs" variant="outline">
                    {tests.length} test{tests.length !== 1 ? 's' : ''}
                  </Badge>
                  <Link
                    href="/mock/reading/history"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    <Icon name="clock" className="h-3 w-3" />
                    History
                  </Link>
                </div>
              </div>

              {tests.length === 0 && (
                <Card className="p-4 text-xs text-muted-foreground">
                  No Reading tests available yet. Add rows in{' '}
                  <code className="mx-1">reading_tests</code> to populate this list.
                </Card>
              )}

              {tests.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {tests.map((test) => {
                    const minutes = Math.round(
                      (test.durationSeconds ?? 3600) / 60,
                    );

                    return (
                      <Card
                        key={test.id}
                        className="flex flex-col justify-between p-4 space-y-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium line-clamp-2">
                              {test.title}
                            </span>
                            {test.examType && (
                              <Badge size="xs" variant="outline">
                                {test.examType === 'academic'
                                  ? 'Academic'
                                  : test.examType === 'gt'
                                  ? 'General'
                                  : test.examType}
                              </Badge>
                            )}
                          </div>
                          {test.description && (
                            <p className="text-[11px] text-muted-foreground line-clamp-2">
                              {test.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                          <div className="space-y-0.5">
                            <p>
                              {minutes} min ·{' '}
                              {test.questionCount ?? 40} questions
                            </p>
                            {test.difficulty && (
                              <p className="capitalize">
                                Level: {test.difficulty.toLowerCase()}
                              </p>
                            )}
                            {test.lastAttemptedAt && (
                              <p>
                                Last attempt:{' '}
                                {new Date(
                                  test.lastAttemptedAt,
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {test.lastBand != null && (
                              <p className="text-xs">
                                Last band:{' '}
                                <span className="font-semibold">
                                  {test.lastBand.toFixed(1)}
                                </span>
                              </p>
                            )}
                            <Button asChild size="sm">
                              <Link href={`/mock/reading/${test.slug}`}>
                                <Icon
                                  name="play-circle"
                                  className="h-3.5 w-3.5 mr-1"
                                />
                                Start mock
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right side: band predictor + quick links */}
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
      </section>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient<Database>(ctx);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Load tests
  const { data: testsRows } = await supabase
    .from('reading_tests')
    .select(
      'id, slug, title, description, exam_type, difficulty, question_count, duration_seconds, created_at',
    )
    .order('created_at', { ascending: true });

  // Load attempts if logged in
  let attemptSummaries: ReadingAttemptSummary[] = [];
  let streakCurrent = 0;
  const lastByTest = new Map<
    string,
    { createdAt: string; bandScore: number | null }
  >();

  if (user) {
    const { data: attemptsRows } = await supabase
      .from('attempts_reading')
      .select('id, test_id, raw_score, band_score, question_count, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    const attempts = attemptsRows ?? [];

    attemptSummaries = attempts.map((a) => ({
      rawScore: a.raw_score ?? 0,
      totalQuestions: a.question_count ?? 40,
      bandScore: a.band_score,
      createdAt: a.created_at,
    }));

    // latest per test
    for (const a of attempts) {
      const existing = lastByTest.get(a.test_id);
      if (!existing || new Date(a.created_at) > new Date(existing.createdAt)) {
        lastByTest.set(a.test_id, {
          createdAt: a.created_at,
          bandScore: a.band_score,
        });
      }
    }

    // streak
    const { currentStreak } = computeDailyStreak(
      attempts.map((a) => ({ date: a.created_at })),
    );
    streakCurrent = currentStreak;
  }

  const tests: ReadingMockTest[] =
    (testsRows ?? []).map((row) => {
      const last = lastByTest.get(row.id) ?? null;
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        description: row.description,
        examType: row.exam_type,
        difficulty: row.difficulty,
        questionCount: row.question_count,
        durationSeconds: row.duration_seconds,
        lastAttemptedAt: last?.createdAt ?? null,
        lastBand: last?.bandScore ?? null,
      };
    }) ?? [];

  return {
    props: {
      tests,
      attemptSummaries,
      streakCurrent,
    },
  };
};

export default ReadingMockHomePage;
