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
import { cn } from '@/lib/utils';

import { computeDailyStreak } from '@/lib/reading/streak';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type DailyChallengeTest = {
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
  isDailyChallenge: boolean;
  challengeDate: string; // YYYY-MM-DD
};

type PageProps = {
  dailyTest: DailyChallengeTest | null;
  hasAttemptedToday: boolean;
  latestAttemptId: string | null;
  streakCurrent: number;
  today: string; // YYYY-MM-DD
  error?: string;
};

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

const formatPrettyDate = (yyyyMMdd: string) => {
  const d = new Date(`${yyyyMMdd}T00:00:00`);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const safeMinutes = (seconds?: number | null) => {
  const s = seconds ?? 600;
  return Math.max(1, Math.round(s / 60));
};

const toneForDifficulty = (difficulty: string | null) => {
  const d = difficulty?.toLowerCase();
  if (!d) return { label: 'Mixed', variant: 'neutral' as const };
  if (d === 'easy') return { label: 'Easy', variant: 'success' as const };
  if (d === 'medium') return { label: 'Standard', variant: 'info' as const };
  if (d === 'hard') return { label: 'Hard', variant: 'accent' as const };
  return { label: difficulty, variant: 'neutral' as const };
};

// -----------------------------------------------------------------------------
// PAGE
// -----------------------------------------------------------------------------

const DailyChallengePage: NextPage<PageProps> = ({
  dailyTest,
  hasAttemptedToday,
  latestAttemptId,
  streakCurrent,
  today,
  error,
}) => {
  if (error) {
    return (
      <>
        <Head>
          <title>Error · Daily Challenge · GramorX</title>
        </Head>

        <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 pb-20">
          <Container className="py-10 max-w-4xl">
            <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-6 text-center space-y-4">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger/15 text-danger">
                <Icon name="TriangleAlert" className="h-6 w-6" />
              </div>
              <h2 className="font-slab text-h3 text-foreground">Unable to load daily challenge</h2>
              <p className="text-small text-muted-foreground">{error}</p>

              <div className="flex flex-wrap justify-center gap-2 pt-2">
                <Button asChild variant="secondary" className="rounded-ds-2xl">
                  <Link href="/mock/reading/drill">
                    <Icon name="ChevronLeft" className="h-4 w-4 mr-2" />
                    Drill hub
                  </Link>
                </Button>
                <Button asChild variant="primary" className="rounded-ds-2xl">
                  <Link href="/mock/reading">
                    <Icon name="BookOpen" className="h-4 w-4 mr-2" />
                    Reading library
                  </Link>
                </Button>
              </div>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  const attempted = hasAttemptedToday && !!latestAttemptId;

  const primaryHref =
    attempted && latestAttemptId
      ? `/mock/reading/result/${latestAttemptId}?daily=1`
      : dailyTest
        ? `/mock/reading/${dailyTest.slug}?daily=1`
        : '/mock/reading';

  const reviewHref =
    attempted && latestAttemptId
      ? `/mock/reading/review/${latestAttemptId}?daily=1`
      : null;

  const diffMeta = toneForDifficulty(dailyTest?.difficulty ?? null);

  return (
    <>
      <Head>
        <title>Daily Challenge · Reading · GramorX</title>
        <meta
          name="description"
          content="Daily Reading drill to maintain streak: quick, focused practice with review."
        />
      </Head>

      <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 pb-20">
        <section className="pt-10 md:pt-14">
          <Container className="max-w-6xl space-y-8">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Reading Drills · Daily · {formatPrettyDate(today)}
                </p>
                <h1 className="font-slab text-h1 leading-tight text-foreground">
                  Daily Reading Challenge
                </h1>
                <p className="max-w-[70ch] text-small text-muted-foreground">
                  Quick drill today. Keep the streak. Review your mistakes immediately.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="secondary" className="rounded-ds-2xl">
                  <Link href="/mock/reading/drill">
                    <Icon name="ChevronLeft" className="mr-1 h-4 w-4" />
                    Drill hub
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="rounded-ds-2xl">
                  <Link href="/mock/reading/history">
                    <Icon name="History" className="mr-1 h-4 w-4" />
                    History
                  </Link>
                </Button>
              </div>
            </div>

            {/* Streak / status row */}
            <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success" size="sm" className="rounded-ds-full">
                    <Icon name="Flame" className="mr-1 h-3 w-3" />
                    {streakCurrent} day streak
                  </Badge>

                  <Badge
                    variant={attempted ? 'success' : 'accent'}
                    size="sm"
                    className="rounded-ds-full"
                  >
                    {attempted ? 'Completed' : 'Pending'}
                  </Badge>

                  <Badge variant="neutral" size="sm" className="rounded-ds-full">
                    <Icon name="CalendarDays" className="mr-1 h-3 w-3" />
                    {today}
                  </Badge>
                </div>

                <p className="text-caption text-muted-foreground">
                  Reset happens by date (YYYY-MM-DD). Complete once per day.
                </p>
              </div>
            </Card>

            {/* Main */}
            {dailyTest ? (
              <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
                {/* Main card */}
                <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-6">
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="success" size="sm" className="rounded-ds-full">
                            <Icon name="Zap" className="mr-1 h-3 w-3" />
                            Daily
                          </Badge>

                          <Badge variant={diffMeta.variant} size="sm" className="rounded-ds-full">
                            {diffMeta.label}
                          </Badge>

                          <Badge variant="neutral" size="sm" className="rounded-ds-full">
                            {dailyTest.examType}
                          </Badge>

                          <Badge
                            variant={dailyTest.isDailyChallenge ? 'info' : 'neutral'}
                            size="sm"
                            className="rounded-ds-full"
                          >
                            {dailyTest.isDailyChallenge ? 'Scheduled' : 'Fallback'}
                          </Badge>
                        </div>

                        <h2 className="font-slab text-h2 text-foreground">{dailyTest.title}</h2>

                        {dailyTest.description && (
                          <p className="text-small text-muted-foreground max-w-[80ch]">
                            {dailyTest.description}
                          </p>
                        )}
                      </div>

                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-ds-2xl bg-primary/10 text-primary">
                        <Icon name="BookOpen" className="h-6 w-6" />
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-ds-xl border border-border/60 bg-background/40 p-4">
                        <div className="text-caption text-muted-foreground">Passages</div>
                        <div className="mt-1 flex items-center gap-2 text-small font-semibold text-foreground">
                          <Icon name="Layers" className="h-4 w-4 text-primary" />
                          {dailyTest.totalPassages || 1}
                        </div>
                      </div>

                      <div className="rounded-ds-xl border border-border/60 bg-background/40 p-4">
                        <div className="text-caption text-muted-foreground">Questions</div>
                        <div className="mt-1 flex items-center gap-2 text-small font-semibold text-foreground">
                          <Icon name="ListChecks" className="h-4 w-4 text-primary" />
                          {dailyTest.totalQuestions}
                        </div>
                      </div>

                      <div className="rounded-ds-xl border border-border/60 bg-background/40 p-4">
                        <div className="text-caption text-muted-foreground">Time</div>
                        <div className="mt-1 flex items-center gap-2 text-small font-semibold text-foreground">
                          <Icon name="Clock" className="h-4 w-4 text-primary" />
                          {safeMinutes(dailyTest.durationSeconds)} min
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    {dailyTest.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {dailyTest.tags.slice(0, 10).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            size="sm"
                            className="rounded-ds-full"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {!attempted ? (
                        <Button asChild size="lg" className="rounded-ds-2xl flex-1">
                          <Link href={primaryHref}>
                            <Icon name="Play" className="mr-2 h-5 w-5" />
                            Start Today’s Challenge
                          </Link>
                        </Button>
                      ) : (
                        <>
                          <Button asChild size="lg" className="rounded-ds-2xl flex-1">
                            <Link href={primaryHref}>
                              <Icon name="FileText" className="mr-2 h-5 w-5" />
                              Open Result
                            </Link>
                          </Button>

                          {reviewHref && (
                            <Button
                              asChild
                              size="lg"
                              variant="secondary"
                              className="rounded-ds-2xl flex-1"
                            >
                              <Link href={reviewHref}>
                                <Icon name="Eye" className="mr-2 h-5 w-5" />
                                Review Attempt
                              </Link>
                            </Button>
                          )}
                        </>
                      )}
                    </div>

                    <p className="text-caption text-muted-foreground">
                      Tip: do the daily drill fast. Then spend 2x time reviewing mistakes.
                    </p>
                  </div>
                </Card>

                {/* Side */}
                <div className="space-y-4">
                  <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-5">
                    <h3 className="font-slab text-h3 text-foreground">Rules</h3>
                    <ul className="mt-3 space-y-2 text-small text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <Icon name="Check" className="h-4 w-4 text-primary mt-0.5" />
                        <span>One completion per day.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="Check" className="h-4 w-4 text-primary mt-0.5" />
                        <span>Streak is based on completion dates.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Icon name="Check" className="h-4 w-4 text-primary mt-0.5" />
                        <span>Review after completion to make it count.</span>
                      </li>
                    </ul>
                  </Card>

                  <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-5">
                    <h3 className="font-slab text-h3 text-foreground">Quick actions</h3>
                    <div className="mt-3 grid gap-2">
                      <Link
                        href="/mock/reading/drill/speed"
                        className={cn(
                          'flex items-center justify-between rounded-ds-xl border border-border/60 bg-background/40 px-3 py-2 text-small',
                          'hover:border-primary/30'
                        )}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Icon name="Zap" size={16} />
                          Speed training
                        </span>
                        <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                      </Link>

                      <Link
                        href="/mock/reading/weekly"
                        className={cn(
                          'flex items-center justify-between rounded-ds-xl border border-border/60 bg-background/40 px-3 py-2 text-small',
                          'hover:border-primary/30'
                        )}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Icon name="CalendarRange" size={16} />
                          Weekly plan
                        </span>
                        <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                      </Link>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-ds-xl bg-warning/15 text-warning">
                    <Icon name="TriangleAlert" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-slab text-h3 text-foreground">No daily challenge yet</h2>
                    <p className="mt-1 text-small text-muted-foreground">
                      We couldn’t find today’s challenge. Start any Reading mock from the library.
                    </p>
                    <Button asChild className="mt-4 rounded-ds-2xl">
                      <Link href="/mock/reading">
                        <Icon name="BookOpen" className="mr-2 h-4 w-4" />
                        Open Reading library
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </Container>
        </section>
      </main>
    </>
  );
};

// -----------------------------------------------------------------------------
// SSR
// -----------------------------------------------------------------------------

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  try {
    const supabase = getServerClient<Database>(ctx.req, ctx.res);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        redirect: {
          destination: '/login?next=' + encodeURIComponent(ctx.resolvedUrl ?? '/mock/reading/daily'),
          permanent: false,
        },
      };
    }

    // Use server-local date string (YYYY-MM-DD)
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;

    // Try daily challenge table (if exists), else fallback to latest active test.
    let dailyTest: DailyChallengeTest | null = null;

    const dailyChallengeRes = await supabase
      .from('reading_daily_challenges')
      .select(
        `
        id,
        challenge_date,
        test_id,
        reading_tests (
          id, slug, title, description, exam_type, difficulty,
          total_questions, total_passages, duration_seconds, tags
        )
      `,
      )
      .eq('challenge_date', today)
      .maybeSingle();

    if (dailyChallengeRes.data && (dailyChallengeRes.data as any).reading_tests) {
      const t: any = (dailyChallengeRes.data as any).reading_tests;
      dailyTest = {
        id: t.id,
        slug: t.slug,
        title: t.title,
        description: t.description ?? null,
        examType: t.exam_type ?? 'Academic',
        difficulty: t.difficulty ?? null,
        totalQuestions: t.total_questions ?? 10,
        totalPassages: t.total_passages ?? 1,
        durationSeconds: t.duration_seconds ?? 600,
        tags: t.tags ?? [],
        isDailyChallenge: true,
        challengeDate: (dailyChallengeRes.data as any).challenge_date,
      };
    } else {
      // fallback: latest active
      const randomRes = await supabase
        .from('reading_tests')
        .select('id, slug, title, description, exam_type, difficulty, total_questions, total_passages, duration_seconds, tags')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (randomRes.data) {
        const t = randomRes.data as any;
        dailyTest = {
          id: t.id,
          slug: t.slug,
          title: t.title,
          description: t.description ?? null,
          examType: t.exam_type ?? 'Academic',
          difficulty: t.difficulty ?? null,
          totalQuestions: t.total_questions ?? 10,
          totalPassages: t.total_passages ?? 1,
          durationSeconds: t.duration_seconds ?? 600,
          tags: t.tags ?? [],
          isDailyChallenge: false,
          challengeDate: today,
        };
      }
    }

    // Determine "attempted today" and get latest attemptId (for correct routing)
    let hasAttemptedToday = false;
    let latestAttemptId: string | null = null;

    if (dailyTest) {
      const attemptRes = await supabase
        .from('reading_attempts')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('test_id', dailyTest.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (attemptRes.data && attemptRes.data.length > 0) {
        hasAttemptedToday = true;
        latestAttemptId = attemptRes.data[0].id as any;
      }
    }

    // Proper streak: use your canonical logic
    const attemptsRes = await supabase
      .from('reading_attempts')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(250);

    const attempts = (attemptsRes.data ?? []).map((a: any) => ({ date: a.created_at }));
    const { currentStreak } = computeDailyStreak(attempts);

    return {
      props: {
        dailyTest,
        hasAttemptedToday,
        latestAttemptId,
        streakCurrent: currentStreak,
        today,
      },
    };
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[daily challenge] error:', err);
    return {
      props: {
        dailyTest: null,
        hasAttemptedToday: false,
        latestAttemptId: null,
        streakCurrent: 0,
        today: new Date().toISOString().slice(0, 10),
        error: err?.message ?? 'Failed to load daily challenge',
      },
    };
  }
};

export default DailyChallengePage;
