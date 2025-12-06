// pages/mock/index.tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { Icon } from '@/components/design-system/Icon';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/design-system/Tabs';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type MockOverviewStats = {
  totalMocksTaken: number;
  bestBandOverall: number | null;
  avgBandOverall: number | null;
  mocksInProgress: number;
  upcomingScheduled: number;
  attemptsThisWeek: number;
  consistencyPercent: number;
  firstBand: number | null;
  latestBand: number | null;
};

type PageProps = {
  stats?: MockOverviewStats | null;
};

// hard fallback so layout never dies
const EMPTY_STATS: MockOverviewStats = {
  totalMocksTaken: 0,
  bestBandOverall: null,
  avgBandOverall: null,
  mocksInProgress: 0,
  upcomingScheduled: 0,
  attemptsThisWeek: 0,
  consistencyPercent: 0,
  firstBand: null,
  latestBand: null,
};

// -----------------------------------------------------------------------------
// STATIC VIEW DATA (UI wiring only)
// -----------------------------------------------------------------------------

const QUICK_ACTIONS = [
  {
    id: 'full-mock',
    title: 'Start Full IELTS Mock',
    description: 'Complete 4-module simulation with strict timing.',
    href: '/mock/full',
    icon: 'Timer' as const,
    tag: 'Recommended',
    pro: false,
  },
  {
    id: 'adaptive',
    title: 'Adaptive Diagnostic Test',
    description: 'AI-powered test that adapts to your skill level.',
    href: '/mock/adaptive',
    icon: 'Activity' as const,
    tag: 'Recommended',
    pro: true,
  },
  {
    id: 'resume',
    title: 'Resume Latest Attempt',
    description: 'Continue where you left off.',
    href: '/mock/history?view=latest',
    icon: 'PlayCircle' as const,
    tag: null,
    pro: false,
  },
  {
    id: 'review-weak',
    title: 'Review Weak Areas',
    description: 'Focus on modules needing improvement.',
    href: '/mock/weak-areas',
    icon: 'Target' as const,
    tag: null,
    pro: false,
  },
  {
    id: 'compare',
    title: 'Comparative Analysis',
    description: 'Compare your performance with peers.',
    href: '/mock/compare',
    icon: 'Users' as const,
    tag: 'Pro',
    pro: true,
  },
];

const MODULES = [
  {
    id: 'reading',
    title: 'Reading Mock Tests',
    description: 'Academic & General Training with detailed explanations.',
    href: '/mock/reading',
    icon: 'BookOpenCheck' as const,
    status: 'Live',
  },
  {
    id: 'listening',
    title: 'Listening Mock Tests',
    description: 'Real IELTS audio with various accents.',
    href: '/mock/listening',
    icon: 'Headphones' as const,
    status: 'Live',
  },
  {
    id: 'writing',
    title: 'Writing Mock Tests',
    description: 'AI-powered band assessment with detailed feedback.',
    href: '/mock/writing',
    icon: 'PenSquare' as const,
    status: 'Beta',
  },
  {
    id: 'speaking',
    title: 'Speaking Mock Tests',
    description: 'AI conversation partner with pronunciation analysis.',
    href: '/mock/speaking',
    icon: 'Mic' as const,
    status: 'Preview',
  },
];

const HISTORY_PLACEHOLDER = [
  {
    id: 'h1',
    title: 'No mock attempts yet',
    helper: 'Once you take a mock test, a timeline of attempts will show here.',
  },
];

// -----------------------------------------------------------------------------
// PAGE
// -----------------------------------------------------------------------------

