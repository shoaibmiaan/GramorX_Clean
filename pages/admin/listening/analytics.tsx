// pages/admin/listening/analytics.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

type Mode = 'practice' | 'mock';

type AttemptRow = {
  id: string;
  mode: Mode;
  status: string;
  bandScore: number | null;
  rawScore: number | null;
  totalQuestions: number | null;
  createdAt: string;
  testTitle: string;
  testSlug: string;
};

type SummaryStats = {
  totalAttempts: number;
  practiceAttempts: number;
  mockAttempts: number;
  submittedAttempts: number;
  avgBandOverall: number | null;
  avgBandPractice: number | null;
  avgBandMock: number | null;
  attemptsLast7Days: number;
  mockAttemptsLast7Days: number;
};

type TopTestStat = {
  testSlug: string;
  testTitle: string;
  totalAttempts: number;
  mockAttempts: number;
  practiceAttempts: number;
};

type Props = {
  summary: SummaryStats;
  topTests: TopTestStat[];
  recentAttempts: AttemptRow[];
};

const AdminListeningAnalyticsPage: NextPage<Props> = ({
  summary,
  topTests,
  recentAttempts,
}) => {
  const {
    totalAttempts,
    practiceAttempts,
    mockAttempts,
    submittedAttempts,
    avgBandOverall,
    avgBandPractice,
    avgBandMock,
    attemptsLast7Days,
    mockAttemptsLast7Days,
  } = summary;

  return (
    <>
      <Head>
        <title>Admin • Listening Analytics • GramorX</title>
        <meta
          name="description"
          content="Analytics and health dashboard for the IELTS Listening module."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="xs">
                <Link href="/admin/listening">
                  <Icon name="ArrowLeft" size={12} />
                  <span>Back to Listening admin</span>
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  <Icon name="Headphones" size={12} />
                  <span>Listening</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <Icon name="LineChart" size={12} />
                  <span>Analytics</span>
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground sm:text-xs">
              This is a lightweight analytics view. Heavy dashboards can use Supabase views later.
            </p>
          </div>

          {/* Top summary cards */}
          <section className="mb-6 grid gap-3 md:grid-cols-4">
            <Card className="border-border bg-card/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Total attempts
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {totalAttempts}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {practiceAttempts} practice · {mockAttempts} mock
                  </p>
                </div>
                <Icon name="Activity" size={20} className="text-primary" />
              </div>
            </Card>

            <Card className="border-border bg-card/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Submitted attempts
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {submittedAttempts}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {attemptsLast7Days} in last 7 days
                  </p>
                </div>
                <Icon name="Clock" size={20} className="text-primary" />
              </div>
            </Card>

            <Card className="border-border bg-card/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Avg Listening band (all)
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {avgBandOverall != null ? avgBandOverall.toFixed(1) : '—'}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Mock avg:{' '}
                    {avgBandMock != null ? avgBandMock.toFixed(1) : '—'}
                  </p>
                </div>
                <Icon name="TrendingUp" size={20} className="text-primary" />
              </div>
            </Card>

            <Card className="border-border bg-card/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Mock usage (last 7 days)
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {mockAttemptsLast7Days}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Practice avg band:{' '}
                    {avgBandPractice != null
                      ? avgBandPractice.toFixed(1)
                      : '—'}
                  </p>
                </div>
                <Icon name="Shield" size={20} className="text-primary" />
              </div>
            </Card>
          </section>

          {/* Top tests */}
          <section className="mb-6 grid gap-4 md:grid-cols-[1.4fr,1fr]">
            <Card className="border-border bg-card/60 p-0">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  Top Listening tests by attempts
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                  Quick sanity check: which tests are getting actual traffic? If mocks are dead,
                  your students are not rehearsing properly.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs text-muted-foreground sm:text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide">
                      <th className="px-4 py-2 font-medium">Test</th>
                      <th className="px-4 py-2 font-medium">Total attempts</th>
                      <th className="px-4 py-2 font-medium">Practice</th>
                      <th className="px-4 py-2 font-medium">Mock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTests.length === 0 ? (
                      <tr>
                        <td
                          className="px-4 py-3 text-xs text-muted-foreground sm:text-sm"
                          colSpan={4}
                        >
                          No attempts yet. Once students start using Listening, tests will appear
                          here.
                        </td>
                      </tr>
                    ) : (
                      topTests.map((t) => (
                        <tr
                          key={t.testSlug}
                          className="border-b border-border/60 last:border-b-0"
                        >
                          <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                            {t.testTitle}{' '}
                            <span className="text-[11px] text-muted-foreground">
                              ({t.testSlug})
                            </span>
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                            {t.totalAttempts}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                            {t.practiceAttempts}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                            {t.mockAttempts}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Quick interpretation card */}
            <Card className="border-border bg-card/60 p-4">
              <p className="text-sm font-semibold text-foreground sm:text-base">
                How to read this page
              </p>
              <ul className="mt-2 space-y-2 text-xs text-muted-foreground sm:text-sm">
                <li>• Low total attempts = Listening module is basically dead.</li>
                <li>
                  • High practice but low mock = students are scared to test themselves. Coach them
                  to use mocks weekly, not yearly.
                </li>
                <li>
                  • Avg band stuck at the same number for months = your content or feedback loop is
                  not actually improving anyone.
                </li>
              </ul>
              <div className="mt-3">
                <Button asChild size="sm" variant="outline" className="w-full justify-center">
                  <Link href="/listening/analytics">
                    <Icon name="ExternalLink" size={14} />
                    <span>Open student-facing analytics</span>
                  </Link>
                </Button>
              </div>
            </Card>
          </section>

          {/* Recent attempts table */}
          <section>
            <Card className="border-border bg-card/60 p-0">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  Recent Listening attempts (last 90 days)
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
                  Up to 200 latest attempts. For deeper analysis, build Supabase views and connect
                  a BI tool.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs text-muted-foreground sm:text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide">
                      <th className="px-4 py-2 font-medium">When</th>
                      <th className="px-4 py-2 font-medium">Mode</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Test</th>
                      <th className="px-4 py-2 font-medium">Score</th>
                      <th className="px-4 py-2 font-medium">Band</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAttempts.length === 0 ? (
                      <tr>
                        <td
                          className="px-4 py-3 text-xs text-muted-foreground sm:text-sm"
                          colSpan={6}
                        >
                          No attempts recorded in the last 90 days.
                        </td>
                      </tr>
                    ) : (
                      recentAttempts.map((a) => {
                        const created = new Date(a.createdAt);
                        const when = created.toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        const scoreLabel =
                          a.rawScore != null && a.totalQuestions != null
                            ? `${a.rawScore}/${a.totalQuestions}`
                            : '—';

                        return (
                          <tr
                            key={a.id}
                            className="border-b border-border/60 last:border-b-0"
                          >
                            <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                              {when}
                            </td>
                            <td className="px-4 py-2 align-middle">
                              <span
                                className={[
                                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                                  a.mode === 'mock'
                                    ? 'bg-danger/10 text-danger'
                                    : 'bg-success/10 text-success',
                                ].join(' ')}
                              >
                                <Icon
                                  name={a.mode === 'mock' ? 'Shield' : 'FlaskConical'}
                                  size={11}
                                />
                                <span>{a.mode}</span>
                              </span>
                            </td>
                            <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                              {a.status}
                            </td>
                            <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                              {a.testTitle}{' '}
                              <span className="text-[11px] text-muted-foreground">
                                ({a.testSlug})
                              </span>
                            </td>
                            <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                              {scoreLabel}
                            </td>
                            <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                              {a.bandScore != null ? a.bandScore.toFixed(1) : '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
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
        destination: `/login?next=${encodeURIComponent(
          '/admin/listening/analytics',
        )}`,
        permanent: false,
      },
    };
  }

  // Last 90 days attempts (cap at 1000 for safety)
  const { data: rows, error } = await supabase
    .from('attempts_listening')
    .select(
      'id, mode, status, raw_score, band_score, total_questions, created_at, listening_tests(title, slug)',
    )
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error || !rows) {
    return {
      props: {
        summary: {
          totalAttempts: 0,
          practiceAttempts: 0,
          mockAttempts: 0,
          submittedAttempts: 0,
          avgBandOverall: null,
          avgBandPractice: null,
          avgBandMock: null,
          attemptsLast7Days: 0,
          mockAttemptsLast7Days: 0,
        },
        topTests: [],
        recentAttempts: [],
      },
    };
  }

  const attempts: AttemptRow[] = rows.map((row: any) => ({
    id: row.id,
    mode: row.mode,
    status: row.status,
    bandScore: row.band_score,
    rawScore: row.raw_score,
    totalQuestions: row.total_questions,
    createdAt: row.created_at,
    testTitle: row.listening_tests?.title ?? 'Unknown test',
    testSlug: row.listening_tests?.slug ?? 'unknown',
  }));

  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const totalAttempts = attempts.length;
  const practiceAttempts = attempts.filter((a) => a.mode === 'practice').length;
  const mockAttempts = attempts.filter((a) => a.mode === 'mock').length;

  const submitted = attempts.filter((a) => a.status === 'submitted');
  const submittedAttempts = submitted.length;

  const submittedPractice = submitted.filter((a) => a.mode === 'practice');
  const submittedMock = submitted.filter((a) => a.mode === 'mock');

  const avg = (list: AttemptRow[]): number | null => {
    const scored = list.filter(
      (a) => a.bandScore != null && !Number.isNaN(Number(a.bandScore)),
    );
    if (!scored.length) return null;
    const sum = scored.reduce(
      (acc, a) => acc + Number(a.bandScore),
      0,
    );
    return sum / scored.length;
  };

  const avgBandOverall = avg(submitted);
  const avgBandPractice = avg(submittedPractice);
  const avgBandMock = avg(submittedMock);

  const attemptsLast7Days = submitted.filter((a) => {
    const t = new Date(a.createdAt).getTime();
    return now - t <= sevenDaysMs;
  }).length;

  const mockAttemptsLast7Days = submittedMock.filter((a) => {
    const t = new Date(a.createdAt).getTime();
    return now - t <= sevenDaysMs;
  }).length;

  // Top tests by attempts
  const testMap = new Map<string, TopTestStat>();

  for (const a of attempts) {
    const key = a.testSlug || 'unknown';
    if (!testMap.has(key)) {
      testMap.set(key, {
        testSlug: a.testSlug,
        testTitle: a.testTitle,
        totalAttempts: 0,
        mockAttempts: 0,
        practiceAttempts: 0,
      });
    }
    const stat = testMap.get(key)!;
    stat.totalAttempts += 1;
    if (a.mode === 'mock') stat.mockAttempts += 1;
    if (a.mode === 'practice') stat.practiceAttempts += 1;
  }

  const topTests = Array.from(testMap.values())
    .sort((a, b) => b.totalAttempts - a.totalAttempts)
    .slice(0, 10);

  // Limit recent attempts shown in table (e.g., 200)
  const recentAttempts = attempts.slice(0, 200);

  return {
    props: {
      summary: {
        totalAttempts,
        practiceAttempts,
        mockAttempts,
        submittedAttempts,
        avgBandOverall,
        avgBandPractice,
        avgBandMock,
        attemptsLast7Days,
        mockAttemptsLast7Days,
      },
      topTests,
      recentAttempts,
    },
  };
};

export default AdminListeningAnalyticsPage;
