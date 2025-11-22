// pages/listening/dashboard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

type SummaryResponse = {
  totalAttempts: number;
  averageBand: number | null;
  bestBand: number | null;
  lastAttemptAt: string | null;
  totalCorrect: number;
  totalQuestions: number;
  totalTimeSeconds: number;
};

type QuestionTypeStat = {
  question_type: string;
  attempts: number;
  correct: number;
  total: number;
};

type QuestionTypeResponse = QuestionTypeStat[];

type AttemptSummary = {
  id: string;
  started_at: string | null;
  submitted_at: string | null;
  mode: 'practice' | 'mock';
  raw_score: number | null;
  band_score: number | null;
  total_questions: number | null;
};

type AttemptsResponse = AttemptSummary[];

const formatDateTime = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return '0 min';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  if (rem === 0) return `${hours} hr`;
  return `${hours} hr ${rem} min`;
};

const safePercent = (num: number, den: number) => {
  if (!den || den <= 0) return 0;
  return Math.round((num / den) * 100);
};

const ListeningDashboardPage: NextPage = () => {
  const router = useRouter();

  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [questionTypes, setQuestionTypes] = useState<QuestionTypeResponse>([]);
  const [attempts, setAttempts] = useState<AttemptsResponse>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [summaryRes, qtRes, attemptsRes] = await Promise.all([
          fetch('/api/listening/analytics/summary'),
          fetch('/api/listening/analytics/by-question-type'),
          fetch('/api/listening/analytics/attempts'),
        ]);

        if (!summaryRes.ok || !qtRes.ok || !attemptsRes.ok) {
          throw new Error('Failed to load listening analytics');
        }

        const summaryJson: SummaryResponse = await summaryRes.json();
        const qtJson: QuestionTypeResponse = await qtRes.json();
        const attemptsJson: AttemptsResponse = await attemptsRes.json();

        if (cancelled) return;

        setSummary(summaryJson);
        setQuestionTypes(qtJson);
        setAttempts(attemptsJson);
      } catch (err) {
        if (!cancelled) {
          setError('Could not load your listening analytics. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const overallAccuracy = useMemo(() => {
    if (!summary) return 0;
    return safePercent(summary.totalCorrect, summary.totalQuestions);
  }, [summary]);

  const bestQuestionType = useMemo(() => {
    if (!questionTypes.length) return null;
    const sorted = [...questionTypes].sort((a, b) => {
      const aAcc = safePercent(a.correct, a.total);
      const bAcc = safePercent(b.correct, b.total);
      return bAcc - aAcc;
    });
    return sorted[0] ?? null;
  }, [questionTypes]);

  const weakestQuestionType = useMemo(() => {
    if (!questionTypes.length) return null;
    const sorted = [...questionTypes].sort((a, b) => {
      const aAcc = safePercent(a.correct, a.total);
      const bAcc = safePercent(b.correct, b.total);
      return aAcc - bAcc;
    });
    return sorted[0] ?? null;
  }, [questionTypes]);

  const handleStartPractice = () => {
    router.push('/listening'); // existing module home / test selection
  };

  const handleStartMock = () => {
    router.push('/mock/listening');
  };

  return (
    <>
      <Head>
        <title>Listening Dashboard • GramorX</title>
        <meta
          name="description"
          content="Advanced IELTS Listening analytics, band trajectory, and targeted practice plan."
        />
      </Head>

      <main className="min-h-screen bg-background">
        <Container className="py-8 lg:py-10">
          {/* Top header / hero */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-strong">
                <Icon name="Headphones" size={14} />
                <span>Listening V2 · Deep Analytics</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Listening Mission Control
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                Track your band trajectory, fix weak question types, and jump into the exact practice that
                moves your score up.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleStartPractice}
                className="inline-flex items-center gap-2"
              >
                <Icon name="PlayCircle" size={16} />
                <span>Quick practice</span>
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={handleStartMock}
                className="inline-flex items-center gap-2"
              >
                <Icon name="Sparkles" size={16} />
                <span>Full mock test</span>
              </Button>
            </div>
          </div>

          {error && (
            <Card className="mb-6 border-destructive-soft bg-destructive-soft text-destructive-strong">
              <div className="flex items-start gap-3">
                <Icon name="AlertCircle" size={18} />
                <div>
                  <p className="text-sm font-medium">Something went wrong</p>
                  <p className="mt-1 text-xs text-destructive-weak">
                    {error} If it keeps happening, please refresh or try again later.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Card key={idx} className="h-28 animate-pulse bg-surface-subtle" />
              ))}
            </div>
          )}

          {!loading && summary && (
            <>
              {/* Stat cards */}
              <div className="mb-8 grid gap-4 md:grid-cols-3">
                <Card className="border-subtle bg-surface">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Overall band
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {summary.averageBand ? summary.averageBand.toFixed(1) : '—'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Best: {summary.bestBand ? summary.bestBand.toFixed(1) : '—'}
                      </p>
                    </div>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                      <Icon name="Gauge" size={20} />
                    </div>
                  </div>
                </Card>

                <Card className="border-subtle bg-surface">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Accuracy
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {overallAccuracy}%
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {summary.totalCorrect}/{summary.totalQuestions} questions correct
                      </p>
                    </div>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success-strong">
                      <Icon name="Target" size={20} />
                    </div>
                  </div>
                </Card>

                <Card className="border-subtle bg-surface">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Activity
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {summary.totalAttempts}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Last attempt: {formatDateTime(summary.lastAttemptAt)}
                      </p>
                    </div>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-warning-strong">
                      <Icon name="Clock" size={20} />
                    </div>
                  </div>
                </Card>
              </div>

              {/* Question-type breakdown + quick actions */}
              <div className="mb-8 grid gap-6 lg:grid-cols-3">
                <Card className="border-subtle bg-surface lg:col-span-2">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-foreground sm:text-base">
                        Accuracy by question type
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        See where you&apos;re strong and where you keep dropping marks.
                      </p>
                    </div>
                    <Badge variant="soft" className="text-xs">
                      <Icon name="ListChecks" size={14} className="mr-1" />
                      {questionTypes.length} types
                    </Badge>
                  </div>

                  {questionTypes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Do a listening test to unlock detailed question-type analytics.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {questionTypes.map((qt) => {
                        const acc = safePercent(qt.correct, qt.total);
                        return (
                          <div
                            key={qt.question_type}
                            className="flex items-center gap-3 rounded-md bg-surface-subtle px-3 py-2"
                          >
                            <div className="flex-1">
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                {qt.question_type}
                              </p>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <div className="flex-1">
                                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-subtle">
                                    <div
                                      className="h-full rounded-full bg-success-strong"
                                      style={{ width: `${acc}%` }}
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>{acc}%</span>
                                  <span className="text-border-strong">•</span>
                                  <span>{qt.attempts} attempts</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>

                <Card className="border-subtle bg-surface">
                  <h2 className="mb-3 text-sm font-semibold text-foreground sm:text-base">
                    Targeted practice
                  </h2>
                  <p className="mb-4 text-xs text-muted-foreground">
                    Jump straight into practice that attacks your weakest question type first.
                  </p>

                  <div className="space-y-3">
                    <div className="rounded-md bg-surface-subtle p-3">
                      <p className="text-xs font-medium text-muted-foreground">Strongest</p>
                      {bestQuestionType ? (
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {bestQuestionType.question_type}{' '}
                          <span className="text-xs font-normal text-muted-foreground">
                            ({safePercent(bestQuestionType.correct, bestQuestionType.total)}%)
                          </span>
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground">Not enough data yet.</p>
                      )}
                    </div>

                    <div className="rounded-md bg-surface-subtle p-3">
                      <p className="text-xs font-medium text-muted-foreground">Weakest</p>
                      {weakestQuestionType ? (
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {weakestQuestionType.question_type}{' '}
                          <span className="text-xs font-normal text-muted-foreground">
                            ({safePercent(weakestQuestionType.correct, weakestQuestionType.total)}%)
                          </span>
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground">Not enough data yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <Link href="/listening" className="block">
                      <Button variant="primary" size="sm" className="w-full justify-center">
                        <Icon name="Target" size={16} className="mr-2" />
                        Practice weakest type
                      </Button>
                    </Link>
                    <Link href="/mock/listening" className="block">
                      <Button variant="outline" size="sm" className="w-full justify-center">
                        <Icon name="Headphones" size={16} className="mr-2" />
                        Take a timed mock
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>

              {/* Recent attempts */}
              <Card className="border-subtle bg-surface">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground sm:text-base">
                      Recent listening attempts
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Review your history and jump into detailed review for each test.
                    </p>
                  </div>
                </div>

                {attempts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No attempts yet. Start a practice or mock test to see them here.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-subtle text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="py-2 pr-4">Mode</th>
                          <th className="py-2 pr-4">Band</th>
                          <th className="py-2 pr-4">Score</th>
                          <th className="py-2 pr-4">Questions</th>
                          <th className="py-2 pr-4">Started</th>
                          <th className="py-2 pr-4">Submitted</th>
                          <th className="py-2 pr-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attempts.map((attempt) => {
                          const questions = attempt.total_questions ?? 40;
                          const raw = attempt.raw_score ?? 0;
                          const acc = safePercent(raw, questions);

                          return (
                            <tr
                              key={attempt.id}
                              className="border-b border-subtle last:border-b-0 hover:bg-surface-subtle"
                            >
                              <td className="py-2 pr-4 align-middle">
                                <Badge variant={attempt.mode === 'mock' ? 'solid' : 'soft'} size="sm">
                                  {attempt.mode === 'mock' ? 'Mock' : 'Practice'}
                                </Badge>
                              </td>
                              <td className="py-2 pr-4 align-middle font-medium text-foreground">
                                {attempt.band_score ? attempt.band_score.toFixed(1) : '—'}
                              </td>
                              <td className="py-2 pr-4 align-middle text-sm text-muted-foreground">
                                {raw}/{questions} ({acc}%)
                              </td>
                              <td className="py-2 pr-4 align-middle text-sm text-muted-foreground">
                                {questions}
                              </td>
                              <td className="py-2 pr-4 align-middle text-xs text-muted-foreground">
                                {formatDateTime(attempt.started_at)}
                              </td>
                              <td className="py-2 pr-4 align-middle text-xs text-muted-foreground">
                                {formatDateTime(attempt.submitted_at)}
                              </td>
                              <td className="py-2 pl-4 align-middle text-right">
                                <Link href={`/listening/attempt/${attempt.id}`} className="inline-flex">
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    className="inline-flex items-center gap-1 text-xs"
                                  >
                                    <Icon name="Eye" size={14} />
                                    <span>Review</span>
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Time summary */}
              <p className="mt-3 text-xs text-muted-foreground">
                Total time spent in listening so far:{' '}
                <span className="font-medium text-foreground">
                  {formatDuration(summary.totalTimeSeconds)}
                </span>
              </p>
            </>
          )}
        </Container>
      </main>
    </>
  );
};

export default ListeningDashboardPage;
