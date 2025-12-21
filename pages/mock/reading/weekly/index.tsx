import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { Icon } from '@/components/design-system/Icon';
import { cn } from '@/lib/utils';

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

type WeeklyTest = {
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
  test: WeeklyTest | null;
  hasAttempted: boolean;
  latestAttemptId: string | null;
  weekNumber: number;
  year: number;
  weekLabel: string; // e.g. "2025-12-08 → 2025-12-14"
  error?: string;
};

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

function getISOWeek(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { week: weekNo, year: date.getUTCFullYear() };
}

const safeMinutes = (seconds?: number | null) => {
  const s = seconds ?? 3600;
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

const yyyyMmDd = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

function getISOWeekWindowLocal(now: Date) {
  // Monday 00:00:00 -> Sunday 23:59:59 (LOCAL time)
  const day = now.getDay(); // 0 Sun .. 6 Sat
  const diffToMonday = (day + 6) % 7; // Mon=0
  const start = new Date(now);
  start.setDate(now.getDate() - diffToMonday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

// ------------------------------------------------------------

const WeeklyChallengePage: NextPage<PageProps> = ({
  test,
  hasAttempted,
  latestAttemptId,
  weekNumber,
  year,
  weekLabel,
  error,
}) => {
  const router = useRouter();

  if (error) {
    return (
      <>
        <Head>
          <title>Weekly Reading Challenge · GramorX</title>
        </Head>
        <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 pb-20">
          <Container className="py-10 max-w-4xl">
            <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-6 text-center space-y-4">
              <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger/15 text-danger">
                <Icon name="TriangleAlert" className="h-6 w-6" />
              </div>
              <h2 className="font-slab text-h3 text-foreground">Unable to load weekly challenge</h2>
              <p className="text-small text-muted-foreground">{error}</p>

              <Button asChild className="rounded-ds-2xl">
                <Link href="/mock/reading/drill">
                  <Icon name="ChevronLeft" className="h-4 w-4 mr-2" /> Drill hub
                </Link>
              </Button>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  const attempted = hasAttempted && !!latestAttemptId;

  const primaryHref =
    attempted && latestAttemptId
      ? `/mock/reading/result/${latestAttemptId}?weekly=1`
      : test
        ? `/mock/reading/${test.slug}?weekly=1`
        : '/mock/reading';

  const reviewHref =
    attempted && latestAttemptId
      ? `/mock/reading/review/${latestAttemptId}?weekly=1`
      : null;

  const difficultyMeta = toneForDifficulty(test?.difficulty ?? null);

  const handlePrimary = () => {
    void router.push(primaryHref);
  };

  return (
    <>
      <Head>
        <title>Weekly Reading Challenge · GramorX</title>
        <meta
          name="description"
          content="Your weekly Reading mock: exam-room discipline, strict timer, and real review."
        />
      </Head>

      <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 pb-20">
        <section className="pt-10 md:pt-14">
          <Container className="max-w-5xl space-y-8">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Weekly Plan · Week {weekNumber}, {year} · {weekLabel}
                </p>
                <h1 className="font-slab text-h1 leading-tight text-foreground">
                  Weekly Reading Challenge
                </h1>
                <p className="max-w-[70ch] text-small text-muted-foreground">
                  Your one full Reading mock for the week. Exam-room rules apply. Review is mandatory.
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

            {/* Status row */}
            <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="accent" size="sm" className="rounded-ds-full">
                    <Icon name="CalendarRange" className="mr-1 h-3 w-3" />
                    Weekly
                  </Badge>

                  <Badge
                    variant={attempted ? 'success' : 'accent'}
                    size="sm"
                    className="rounded-ds-full"
                  >
                    {attempted ? 'Completed' : 'Pending'}
                  </Badge>

                  {test?.examType && (
                    <Badge variant="neutral" size="sm" className="rounded-ds-full">
                      {test.examType}
                    </Badge>
                  )}

                  {test?.difficulty && (
                    <Badge variant={difficultyMeta.variant} size="sm" className="rounded-ds-full">
                      {difficultyMeta.label}
                    </Badge>
                  )}
                </div>

                <p className="text-caption text-muted-foreground">
                  Complete once per ISO week (Mon → Sun).
                </p>
              </div>
            </Card>

            {/* Main card */}
            {test ? (
              <div
                role="link"
                tabIndex={0}
                aria-label="Open weekly challenge"
                onClick={handlePrimary}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePrimary();
                  }
                }}
                className="focus:outline-none"
              >
                <Card
                  className={cn(
                    'rounded-ds-2xl border border-border/60 bg-card/80 p-6 transition',
                    'hover:-translate-y-[1px] hover:border-primary/30 hover:shadow-soft',
                    'focus-visible:ring-2 focus-visible:ring-primary/40'
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={attempted ? 'success' : 'neutral'}
                          size="sm"
                          className="rounded-ds-full"
                        >
                          {attempted ? 'Attempted' : 'New'}
                        </Badge>

                        <Badge
                          variant={difficultyMeta.variant}
                          size="sm"
                          className="rounded-ds-full"
                        >
                          {difficultyMeta.label}
                        </Badge>

                        <Badge variant="neutral" size="sm" className="rounded-ds-full">
                          {test.examType}
                        </Badge>
                      </div>

                      <h2 className="font-slab text-h2 text-foreground">{test.title}</h2>
                      {test.description && (
                        <p className="text-small text-muted-foreground max-w-[80ch]">
                          {test.description}
                        </p>
                      )}
                    </div>

                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-ds-2xl bg-primary/10 text-primary">
                      <Icon name="BookOpen" className="h-6 w-6" />
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-ds-xl border border-border/60 bg-background/40 p-4">
                      <div className="text-caption text-muted-foreground">Passages</div>
                      <div className="mt-1 flex items-center gap-2 text-small font-semibold text-foreground">
                        <Icon name="Layers" className="h-4 w-4 text-primary" />
                        {test.totalPassages || 3}
                      </div>
                    </div>

                    <div className="rounded-ds-xl border border-border/60 bg-background/40 p-4">
                      <div className="text-caption text-muted-foreground">Questions</div>
                      <div className="mt-1 flex items-center gap-2 text-small font-semibold text-foreground">
                        <Icon name="ListChecks" className="h-4 w-4 text-primary" />
                        {test.totalQuestions || 40}
                      </div>
                    </div>

                    <div className="rounded-ds-xl border border-border/60 bg-background/40 p-4">
                      <div className="text-caption text-muted-foreground">Time</div>
                      <div className="mt-1 flex items-center gap-2 text-small font-semibold text-foreground">
                        <Icon name="Clock" className="h-4 w-4 text-primary" />
                        {safeMinutes(test.durationSeconds)} min
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {test.tags?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {test.tags.slice(0, 8).map((t) => (
                        <Badge key={t} variant="outline" size="sm" className="rounded-ds-full">
                          #{t}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div
                    className="mt-6 flex flex-wrap gap-2"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    {!attempted ? (
                      <Button onClick={handlePrimary} size="lg" className="rounded-ds-2xl flex-1">
                        <Icon name="Play" className="mr-2 h-5 w-5" />
                        Start Weekly Mock
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

                  <p className="mt-4 text-caption text-muted-foreground">
                    Tip: finishing is step 1. Review is where band score actually moves.
                  </p>
                </Card>
              </div>
            ) : (
              <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-6">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-ds-xl bg-warning/15 text-warning">
                    <Icon name="TriangleAlert" className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-slab text-h3 text-foreground">No weekly challenge yet</h2>
                    <p className="mt-1 text-small text-muted-foreground">
                      We couldn’t find this week’s challenge. Start any Reading mock from the library.
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

// ------------------------------------------------------------
// SSR
// ------------------------------------------------------------

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  try {
    const supabase = getServerClient<Database>(ctx.req, ctx.res);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        redirect: {
          destination: '/login?next=' + encodeURIComponent(ctx.resolvedUrl),
          permanent: false,
        },
      };
    }

    const now = new Date();
    const { week, year } = getISOWeek(now);

    const { start, end } = getISOWeekWindowLocal(now);
    const weekLabel = `${yyyyMmDd(start)} → ${yyyyMmDd(end)}`;

    // Load weekly challenge row
    const { data: row, error: weeklyError } = await supabase
      .from('reading_weekly_challenges')
      .select(
        `
        id,
        week_number,
        year,
        test_id,
        reading_tests (
          id, slug, title, description, exam_type, difficulty,
          total_questions, total_passages, duration_seconds, tags
        )
      `,
      )
      .eq('week_number', week)
      .eq('year', year)
      .maybeSingle();

    let test: WeeklyTest | null = null;

    if (!weeklyError && row?.reading_tests) {
      const t: any = row.reading_tests;
      test = {
        id: t.id,
        slug: t.slug,
        title: t.title,
        description: t.description ?? null,
        examType: t.exam_type ?? 'Academic',
        difficulty: t.difficulty ?? null,
        totalQuestions: t.total_questions ?? 40,
        totalPassages: t.total_passages ?? 3,
        durationSeconds: t.duration_seconds ?? 3600,
        tags: t.tags ?? [],
      };
    } else {
      // fallback: latest active test (NO select('*'))
      const { data: fallback, error: fallbackError } = await supabase
        .from('reading_tests')
        .select(
          'id,slug,title,description,exam_type,difficulty,total_questions,total_passages,duration_seconds,tags'
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!fallbackError && fallback) {
        test = {
          id: fallback.id,
          slug: fallback.slug,
          title: fallback.title,
          description: fallback.description ?? null,
          examType: fallback.exam_type ?? 'Academic',
          difficulty: fallback.difficulty ?? null,
          totalQuestions: fallback.total_questions ?? 40,
          totalPassages: fallback.total_passages ?? 3,
          durationSeconds: fallback.duration_seconds ?? 3600,
          tags: fallback.tags ?? [],
        };
      }
    }

    // Fetch latest attempt id for this week window (NOT whole year)
    let latestAttemptId: string | null = null;
    let hasAttempted = false;

    if (test) {
      const { data: latestRows, error: latestErr } = await supabase
        .from('reading_attempts')
        .select('id, created_at')
        .eq('user_id', user.id)
        .eq('test_id', test.id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false })
        .limit(1);

      if (!latestErr && latestRows && latestRows.length > 0) {
        latestAttemptId = latestRows[0].id as any;
        hasAttempted = true;
      }
    }

    return {
      props: {
        test,
        hasAttempted,
        latestAttemptId,
        weekNumber: week,
        year,
        weekLabel,
      },
    };
  } catch (e: any) {
    const now = new Date();
    const { week, year } = getISOWeek(now);
    const { start, end } = getISOWeekWindowLocal(now);

    return {
      props: {
        test: null,
        hasAttempted: false,
        latestAttemptId: null,
        weekNumber: week,
        year,
        weekLabel: `${yyyyMmDd(start)} → ${yyyyMmDd(end)}`,
        error: e?.message ?? 'Failed to load weekly challenge.',
      },
    };
  }
};

export default WeeklyChallengePage;
