// pages/listening/practice/[testSlug]/result.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

import PracticeResultSummary from '@/components/listening/Practice/PracticeResultSummary';
import MockAnswerSheet from '@/components/listening/Mock/MockAnswerSheet';

type AnswerRow = {
  questionNumber: number;
  sectionNumber: number;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

type Props = {
  testSlug: string;
  testTitle: string;
  attemptId: string;
  mode: 'practice' | 'mock';
  createdAt: string;
  bandScore: number;
  rawScore: number;
  maxScore: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  answers: AnswerRow[];
};

const ListeningPracticeResultPage: NextPage<Props> = ({
  testSlug,
  testTitle,
  attemptId,
  mode,
  createdAt,
  bandScore,
  rawScore,
  maxScore,
  totalQuestions,
  timeSpentSeconds,
  answers,
}) => {
  const accuracy = maxScore > 0 ? rawScore / maxScore : 0;

  return (
    <>
      <Head>
        <title>{testTitle} • Practice Result • GramorX</title>
        <meta
          name="description"
          content="Result and breakdown for your IELTS-style Listening practice test."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Listening · {mode === 'mock' ? 'Mock' : 'Practice'} result
              </p>
              <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                {testTitle}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {new Date(createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                · Attempt ID: {attemptId.slice(0, 8)}…
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link
                  href={`/listening/practice/${encodeURIComponent(testSlug)}`}
                >
                  <Icon name="RotateCcw" size={14} />
                  <span>Retry this test</span>
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/listening/analytics">
                  <Icon name="LineChart" size={14} />
                  <span>View listening analytics</span>
                </Link>
              </Button>
            </div>
          </div>

          <section className="mb-6">
            <PracticeResultSummary
              bandScore={bandScore}
              rawScore={rawScore}
              maxScore={maxScore}
              totalQuestions={totalQuestions}
              accuracy={accuracy}
              timeSpentSeconds={timeSpentSeconds}
            />
          </section>

          <section className="space-y-3">
            <Card className="border-border bg-muted/40 px-3 py-3 text-[11px] text-muted-foreground sm:px-4 sm:py-3 sm:text-xs">
              <p className="flex items-start gap-2">
                <Icon
                  name="Target"
                  size={14}
                  className="mt-0.5 text-primary"
                />
                <span>
                  This is practice, so be ruthless in analysis. For every wrong answer, note what
                  exact trap caught you — mishearing, spelling, not reading instructions, or zoning
                  out for 3 seconds.
                </span>
              </p>
            </Card>

            <MockAnswerSheet rows={answers} />
          </section>
        </Container>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const testSlug = ctx.query.testSlug as string | undefined;
  const attemptId = ctx.query.attemptId as string | undefined;

  if (!testSlug || !attemptId) {
    return { notFound: true };
  }

  const supabase = getServerClient(ctx.req, ctx.res);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { props: null as never };
  }

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(
          `/listening/practice/${testSlug}/result?attemptId=${attemptId}`,
        )}`,
        permanent: false,
      },
    };
  }

  const { data: attemptRow, error: attemptError } = await supabase
    .from('attempts_listening')
    .select(
      'id, user_id, test_id, mode, status, raw_score, band_score, total_questions, time_spent_seconds, created_at, listening_tests(slug, title, total_score, duration_seconds)',
    )
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .eq('status', 'submitted')
    .single<any>();

  if (attemptError || !attemptRow) {
    return { notFound: true };
  }

  const {
    id,
    mode,
    raw_score,
    band_score,
    total_questions,
    time_spent_seconds,
    created_at,
    listening_tests,
  } = attemptRow;

  const maxScore =
    listening_tests?.total_score ?? total_questions ?? 40;
  const timeSpentSeconds =
    time_spent_seconds ?? listening_tests?.duration_seconds ?? 30 * 60;
  const testTitle = listening_tests?.title ?? 'Listening Test';

  const { data: answersRows, error: answersError } = await supabase
    .from('attempts_listening_answers')
    .select(
      'value, is_correct, listening_questions(question_number, section_number, prompt, correct_answers)',
    )
    .eq('attempt_id', attemptId);

  let answers: AnswerRow[] = [];

  if (!answersError && answersRows) {
    answers =
      answersRows.map((row: any) => {
        const q = row.listening_questions;
        const userValue = Array.isArray(row.value)
          ? row.value.join(', ')
          : row.value ?? '';
        const correct =
          Array.isArray(q?.correct_answers) && q.correct_answers.length > 0
            ? q.correct_answers.join(', ')
            : '';

        return {
          questionNumber: q?.question_number ?? 0,
          sectionNumber: q?.section_number ?? 0,
          prompt: q?.prompt ?? '',
          userAnswer: userValue,
          correctAnswer: correct,
          isCorrect: !!row.is_correct,
        };
      }) ?? [];
  }

  answers.sort((a, b) => {
    if (a.sectionNumber !== b.sectionNumber) {
      return a.sectionNumber - b.sectionNumber;
    }
    return a.questionNumber - b.questionNumber;
  });

  return {
    props: {
      testSlug: listening_tests?.slug ?? testSlug,
      testTitle,
      attemptId: id,
      mode,
      createdAt: created_at,
      bandScore: band_score ?? 0,
      rawScore: raw_score ?? 0,
      maxScore,
      totalQuestions: total_questions ?? 40,
      timeSpentSeconds,
      answers,
    },
  };
};

export default ListeningPracticeResultPage;
