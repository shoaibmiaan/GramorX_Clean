// pages/mock/writing/index.tsx
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

type IconName = React.ComponentProps<typeof Icon>['name'];
type Db = Database['public'];

// ------------------------------------------------------------------------------------
// Types
// ------------------------------------------------------------------------------------

type WritingMockListItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  taskType: string | null;
};

type TestAttemptInfo = {
  attemptsCount: number;
  latestCreatedAt: string | null;
  latestBand: number | null;
};

type WritingStats = {
  totalAttempts: number;
  totalTestsAttempted: number;
  lastAttemptAt: string | null;
  averageBand: number | null;
};

type RecentAttempt = {
  id: string;
  testTitle: string;
  bandLabel: string | null;
  dateLabel: string;
};

type PageProps = {
  tests: WritingMockListItem[];
  stats: WritingStats;
  attemptMap: Record<string, TestAttemptInfo>;
  recentAttempts: RecentAttempt[];
  error?: string;
};

// Internal Supabase row shapes we care about
type WritingTestRow = Db['Tables']['writing_tests']['Row'];
type AttemptWritingRow = Db['Tables']['attempts_writing']['Row'];

// ------------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------------

function formatRelativeDate(iso: string | null): string {
  if (!iso) return '—';
  const created = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays} days ago`;
  return created.toLocaleDateString();
}

function avgBand(attempts: AttemptWritingRow[]): number | null {
  const vals = attempts
    .map((a) => a.band_overall)
    .filter((v): v is number => typeof v === 'number');
  if (!vals.length) return null;
  const sum = vals.reduce((acc, v) => acc + v, 0);
  return sum / vals.length;
}

function computeStats(attempts: AttemptWritingRow[]): WritingStats {
  if (attempts.length === 0) {
    return {
      totalAttempts: 0,
      totalTestsAttempted: 0,
      lastAttemptAt: null,
      averageBand: null,
    };
  }

  const totalAttempts = attempts.length;
  const testsSet = new Set<string>();
  let lastAttemptAt: string | null = null;

  attempts.forEach((a) => {
    if (a.test_id) testsSet.add(a.test_id);
    if (!lastAttemptAt || new Date(a.created_at) > new Date(lastAttemptAt)) {
      lastAttemptAt = a.created_at;
    }
  });

  const totalTestsAttempted = testsSet.size;
  const averageBand = avgBand(attempts);

  return {
    totalAttempts,
    totalTestsAttempted,
    lastAttemptAt,
    averageBand,
  };
}

function computeAttemptMap(
  tests: WritingTestRow[],
  attempts: AttemptWritingRow[],
): Record<string, TestAttemptInfo> {
  const map: Record<string, TestAttemptInfo> = {};

  tests.forEach((t) => {
    map[t.id] = {
      attemptsCount: 0,
      latestCreatedAt: null,
      latestBand: null,
    };
  });

  attempts.forEach((a) => {
    if (!a.test_id || !map[a.test_id]) return;

    const current = map[a.test_id];
    current.attemptsCount += 1;

    if (
      !current.latestCreatedAt ||
      new Date(a.created_at) > new Date(current.latestCreatedAt)
    ) {
      current.latestCreatedAt = a.created_at;
      current.latestBand =
        typeof a.band_overall === 'number' ? a.band_overall : current.latestBand;
    }
  });

  return map;
}

// ------------------------------------------------------------------------------------
// Page
// ------------------------------------------------------------------------------------

const WritingMockIndexPage: NextPage<PageProps> = ({
  tests,
  stats,
  attemptMap,
  recentAttempts,
  error,
}) => {
  if (error) {
    return (
      <>
        <Head>
          <title>Error · Writing Mocks · GramorX</title>
        </Head>
        <Container className="py-12 max-w-3xl">
          <Card className="p-6 space-y-3 rounded-ds-2xl border border-border/60 bg-card/70">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Icon name="AlertTriangle" />
            </div>
            <h1 className="text-xl font-semibold">Unable to load Writing mocks</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild variant="primary" className="rounded-ds-xl">
                <Link href="/mock">Back to Mock hub</Link>
              </Button>
              <Button asChild variant="secondary" className="rounded-ds-xl">
                <Link href="/mock/writing">Retry</Link>
              </Button>
            </div>
          </Card>
        </Container>
      </>
    );
  }

  const avgBandLabel =
    stats.averageBand != null ? `Band ${stats.averageBand.toFixed(1)}` : 'No data yet';

  const lastAttemptLabel = formatRelativeDate(stats.lastAttemptAt);

  return (
    <>
      <Head>
        <title>IELTS Writing Mock Command Center · GramorX</title>
        <meta
          name="description"
          content="IELTS Writing mocks with Task 1 + Task 2, AI band scores, and deep feedback analytics."
        />
      </Head>

      <main className="bg-lightBg dark:bg-dark/90">
        {/* TOP HERO */}
        <section className="border-b border-border/50 bg-card/70 backdrop-blur py-8">
          <Container>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-ds-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Icon name="PenTool" size={14} />
                  <span>Writing Mock Command Center</span>
                </div>

                <h1 className="font-slab text-h2 leading-tight">
                  Writing mocks with real band scores and AI coaching.
                </h1>

                <p className="text-sm text-muted-foreground max-w-xl">
                  Attempt full Academic writing mock tests (Task 1 + Task 2),
                  see your estimated band, and get targeted feedback on coherence,
                  grammar, task response, and vocabulary.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Badge tone="success" size="sm">
                    <Icon name="Sparkles" size={14} className="mr-1" />
                    AI essay feedback ready
                  </Badge>
                  <Badge tone="neutral" size="sm">
                    <Icon name="ShieldCheck" size={14} className="mr-1" />
                    Exam-room timing
                  </Badge>
                </div>
              </div>

              {/* Snapshot panel */}
              <Card className="w-full max-w-xs p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Writing mock summary
                  </p>
                  <Icon name="TrendingUp" size={16} className="text-success" />
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-semibold">{avgBandLabel}</span>
                  <span className="text-xs text-muted-foreground">
                    {stats.totalAttempts > 0 ? 'avg from your mocks' : 'no mocks yet'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-muted-foreground">Total attempts</p>
                    <p className="font-medium">{stats.totalAttempts}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-muted-foreground">Tests attempted</p>
                    <p className="font-medium">{stats.totalTestsAttempted}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-muted-foreground">Last attempt</p>
                    <p className="font-medium">{lastAttemptLabel}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-muted-foreground">Target</p>
                    <p className="font-medium">Band 7.0+</p>
                  </div>
                </div>
              </Card>
            </div>
          </Container>
        </section>

        {/* MAIN BODY */}
        <section className="py-10">
          <Container className="grid gap-8 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)]">
            {/* LEFT: test list + hero CTA */}
            <div className="space-y-8">
              {/* Call-to-action stripe */}
              <Card className="p-5 md:p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1 max-w-md">
                  <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon name="LayoutDashboard" size={16} />
                    <span>Full Academic writing mock</span>
                  </div>
                  <h2 className="text-lg font-semibold">
                    Attempt Task 1 + Task 2 in one sitting.
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    60 minutes, strict timer, no pauses. Ideal for simulating your exam-day
                    writing performance.
                  </p>
                </div>

                <div className="space-y-2 w-full max-w-xs">
                  {/* TODO: wire href to /mock/writing/[slug] or /mock/writing/run */}
                  <Button size="sm" className="w-full">
                    <Icon name="PlayCircle" size={16} className="mr-1" />
                    Start a writing mock
                  </Button>
                  <Button size="sm" variant="ghost" className="w-full">
                    <Icon name="Sparkles" size={16} className="mr-1" />
                    Open AI Writing Lab
                  </Button>
                </div>
              </Card>

              {/* Test catalogue */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold">Available writing mock tests</h2>
                  <p className="text-xs text-muted-foreground">
                    {tests.length} test{tests.length === 1 ? '' : 's'} available
                  </p>
                </div>

                {tests.length === 0 ? (
                  <Card className="p-5 text-xs text-muted-foreground">
                    No writing mock tests are available yet. Once tests are added for your
                    account, they will appear here automatically.
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {tests.map((test) => {
                      const info = attemptMap[test.id];
                      const attemptsLabel =
                        info && info.attemptsCount > 0
                          ? `${info.attemptsCount} attempt${
                              info.attemptsCount === 1 ? '' : 's'
                            }`
                          : 'No attempts yet';

                      const lastAttemptLabel = info?.latestCreatedAt
                        ? formatRelativeDate(info.latestCreatedAt)
                        : null;

                      const lastBandLabel =
                        info?.latestBand != null
                          ? `Last band: ${info.latestBand.toFixed(1)}`
                          : null;

                      const difficultyLabel =
                        test.difficulty && test.difficulty.length > 0
                          ? test.difficulty.charAt(0).toUpperCase() +
                            test.difficulty.slice(1)
                          : null;

                      return (
                        <Card
                          key={test.id}
                          className="flex flex-col gap-3 rounded-ds-2xl p-4 md:p-5"
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-sm font-semibold">
                                  {test.title}
                                </h3>
                                {difficultyLabel && (
                                  <Badge tone="neutral" size="xs">
                                    {difficultyLabel}
                                  </Badge>
                                )}
                                {test.taskType && (
                                  <Badge tone="info" size="xs">
                                    {test.taskType === 'both'
                                      ? 'Task 1 + Task 2'
                                      : test.taskType === 'task1'
                                      ? 'Task 1 only'
                                      : test.taskType === 'task2'
                                      ? 'Task 2 only'
                                      : test.taskType}
                                  </Badge>
                                )}
                              </div>
                              {test.description && (
                                <p className="text-xs text-muted-foreground max-w-xl">
                                  {test.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-2 flex flex-col items-start gap-1 text-[11px] text-muted-foreground md:items-end">
                              <div className="flex flex-wrap gap-2">
                                <span>{attemptsLabel}</span>
                                {lastAttemptLabel && (
                                  <>
                                    <span>•</span>
                                    <span>Last: {lastAttemptLabel}</span>
                                  </>
                                )}
                              </div>
                              {lastBandLabel && (
                                <span className="font-medium text-foreground">
                                  {lastBandLabel}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <Link
                              href={`/mock/writing/${encodeURIComponent(test.slug)}`}
                              passHref
                              legacyBehavior
                            >
                              <Button as="a" size="sm">
                                <Icon name="PlayCircle" size={16} className="mr-1" />
                                Start this mock
                              </Button>
                            </Link>

                            <Button size="sm" variant="ghost">
                              <Icon name="ClipboardList" size={16} className="mr-1" />
                              View my attempts
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: AI insights / recent attempts */}
            <div className="space-y-6">
              {/* AI insight panel */}
              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon name="Sparkles" size={16} />
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold">AI Writing Coach</p>
                      <p className="text-[11px] text-muted-foreground">
                        Quick summary from your latest mocks
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground">
                  {stats.totalAttempts === 0 ? (
                    <>
                      <p>
                        You haven&apos;t attempted any writing mocks yet. Start with one of
                        the tests on the left to unlock AI-driven writing feedback.
                      </p>
                      <p>
                        After your first attempt, we&apos;ll highlight your biggest gaps in
                        task response, coherence, grammar range, and vocabulary.
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        Based on your recent mocks, your writing band is trending around{' '}
                        <span className="font-medium">
                          {stats.averageBand != null
                            ? `Band ${stats.averageBand.toFixed(1)}`
                            : 'Band ?'}
                        </span>
                        .
                      </p>
                      <p>
                        Focus on: developing ideas clearly, using paragraphing, and avoiding
                        repeated grammar mistakes. Aim for at least{' '}
                        <span className="font-medium">2 mocks / week</span> to see clear
                        gains.
                      </p>
                    </>
                  )}
                </div>

                <Button size="sm" variant="outline" className="w-full">
                  <Icon name="Wand2" size={16} className="mr-1" />
                  Open detailed AI report
                </Button>
              </Card>

              {/* Recent attempts */}
              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">Recent writing attempts</h2>
                  <Button size="xs" variant="ghost">
                    <Icon name="History" size={14} className="mr-1" />
                    View all
                  </Button>
                </div>

                {recentAttempts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No writing attempts yet. Once you attempt a mock, it will appear here
                    with your latest band and date.
                  </p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {recentAttempts.map((attempt) => (
                      <div
                        key={attempt.id}
                        className="flex items-center justify-between gap-2 rounded-ds-lg border border-border/60 px-3 py-2"
                      >
                        <div className="space-y-0.5">
                          <p className="font-medium">{attempt.testTitle}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {attempt.dateLabel}
                          </p>
                        </div>
                        <div className="text-right space-y-0.5">
                          <p className="text-[11px] text-muted-foreground">
                            {attempt.bandLabel ?? 'Band —'}
                          </p>
                          <Button size="xs" variant="ghost">
                            <Icon name="Eye" size={12} className="mr-1" />
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </Container>
        </section>
      </main>
    </>
  );
};

// ------------------------------------------------------------------------------------
// SSR
// ------------------------------------------------------------------------------------

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  try {
    const supabase = getServerClient(ctx.req, ctx.res);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        redirect: {
          destination: `/auth/login?redirectTo=${encodeURIComponent(
            ctx.resolvedUrl || '/mock/writing',
          )}`,
          permanent: false,
        },
      };
    }

    const [testsRes, attemptsRes] = await Promise.all([
      supabase
        .from<WritingTestRow>('writing_tests')
        .select('id, slug, title, description, difficulty, task_type')
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
      supabase
        .from<AttemptWritingRow>('attempts_writing')
        .select('id, test_id, created_at, band_overall')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    const { data: testsRaw, error: testsError } = testsRes;
    if (testsError) throw testsError;

    const { data: attemptsRaw, error: attemptsError } = attemptsRes;
    if (attemptsError) throw attemptsError;

    const tests: WritingMockListItem[] = (testsRaw ?? []).map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      description: t.description ?? null,
      difficulty: (t as any).difficulty ?? null, // if not in schema, will just be null
      taskType: (t as any).task_type ?? null,
    }));

    const attempts: AttemptWritingRow[] = attemptsRaw ?? [];

    const stats = computeStats(attempts);
    const attemptMap = computeAttemptMap(
      (testsRaw ?? []) as WritingTestRow[],
      attempts,
    );

    // Build recent attempts list with test titles
    const testById = new Map<string, WritingTestRow>();
    (testsRaw ?? []).forEach((t) => testById.set(t.id, t as WritingTestRow));

    const recentAttempts: RecentAttempt[] = attempts.slice(0, 5).map((a) => {
      const test = a.test_id ? testById.get(a.test_id) : null;
      const bandLabel =
        typeof a.band_overall === 'number'
          ? `Band ${a.band_overall.toFixed(1)}`
          : null;

      return {
        id: a.id,
        testTitle: test?.title ?? 'Writing mock',
        bandLabel,
        dateLabel: formatRelativeDate(a.created_at),
      };
    });

    return {
      props: {
        tests,
        stats,
        attemptMap,
        recentAttempts,
      },
    };
  } catch (err: unknown) {
    console.error('Failed to load Writing mocks', err);
    const message =
      err instanceof Error ? err.message : 'Failed to load Writing mocks.';

    return {
      props: {
        tests: [],
        stats: {
          totalAttempts: 0,
          totalTestsAttempted: 0,
          lastAttemptAt: null,
          averageBand: null,
        },
        attemptMap: {},
        recentAttempts: [],
        error: message,
      },
    };
  }
};

export default WritingMockIndexPage;
