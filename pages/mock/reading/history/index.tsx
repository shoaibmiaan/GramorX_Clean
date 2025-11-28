// pages/mock/reading/history/index.tsx
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
import { track } from '@/lib/analytics/track';

type AttemptStatus = 'in_progress' | 'completed' | 'abandoned';

type ReadingAttemptSummary = {
  id: string;
  testSlug: string;
  testTitle: string;
  startedAt: string; // ISO
  submittedAt: string | null; // ISO or null
  mode: 'full' | 'practice';
  status: AttemptStatus;
  bandScore: number | null;
  rawScore: number | null;
  totalQuestions: number;
  correctAnswers: number | null;
  timeTakenSeconds: number | null;
};

type ReadingHistoryStats = {
  totalAttempts: number;
  completedAttempts: number;
  averageBand: number | null;
  lastAttemptAt: string | null;
};

type ReadingHistoryPageProps = {
  candidateId: string | null;
  attempts: ReadingAttemptSummary[];
  stats: ReadingHistoryStats;
};

const MockAttempts: ReadingAttemptSummary[] = [
  {
    id: 'demo-attempt-1',
    testSlug: 'cambridge-ielts-18-test-1',
    testTitle: 'Cambridge IELTS 18 – Test 1',
    startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 55 * 60 * 1000).toISOString(),
    mode: 'full',
    status: 'completed',
    bandScore: 7.5,
    rawScore: 34,
    totalQuestions: 40,
    correctAnswers: 34,
    timeTakenSeconds: 55 * 60,
  },
  {
    id: 'demo-attempt-2',
    testSlug: 'cambridge-ielts-18-test-2',
    testTitle: 'Cambridge IELTS 18 – Test 2',
    startedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // yesterday
    submittedAt: null,
    mode: 'full',
    status: 'in_progress',
    bandScore: null,
    rawScore: null,
    totalQuestions: 40,
    correctAnswers: 12,
    timeTakenSeconds: 22 * 60,
  },
  {
    id: 'demo-attempt-3',
    testSlug: 'ieltsfever-academic-reading-test-1',
    testTitle: 'IELTSFever Academic Reading – Test 1',
    startedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    mode: 'practice',
    status: 'completed',
    bandScore: 6.5,
    rawScore: 29,
    totalQuestions: 40,
    correctAnswers: 29,
    timeTakenSeconds: 60 * 60,
  },
];

const DEFAULT_HISTORY_STATS: ReadingHistoryStats = {
  totalAttempts: 3,
  completedAttempts: 2,
  averageBand: 7.0,
  lastAttemptAt: MockAttempts[1]?.startedAt ?? null,
};