const MockDashboardPage: NextPage<PageProps> = ({ stats }) => {
  const s = stats ?? EMPTY_STATS;

  const avgBandText =
    typeof s.avgBandOverall === 'number' ? s.avgBandOverall.toFixed(1) : '—';

  const bestBandText =
    typeof s.bestBandOverall === 'number' ? s.bestBandOverall.toFixed(1) : '—';

  const totalMocksText = String(s.totalMocksTaken);

  return (
    <>
      <Head>
        <title>IELTS Mock Test Dashboard · GramorX</title>
      </Head>

      <main className="min-h-screen">
        <Container className="py-6 space-y-6">
          {/* Top strip */}
          <section className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge size="xs" variant="neutral">
                Enterprise Edition
              </Badge>
              <span>Updated just now</span>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Icon name="RefreshCw" size={12} />
                Refresh
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                size="sm"
                variant="primary"
                className="rounded-ds-full"
              >
                <Link href="/mock/full">
                  <Icon name="Timer" className="mr-2" size={14} />
                  Start Full Mock
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="rounded-ds-full"
              >
                <Link href="/mock/analytics">
                  <Icon name="TrendingUp" className="mr-2" size={14} />
                  View Analytics
                </Link>
              </Button>
            </div>
          </section>

          {/* Hero + summary stats */}
          <section className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)] lg:items-center">
              <div className="space-y-3">
                <h1 className="font-slab text-3xl leading-tight sm:text-4xl">
                  IELTS Mock Test Dashboard
                </h1>
                <p className="max-w-xl text-sm text-muted-foreground">
                  Professional-grade exam simulation with AI-powered analytics, predictive
                  scoring, and adaptive learning recommendations.
                </p>
              </div>

              <Card className="rounded-ds-2xl border border-border/60 bg-card/90 p-3.5 shadow-sm">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <SummaryStat
                    label="Total mocks taken"
                    value={totalMocksText}
                    helper="This month"
                  />
                  <SummaryStat
                    label="Best overall band"
                    value={bestBandText}
                    helper={bestBandText === '—' ? 'No data yet' : 'Across all mocks'}
                  />
                  <SummaryStat
                    label="Mocks in progress"
                    value={String(s.mocksInProgress)}
                    helper="Active"
                  />
                  <SummaryStat
                    label="Upcoming scheduled"
                    value={String(s.upcomingScheduled)}
                    helper="Next 7 days"
                  />
                </div>
              </Card>
            </div>
          </section>

          {/* Tabs + main content */}
          <section className="space-y-4">
            <Tabs defaultValue="overview">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                  <TabsTrigger value="compare">Compare</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              </div>

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="space-y-6 pt-4">
                {/* stats row */}
                <div className="grid gap-3 md:grid-cols-4">
                  <Card className="rounded-ds-2xl border border-border/60 bg-card/90 p-3.5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">
                          Total Mocks Taken
                        </p>
                        <p className="text-lg font-semibold leading-none">
                          {totalMocksText}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {s.attemptsThisWeek} this week
                        </p>
                      </div>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon name="BarChart2" size={14} />
                      </span>
                    </div>
                  </Card>

                  <Card className="rounded-ds-2xl border border-border/60 bg-card/90 p-3.5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">
                          Average Band Score
                        </p>
                        <p className="text-lg font-semibold leading-none">
                          {avgBandText}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Based on completed mocks
                        </p>
                      </div>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon name="TrendingUp" size={14} />
                      </span>
                    </div>
                  </Card>

                  <Card className="rounded-ds-2xl border border-border/60 bg-card/90 p-3.5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">
                          Study Consistency
                        </p>
                        <p className="text-lg font-semibold leading-none">
                          {s.consistencyPercent}%
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Target: 4 mocks / week
                        </p>
                      </div>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon name="CalendarCheck2" size={14} />
                      </span>
                    </div>
                  </Card>

                  <Card className="rounded-ds-2xl border border-border/60 bg-card/90 p-3.5 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-[11px] text-muted-foreground">
                          Time Invested
                        </p>
                        <p className="text-lg font-semibold leading-none">0h</p>
                        <p className="text-[11px] text-muted-foreground">
                          Detailed tracking coming soon
                        </p>
                      </div>
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon name="Clock3" size={14} />
                      </span>
                    </div>
                  </Card>
                </div>

                {/* Active attempts + quick actions */}
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)]">
                  <Card className="rounded-ds-2xl border border-border/60 bg-card/90 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-slab text-base">Active Attempts</h2>
                      <Button asChild variant="ghost" size="xs">
                        <Link href="/mock/history">View all</Link>
                      </Button>
                    </div>
                    <div className="mt-4 flex h-24 flex-col items-center justify-center rounded-ds-xl border border-dashed border-border/60 bg-muted/40 text-xs text-muted-foreground">
                      <Icon name="PlayCircle" className="mb-1" size={18} />
                      <p>No active attempts. Start a mock to begin!</p>
                    </div>
                  </Card>

                  <Card className="rounded-ds-2xl border border-border/60 bg-card/90 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-slab text-base">Quick Actions</h2>
                      <span className="text-[11px] text-muted-foreground">
                        {QUICK_ACTIONS.length} actions available
                      </span>
                    </div>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {QUICK_ACTIONS.map((action) => (
                        <Card
                          key={action.id}
                          className="flex h-full flex-col justify-between rounded-ds-xl border border-border/60 bg-muted/30 p-3"
                        >
                          <div className="flex items-start gap-3">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Icon name={action.icon} size={16} />
                            </span>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-semibold">{action.title}</p>
                                {action.pro && (
                                  <Badge size="xs" variant="info">
                                    PRO
                                  </Badge>
                                )}
                                {action.tag && !action.pro && (
                                  <Badge size="xs" variant="success">
                                    {action.tag}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                {action.description}
                              </p>
                            </div>
                          </div>
                          <Button
                            asChild
                            size="xs"
                            variant="ghost"
                            className="mt-2 justify-start px-0 text-[11px]"
                          >
                            <Link href={action.href}>
                              Start now
                              <Icon name="ArrowRight" className="ml-1" size={12} />
                            </Link>
                          </Button>
                        </Card>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Module performance */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-slab text-base">Module Performance</h2>
                    <span className="text-[11px] text-muted-foreground">
                      Detailed analysis
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    {MODULES.map((mod) => (
                      <Card
                        key={mod.id}
                        className="flex h-full flex-col justify-between rounded-ds-2xl border border-border/60 bg-card/90 p-3.5 shadow-sm"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Icon name={mod.icon} size={16} />
                            </span>
                            <Badge size="xs" variant="neutral">
                              {mod.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm font-semibold leading-snug">
                              {mod.title}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {mod.description}
                            </p>
                          </div>
                        </div>

                        <Button
                          asChild
                          size="xs"
                          variant="secondary"
                          className="mt-3 w-full rounded-ds-xl text-[11px]"
                        >
                          <Link href={mod.href}>
                            Open module
                            <Icon name="ArrowRight" className="ml-1" size={12} />
                          </Link>
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* ANALYTICS TAB */}
              <TabsContent value="analytics" className="space-y-6 pt-4">
                <Card className="rounded-ds-2xl border border-border/60 bg-card/95 p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="font-slab text-base">Analytics</h2>
                      <p className="text-[11px] text-muted-foreground">
                        Complete at least one mock test to unlock detailed analytics and
                        trends.
                      </p>
                    </div>
                    <Button asChild size="sm" variant="primary" className="rounded-ds-full">
                      <Link href="/mock/full">Start your first mock</Link>
                    </Button>
                  </div>
                </Card>

                {/* Predictive band analysis – ONLY here */}
                <PredictiveBandCard stats={s} />
              </TabsContent>

              {/* RECOMMENDATIONS TAB */}
              <TabsContent value="recommendations" className="space-y-6 pt-4">
                <Card className="rounded-ds-2xl border border-border/60 bg-card/95 p-5 text-sm">
                  <div className="space-y-2">
                    <h2 className="font-slab text-base">Personalized Recommendations</h2>
                    <p className="text-[11px] text-muted-foreground">
                      You&apos;ve completed all recommendations. New ones will be generated
                      after your next mock test.
                    </p>
                  </div>
                  <div className="mt-4 rounded-ds-xl border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground">
                    <Icon name="CheckCircle2" className="mx-auto mb-2" size={18} />
                    All caught up! Take a mock test to get fresh recommendations.
                  </div>
                </Card>
              </TabsContent>

              {/* HISTORY TAB */}
              <TabsContent value="history" className="space-y-6 pt-4">
                <Card className="rounded-ds-2xl border border-border/60 bg-card/95 p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-slab text-base">History</h2>
                      <Button asChild size="xs" variant="ghost">
                        <Link href="/mock/history/export">
                          <Icon name="Download" size={12} className="mr-1" />
                          Export CSV
                        </Link>
                      </Button>
                    </div>

                    {HISTORY_PLACEHOLDER.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-ds-xl border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground"
                      >
                        <Icon name="History" className="mx-auto mb-2" size={18} />
                        <p className="font-medium">{item.title}</p>
                        <p className="mt-1">{item.helper}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* COMPARE TAB */}
              <TabsContent value="compare" className="space-y-6 pt-4">
                <Card className="rounded-ds-2xl border border-border/60 bg-card/95 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="font-slab text-base">Compare Performance</h2>
                      <p className="text-[11px] text-muted-foreground">
                        Peer comparison unlocks once there is enough anonymised data.
                      </p>
                    </div>
                    <Badge size="xs" variant="info">
                      Coming soon
                    </Badge>
                  </div>
                  <div className="mt-4 rounded-ds-xl border border-dashed border-border/60 bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground">
                    <Icon name="Users" className="mx-auto mb-2" size={18} />
                    Comparative insights will be available after a few batches of users run
                    full mocks.
                  </div>
                </Card>
              </TabsContent>

              {/* SETTINGS TAB */}
              <TabsContent value="settings" className="space-y-6 pt-4">
                <Card className="rounded-ds-2xl border border-border/60 bg-card/95 p-4 text-sm">
                  <div className="space-y-2">
                    <h2 className="font-slab text-base">Mock Room Settings</h2>
                    <p className="text-[11px] text-muted-foreground">
                      Configure how strict you want the mock environment to be. These
                      settings will apply to future mocks.
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <SettingsItem
                      title="Strict timing"
                      description="Disable pause / rewind and enforce section time limits."
                      badge="Recommended"
                    />
                    <SettingsItem
                      title="Distraction-free mode"
                      description="Hide navigation elements while the mock is running."
                    />
                    <SettingsItem
                      title="Auto-submit on timeout"
                      description="When time ends, answers are auto-submitted."
                    />
                    <SettingsItem
                      title="Allow analytics data"
                      description="Use your anonymised data to improve predictive accuracy."
                    />
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </section>
        </Container>
      </main>
    </>
  );
};

// -----------------------------------------------------------------------------
// Small pieces
// -----------------------------------------------------------------------------

const SummaryStat = ({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) => (
  <div className="space-y-1">
    <p className="text-[11px] text-muted-foreground">{label}</p>
    <p className="text-base font-semibold leading-none">{value}</p>
    <p className="text-[11px] text-muted-foreground">{helper}</p>
  </div>
);

const PredictiveBandCard: React.FC<{ stats: MockOverviewStats }> = ({ stats }) => {
  const trajectoryText =
    typeof stats.firstBand === 'number' &&
    typeof stats.latestBand === 'number' &&
    stats.totalMocksTaken > 1
      ? stats.latestBand === stats.firstBand
        ? `Stable at band ${stats.latestBand.toFixed(1)} so far.`
        : `From band ${stats.firstBand.toFixed(
            1
          )} to ${stats.latestBand.toFixed(1)} over ${stats.totalMocksTaken} mocks.`
      : 'Once you have at least 2 completed mocks, we will show how your band is moving.';

  return (
    <Card className="grid gap-4 rounded-ds-2xl border border-border/60 bg-card/95 p-5 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)] md:items-center">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-[11px] font-medium text-primary">
          <Icon name="Sparkles" size={13} />
          <span>AI-Powered Insights</span>
        </div>
        <h2 className="font-slab text-base sm:text-lg">Predictive Band Score Analysis</h2>
        <p className="text-xs text-muted-foreground">
          Our AI analyzes your mock performance patterns to predict your actual IELTS band
          score with high confidence. Once you finish a few full mocks, this card will show a
          projected band and what&apos;s blocking the next level.
        </p>
        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
          <li>• Weakness identification &amp; improvement roadmap</li>
          <li>• Time management optimisation suggestions</li>
          <li>• Personalised study plan generation</li>
        </ul>
        <p className="mt-2 text-xs font-medium text-foreground">{trajectoryText}</p>
      </div>

      <div className="flex h-full flex-col items-center justify-center rounded-ds-2xl bg-muted/40 px-4 py-6 text-center">
        <Icon name="AlertTriangle" className="mb-2 text-warning" size={22} />
        <p className="text-sm font-medium">Prediction data unavailable</p>
        <p className="mt-1 max-w-xs text-[11px] text-muted-foreground">
          Complete at least one full mock while signed in to view AI-powered band
          predictions.
        </p>
        <Button
          asChild
          size="xs"
          variant="secondary"
          className="mt-3 rounded-ds-full text-[11px]"
        >
          <Link href="/mock/full">Take first full mock</Link>
        </Button>
      </div>
    </Card>
  );
};

const SettingsItem = ({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge?: string | null;
}) => (
  <Card className="flex h-full flex-col justify-between rounded-ds-xl border border-border/60 bg-muted/30 p-3.5">
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold">{title}</p>
        {badge && (
          <Badge size="xs" variant="accent">
            {badge}
          </Badge>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">{description}</p>
    </div>
    <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
      <span>Default: On</span>
      <span className="inline-flex items-center gap-1">
        Manage in exam settings
        <Icon name="ArrowRight" size={12} />
      </span>
    </div>
  </Card>
);

// -----------------------------------------------------------------------------
// SSR – wire to Supabase listening_attempts
// -----------------------------------------------------------------------------

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  try {
    const supabase = getServerClient<Database>(ctx.req, ctx.res);

    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes?.user) {
      return {
        redirect: {
          destination: '/login?next=/mock',
          permanent: false,
        },
      };
    }

    const user = userRes.user;

    const { data: attemptsData, error } = await supabase
      .from('listening_attempts')
      .select('id, band_score, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(500);

    if (error) {
      return {
        props: {
          stats: EMPTY_STATS,
        },
      };
    }

    const attempts = attemptsData ?? [];

    const bands = attempts
      .map((a) =>
        a.band_score !== null && a.band_score !== undefined
          ? Number(a.band_score)
          : null
      )
      .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));

    const totalMocksTaken = attempts.length;

    let bestBandOverall: number | null = null;
    let avgBandOverall: number | null = null;
    let firstBand: number | null = null;
    let latestBand: number | null = null;

    if (bands.length > 0) {
      bestBandOverall = Math.max(...bands);
      const sum = bands.reduce((acc, v) => acc + v, 0);
      avgBandOverall = Math.round(((sum / bands.length) + Number.EPSILON) * 10) / 10;
      firstBand = bands[0];
      latestBand = bands[bands.length - 1];
    }

    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const attemptsThisWeek = attempts.filter((a) => {
      const ts = new Date(a.created_at as string).getTime();
      return Number.isFinite(ts) && ts >= weekAgo;
    }).length;

    const consistencyPercent = Math.min(100, attemptsThisWeek * 25);

    const mocksInProgress = attempts.filter(
      (a) => a.status === 'in_progress' || a.status === 'started'
    ).length;

    const stats: MockOverviewStats = {
      totalMocksTaken,
      bestBandOverall,
      avgBandOverall,
      mocksInProgress,
      upcomingScheduled: 0,
      attemptsThisWeek,
      consistencyPercent,
      firstBand,
      latestBand,
    };

    return {
      props: {
        stats,
      },
    };
  } catch {
    return {
      props: {
        stats: EMPTY_STATS,
      },
    };
  }
};

export default MockDashboardPage;
