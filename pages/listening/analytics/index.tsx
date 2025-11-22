// pages/listening/analytics/index.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

import ListeningAnalyticsOverview from '@/components/listening/Analytics/ListeningAnalyticsOverview';
import BandTrajectoryChart from '@/components/listening/Analytics/BandTrajectoryChart';
import QuestionTypeBreakdownChart from '@/components/listening/Analytics/QuestionTypeBreakdownChart';
import TimeManagementChart from '@/components/listening/Analytics/TimeManagementChart';
import AttemptsHistoryTable from '@/components/listening/Analytics/AttemptsHistoryTable';

import type { ListeningQuestionType } from '@/lib/listening/types';

type BandPoint = {
  attemptId: string;
  label: string;
  bandScore: number | null;
  mode: 'practice' | 'mock';
};

type QuestionTypeRow = {
  type: ListeningQuestionType;
  attempted: number;
  correct: number;
  avgAccuracy: number | null;
};

type TimeRow = {
  attemptId: string;
  label: string;
  timeSpentSeconds: number;
  targetSeconds: number;
};

type AttemptsHistoryRow = {
  attemptId: string;
  createdAt: string;
  mode: 'practice' | 'mock';
  testTitle: string;
  bandScore: number | null;
  rawScore: number | null;
  maxScore: number | null;
};

type Props = {
  overview: {
    bandCurrent: number | null;
    bandTarget: number | null;
    bandBest: number | null;
    attemptsCount: number;
    mockAttemptsCount: number;
    avgAccuracy: number | null;
  };
  bandTrajectory: BandPoint[];
  questionTypeRows: QuestionTypeRow[];
  timeRows: TimeRow[];
  attemptsHistory: AttemptsHistoryRow[];
};