const ReadingHistoryPage: NextPage<ReadingHistoryPageProps> = ({ candidateId, attempts, stats }) => {
  const hasAttempts = attempts.length > 0;

  const handleStartNew = () => {
    track('mock_reading_history_start_new', {});
  };

  const handleViewReview = (attemptId: string) => {
    track('mock_reading_history_view_review', { attemptId });
  };

  const handleResume = (attemptId: string) => {
    track('mock_reading_history_resume_attempt', { attemptId });
  };

  const handleRetake = (testSlug: string) => {
    track('mock_reading_history_retake_test', { testSlug });
  };

  return (
    <>
      <Head>
        <title>IELTS Reading History • GramorX</title>
        <meta
          name="description"
          content="History of your IELTS Reading mock attempts with band scores, accuracy, and time usage."
        />
      </Head>

      <section className="bg-lightBg dark:bg-dark/90 min-h-screen">
        <Container className="py-8 lg:py-10 flex flex-col gap-6">
          {/* Top bar: breadcrumb + candidate */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground">
              <Link
                href="/mock"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Icon name="ArrowLeft" size={14} />
                <span>Back to Mock Hub</span>
              </Link>

              <span className="h-3 w-px bg-border/60" />

              <Link
                href="/mock/reading"
                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <Icon name="BookOpen" size={14} />
                <span>Reading</span>
              </Link>

              <span className="h-3 w-px bg-border/60" />

              <span className="inline-flex items-center gap-1 text-foreground">
                <Icon name="History" size={14} />
                <span>History</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="xs"
                className="hidden sm:inline-flex gap-1"
                onClick={() => track('mock_reading_history_help_open', {})}
                asChild
              >
                <Link href="/help/reading-mocks#history">
                  <Icon name="HelpCircle" size={14} />
                  <span>Help</span>
                </Link>
              </Button>

              <Link
                href={candidateId ? '/account' : '/login'}
                className="inline-flex items-center gap-1 rounded-full border border-border/70 px-3 py-1 text-[11px] lg:text-xs text-muted-foreground bg-background/60 backdrop-blur hover:border-primary/60 hover:text-foreground transition-colors"
              >
                <Icon name="IdCard" size={14} />
                <span>Candidate</span>
                <span className="font-mono font-semibold text-foreground">
                  {candidateId ?? 'Sign in'}
                </span>
              </Link>
            </div>
          </div>

          {/* Header + quick stats */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-[11px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span>Reading history & analytics</span>
              </div>

              <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
                Track your Reading journey.
              </h1>

              <p className="text-sm lg:text-[15px] text-muted-foreground max-w-xl">
                See how your Reading band is evolving over time, which tests you&apos;ve completed, and where to focus
                next.
              </p>
            </div>

            <div className="flex flex-row lg:flex-col gap-2 lg:gap-3 text-xs lg:text-sm">
              <HistoryStatPill
                label="Total attempts"
                value={stats.totalAttempts.toString()}
                icon="Activity"
              />
              <HistoryStatPill
                label="Completed"
                value={stats.completedAttempts.toString()}
                icon="CheckCircle2"
              />
              <HistoryStatPill
                label="Average band"
                value={stats.averageBand != null ? stats.averageBand.toFixed(1) : '—'}
                icon="Star"
              />
            </div>
          </div>

          {/* Top actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              size="sm"
              className="flex-1 sm:flex-none sm:w-auto inline-flex items-center justify-center gap-2"
              onClick={handleStartNew}
              asChild
            >
              <Link href="/mock/reading/run?id=cambridge-ielts-18-test-1">
                <Icon name="Play" size={16} />
                <span>Start new Reading mock</span>
              </Link>
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="flex-1 sm:flex-none sm:w-auto inline-flex items-center justify-center gap-2"
              asChild
            >
              <Link href="/mock/reading">
                <Icon name="LayoutDashboard" size={16} />
                <span>Go to Reading hub</span>
              </Link>
            </Button>
          </div>

          {/* Attempts list */}
          {!hasAttempts ? (
            <Card className="p-6 flex flex-col items-center justify-center gap-3 text-center">
              <Icon name="Inbox" size={28} className="text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">No Reading attempts yet</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Once you complete Reading mocks, they&apos;ll show up here with band scores and detailed analytics.
                </p>
              </div>
              <Button
                size="sm"
                className="mt-1 inline-flex items-center gap-2"
                onClick={handleStartNew}
                asChild
              >
                <Link href="/mock/reading/run?id=cambridge-ielts-18-test-1">
                  <Icon name="Play" size={14} />
                  <span>Start your first Reading mock</span>
                </Link>
              </Button>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden border border-border/80 bg-background/80">
              <div className="border-b border-border/70 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Icon name="ListChecks" size={14} />
                  <span>Recent attempts</span>
                </div>

                {stats.lastAttemptAt && (
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Icon name="Clock" size={12} />
                    <span>Last attempt: {formatDateTime(stats.lastAttemptAt)}</span>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border-t border-border/70">
                  <thead className="bg-muted/60 text-muted-foreground">
                    <tr className="border-b border-border/60">
                      <Th>Test</Th>
                      <Th>Date</Th>
                      <Th>Mode</Th>
                      <Th>Status</Th>
                      <Th>Band</Th>
                      <Th>Accuracy</Th>
                      <Th>Time used</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((attempt) => {
                      const accuracy =
                        attempt.correctAnswers != null && attempt.totalQuestions > 0
                          ? Math.round((attempt.correctAnswers / attempt.totalQuestions) * 100)
                          : null;

                      const isCompleted = attempt.status === 'completed';
                      const isInProgress = attempt.status === 'in_progress';

                      return (
                        <tr
                          key={attempt.id}
                          className="border-b border-border/60 last:border-b-0 hover:bg-muted/40 transition-colors"
                        >
                          <Td>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] font-semibold text-foreground line-clamp-1">
                                {attempt.testTitle}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {attempt.testSlug}
                              </span>
                            </div>
                          </Td>

                          <Td>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-[11px] text-foreground">
                                {formatDate(attempt.startedAt)}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatTime(attempt.startedAt)}
                              </span>
                            </div>
                          </Td>

                          <Td>
                            <Badge tone={attempt.mode === 'full' ? 'neutral' : 'info'} size="xxs">
                              {attempt.mode === 'full' ? 'Full mock' : 'Practice'}
                            </Badge>
                          </Td>

                          <Td>
                            <StatusBadge status={attempt.status} />
                          </Td>

                          <Td>
                            {attempt.bandScore != null ? (
                              <span className="text-[11px] font-semibold text-foreground">
                                {attempt.bandScore.toFixed(1)}
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">—</span>
                            )}
                          </Td>

                          <Td>
                            {accuracy != null ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] font-semibold text-foreground">
                                  {accuracy}%
                                </span>
                                {attempt.correctAnswers != null && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {attempt.correctAnswers}/{attempt.totalQuestions} correct
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">—</span>
                            )}
                          </Td>

                          <Td>
                            {attempt.timeTakenSeconds != null ? (
                              <span className="text-[11px] text-foreground">
                                {formatDuration(attempt.timeTakenSeconds)}
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">—</span>
                            )}
                          </Td>

                          <Td className="text-right">
                            <div className="flex justify-end gap-1.5">
                              {isCompleted && (
                                <Button
                                  size="2xs"
                                  variant="ghost"
                                  className="inline-flex items-center gap-1"
                                  onClick={() => handleViewReview(attempt.id)}
                                  asChild
                                >
                                  <Link href={`/review/reading/${encodeURIComponent(attempt.id)}`}>
                                    <Icon name="BarChart3" size={12} />
                                    <span>Review</span>
                                  </Link>
                                </Button>
                              )}

                              {isInProgress && (
                                <Button
                                  size="2xs"
                                  variant="outline"
                                  className="inline-flex items-center gap-1"
                                  onClick={() => handleResume(attempt.id)}
                                  asChild
                                >
                                  <Link
                                    href={`/mock/reading/run?id=${encodeURIComponent(
                                      attempt.testSlug
                                    )}&attempt=${encodeURIComponent(attempt.id)}`}
                                  >
                                    <Icon name="PlayCircle" size={12} />
                                    <span>Resume</span>
                                  </Link>
                                </Button>
                              )}

                              <Button
                                size="2xs"
                                variant="ghost"
                                className="inline-flex items-center gap-1"
                                onClick={() => handleRetake(attempt.testSlug)}
                                asChild
                              >
                                <Link
                                  href={`/mock/reading/run?id=${encodeURIComponent(attempt.testSlug)}`}
                                >
                                  <Icon name="RotateCcw" size={12} />
                                  <span>Retake</span>
                                </Link>
                              </Button>
                            </div>
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </Container>
      </section>
    </>
  );
};

type HistoryStatPillProps = {
  label: string;
  value: string;
  icon: string;
};

const HistoryStatPill: React.FC<HistoryStatPillProps> = ({ label, value, icon }) => {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-background/70 border border-border/70 px-3 py-1.5">
      <Icon name={icon} size={14} className="text-muted-foreground" />
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold text-foreground">{value}</span>
      </div>
    </div>
  );
};

type StatusBadgeProps = {
  status: AttemptStatus;
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (status === 'completed') {
    return (
      <Badge tone="success" size="xxs" className="inline-flex items-center gap-1">
        <Icon name="CheckCircle2" size={11} />
        <span>Completed</span>
      </Badge>
    );
  }

  if (status === 'in_progress') {
    return (
      <Badge tone="warning" size="xxs" className="inline-flex items-center gap-1">
        <Icon name="PlayCircle" size={11} />
        <span>In progress</span>
      </Badge>
    );
  }

  return (
    <Badge tone="neutral" size="xxs" className="inline-flex items-center gap-1">
      <Icon name="CircleSlash" size={11} />
      <span>Abandoned</span>
    </Badge>
  );
};

type ThProps = React.ThHTMLAttributes<HTMLTableCellElement>;
const Th: React.FC<ThProps> = ({ children, className, ...rest }) => (
  <th
    className={`px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide ${className ?? ''}`}
    {...rest}
  >
    {children}
  </th>
);

type TdProps = React.TdHTMLAttributes<HTMLTableCellElement>;
const Td: React.FC<TdProps> = ({ children, className, ...rest }) => (
  <td className={`px-3 py-2 align-top ${className ?? ''}`} {...rest}>
    {children}
  </td>
);

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDuration(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return '—';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return `${hours}h ${remMinutes}m`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

export const getServerSideProps: GetServerSideProps<ReadingHistoryPageProps> = async ({ req, res }) => {
  const supabase = getServerClient(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: '/login?next=/mock/reading/history',
        permanent: false,
      },
    };
  }

  const rawId = user.id;
  const year = new Date().getFullYear();
  const candidateId = `GX-${year}-${rawId.slice(0, 8).toUpperCase()}`;

  // TODO: Replace MockAttempts + DEFAULT_HISTORY_STATS with real data from Supabase.
  // Example shape (adjust to your actual view/table):
  //
  // const { data, error } = await supabase
  //   .from('v_reading_attempts_summary')
  //   .select('*')
  //   .order('started_at', { ascending: false })
  //   .limit(50);
  //
  // Map `data` into ReadingAttemptSummary[] and compute stats.

  return {
    props: {
      candidateId,
      attempts: MockAttempts,
      stats: DEFAULT_HISTORY_STATS,
    },
  };
};

export default ReadingHistoryPage;