const ListeningAnalyticsPage: NextPage<Props> = ({
  overview,
  bandTrajectory,
  questionTypeRows,
  timeRows,
  attemptsHistory,
}) => {
  return (
    <>
      <Head>
        <title>Listening Analytics • GramorX</title>
        <meta
          name="description"
          content="Track your IELTS Listening band, accuracy by question type, and timing behaviour."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          {/* Header */}
          <section className="mb-6 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Icon name="Headphones" size={14} />
              <span>Listening · Analytics</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Listening performance analytics
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  No vibes, no guesses. Just cold data about how your Listening is actually
                  performing over time.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                >
                  <a href="/listening/practice">
                    <Icon name="PlayCircle" size={14} />
                    <span>Start a practice test</span>
                  </a>
                </Button>
                <Button
                  asChild
                  size="sm"
                >
                  <a href="/mock/listening">
                    <Icon name="Headphones" size={14} />
                    <span>Take a full mock</span>
                  </a>
                </Button>
              </div>
            </div>
          </section>

          {/* Top overview */}
          <section className="mb-6">
            <ListeningAnalyticsOverview {...overview} />
          </section>

          {/* Middle analytics row */}
          <section className="mb-6 grid gap-4 lg:grid-cols-[2fr,1.5fr]">
            <BandTrajectoryChart points={bandTrajectory} />
            <TimeManagementChart rows={timeRows} />
          </section>

          {/* Question type breakdown */}
          <section className="mb-6">
            <QuestionTypeBreakdownChart rows={questionTypeRows} />
          </section>

          {/* Attempts history */}
          <section className="mb-6">
            <AttemptsHistoryTable rows={attemptsHistory} />
          </section>

          {/* Small note */}
          <section>
            <Card className="border-border bg-muted/40 px-3 py-3 text-[11px] text-muted-foreground sm:px-4 sm:py-3 sm:text-xs">
              <p className="flex items-start gap-2">
                <Icon name="Info" size={14} className="mt-0.5 text-primary" />
                <span>
                  Treat this like your IELTS lab report. If you blindly keep doing tests without
                  fixing the weak patterns this page is showing, that&apos;s on you.
                </span>
              </p>
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
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { props: null as never }; // should not really happen
  }

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent('/listening/analytics')}`,
        permanent: false,
      },
    };
  }

  // ----- Load attempts with test meta -----
  const { data: attemptsRows, error: attemptsError } = await supabase
    .from('attempts_listening')
    .select(
      'id, user_id, test_id, mode, status, raw_score, band_score, total_questions, time_spent_seconds, created_at, listening_tests(id, title, total_score, duration_seconds, is_mock)',
    )
    .eq('user_id', user.id)
    .eq('status', 'submitted')
    .order('created_at', { ascending: true });

  if (attemptsError) {
    // Fail silently but not crash the page
    return {
      props: {
        overview: {
          bandCurrent: null,
          bandTarget: null,
          bandBest: null,
          attemptsCount: 0,
          mockAttemptsCount: 0,
          avgAccuracy: null,
        },
        bandTrajectory: [],
        questionTypeRows: [],
        timeRows: [],
        attemptsHistory: [],
      },
    };
  }

  const attempts =
    (attemptsRows ?? []) as Array<{
      id: string;
      user_id: string;
      test_id: string;
      mode: 'practice' | 'mock';
      status: string;
      raw_score: number | null;
      band_score: number | null;
      total_questions: number | null;
      time_spent_seconds: number | null;
      created_at: string;
      listening_tests: {
        id: string;
        title: string;
        total_score: number | null;
        duration_seconds: number | null;
        is_mock: boolean | null;
      } | null;
    }>;

  if (!attempts.length) {
    return {
      props: {
        overview: {
          bandCurrent: null,
          bandTarget: null,
          bandBest: null,
          attemptsCount: 0,
          mockAttemptsCount: 0,
          avgAccuracy: null,
        },
        bandTrajectory: [],
        questionTypeRows: [],
        timeRows: [],
        attemptsHistory: [],
      },
    };
  }

  // ----- Overview stats -----
  const attemptsCount = attempts.length;
  const mockAttemptsCount = attempts.filter((a) => a.mode === 'mock').length;

  const latestAttempt = attempts[attempts.length - 1];
  const bandCurrent = latestAttempt.band_score ?? null;

  let bandBest: number | null = null;
  for (const a of attempts) {
    if (typeof a.band_score === 'number') {
      if (bandBest == null || a.band_score > bandBest) {
        bandBest = a.band_score;
      }
    }
  }

  // Target band – you can later replace with user profile target band from another table
  const bandTarget: number | null = null;

  // ----- Band trajectory -----
  const bandTrajectory: BandPoint[] = attempts.map((a) => ({
    attemptId: a.id,
    label: new Date(a.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    }),
    bandScore: a.band_score,
    mode: a.mode,
  }));

  // ----- Time rows -----
  const timeRows: TimeRow[] = attempts.map((a, idx) => {
    const durationSeconds =
      a.listening_tests?.duration_seconds ?? 30 * 60; // fallback 30m
    const label = `Attempt #${idx + 1} · ${
      a.mode === 'mock' ? 'Mock' : 'Practice'
    }`;
    return {
      attemptId: a.id,
      label,
      timeSpentSeconds: a.time_spent_seconds ?? durationSeconds,
      targetSeconds: durationSeconds,
    };
  });

  // ----- Attempts history -----
  const attemptsHistory: AttemptsHistoryRow[] = attempts
    .slice()
    .reverse() // most recent first
    .map((a) => ({
      attemptId: a.id,
      createdAt: a.created_at,
      mode: a.mode,
      testTitle: a.listening_tests?.title ?? 'Listening Test',
      bandScore: a.band_score,
      rawScore: a.raw_score,
      maxScore: a.listening_tests?.total_score ?? a.total_questions ?? null,
    }));

  // ----- Question-type analytics -----
  const attemptIds = attempts.map((a) => a.id);

  const { data: answersRows, error: answersError } = await supabase
    .from('attempts_listening_answers')
    .select(
      'attempt_id, is_correct, listening_questions(type)',
    )
    .in('attempt_id', attemptIds);

  let questionTypeRows: QuestionTypeRow[] = [];
  let avgAccuracy: number | null = null;

  if (!answersError && answersRows && answersRows.length > 0) {
    const typedRows = answersRows as Array<{
      attempt_id: string;
      is_correct: boolean | null;
      listening_questions: { type: ListeningQuestionType } | null;
    }>;

    const byType = new Map<
      ListeningQuestionType,
      { attempted: number; correct: number }
    >();

    let totalAttempted = 0;
    let totalCorrect = 0;

    for (const row of typedRows) {
      const qType = row.listening_questions?.type;
      if (!qType) continue;

      if (!byType.has(qType)) {
        byType.set(qType, { attempted: 0, correct: 0 });
      }

      const bucket = byType.get(qType)!;
      bucket.attempted += 1;
      totalAttempted += 1;
      if (row.is_correct) {
        bucket.correct += 1;
        totalCorrect += 1;
      }
    }

    questionTypeRows = Array.from(byType.entries()).map(
      ([type, stats]) => ({
        type,
        attempted: stats.attempted,
        correct: stats.correct,
        avgAccuracy:
          stats.attempted > 0 ? stats.correct / stats.attempted : null,
      }),
    );

    avgAccuracy =
      totalAttempted > 0 ? totalCorrect / totalAttempted : null;
  }

  const overview = {
    bandCurrent,
    bandTarget,
    bandBest,
    attemptsCount,
    mockAttemptsCount,
    avgAccuracy,
  };

  return {
    props: {
      overview,
      bandTrajectory,
      questionTypeRows,
      timeRows,
      attemptsHistory,
    },
  };
};

export default ListeningAnalyticsPage;
