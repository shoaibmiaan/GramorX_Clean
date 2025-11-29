// pages/mock/reading/analytics.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

import {
  computeAccuracyByQuestionType,
  type AnalyticsQuestionInput,
  type AnalyticsAnswerInput,
  type QuestionTypeAccuracy,
} from '@/lib/reading/analytics';
import { BandPredictorCard } from '@/components/reading/analytics/BandPredictorCard';
import type { ReadingAttemptSummary } from '@/lib/reading/bandPredictor';

type PageProps = {
  accuracyByType: QuestionTypeAccuracy[];
  attemptSummaries: ReadingAttemptSummary[];
};

const ReadingAnalyticsPage: NextPage<PageProps> = ({
  accuracyByType,
  attemptSummaries,
}) => {
  const hasData = attemptSummaries.length > 0;

  return (
    <>
      <Head>
        <title>Reading Analytics · GramorX</title>
      </Head>
      <section className="py-10 bg-background">
        <Container className="max-w-5xl space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Badge size="xs" variant="outline">
                Analytics
              </Badge>
              <h1 className="text-xl font-semibold tracking-tight">
                Reading analytics & weak spots
              </h1>
              <p className="text-xs text-muted-foreground max-w-xl">
                See which question types are destroying your score, how consistent you are, and
                where to drill next.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <a href="/mock/reading">
                <Icon name="arrow-left" className="h-4 w-4 mr-1" />
                Back to Reading mocks
              </a>
            </Button>
          </div>

          {!hasData && (
            <Card className="p-4 text-sm text-muted-foreground space-y-2">
              <p>You haven’t completed any Reading mock attempts yet.</p>
              <p className="text-xs">
                Do at least one full mock so we can analyse your strengths and weaknesses.
              </p>
            </Card>
          )}

          {hasData && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.4fr)]">
              {/* Left: question-type accuracy table */}
              <Card className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">
                    Accuracy by question type
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Sorted from weakest to strongest
                  </span>
                </div>

                <div className="border rounded-md overflow-hidden text-xs">
                  <div className="grid grid-cols-[2fr_1fr_1fr] bg-muted/60 px-3 py-2 font-medium text-[11px]">
                    <span>Question type</span>
                    <span className="text-right">Accuracy</span>
                    <span className="text-right">Correct / Total</span>
                  </div>
                  {accuracyByType.length === 0 && (
                    <div className="px-3 py-2 text-[11px] text-muted-foreground">
                      Not enough data yet. Do a few more attempts.
                    </div>
                  )}
                  {accuracyByType.map((row) => {
                    const pct = Math.round(row.accuracy * 100);
                    let color = 'text-red-500';
                    if (pct >= 75) color = 'text-emerald-500';
                    else if (pct >= 60) color = 'text-amber-500';

                    return (
                      <div
                        key={row.questionTypeId}
                        className="grid grid-cols-[2fr_1fr_1fr] px-3 py-1.5 border-t text-[11px]"
                      >
                        <span>{row.questionTypeId}</span>
                        <span className={`text-right font-semibold ${color}`}>
                          {pct}%
                        </span>
                        <span className="text-right text-muted-foreground">
                          {row.correct}/{row.total}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Focus first on anything below 60% – that’s usually TFNG / YNNG, matching headings,
                  or tricky sentence completion.
                </p>
              </Card>

              {/* Right: band predictor + hints */}
              <div className="space-y-3">
                <BandPredictorCard attempts={attemptSummaries} />

                <Card className="p-3 text-[11px] text-muted-foreground space-y-2">
                  <p className="font-medium text-xs">How to use this page</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      Pick 1–2 weakest question types and run targeted drills for them instead of
                      random mocks.
                    </li>
                    <li>
                      Watch the band predictor every 3–4 attempts – you want the trend to be “up”
                      and confidence increasing.
                    </li>
                    <li>
                      Don’t chase perfection in one area; aim for 70%+ in every common question
                      family.
                    </li>
                  </ul>
                </Card>
              </div>
            </div>
          )}
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
  if (!user) {
    return {
      redirect: { destination: '/login', permanent: false },
    };
  }

  // Get last N attempts for this user
  const { data: attemptsRows } = await supabase
    .from('attempts_reading')
    .select('id, raw_score, band_score, question_count, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(40);

  const attempts = attemptsRows ?? [];

  const attemptSummaries: ReadingAttemptSummary[] = attempts.map((a) => ({
    rawScore: a.raw_score ?? 0,
    totalQuestions: a.question_count ?? 40,
    bandScore: a.band_score,
    createdAt: a.created_at,
  }));

  if (!attempts.length) {
    return {
      props: {
        accuracyByType: [],
        attemptSummaries,
      },
    };
  }

  // For analytics, we can look at answers + questions across those attempts
  const attemptIds = attempts.map((a) => a.id);

  const [{ data: questionRows }, { data: answerRows }] = await Promise.all([
    supabase
      .from('reading_questions')
      .select('id, question_type_id'),
    supabase
      .from('attempts_reading_answers')
      .select('attempt_id, question_id, is_correct, selected_answer')
      .in('attempt_id', attemptIds),
  ]);

  const questions: AnalyticsQuestionInput[] =
    (questionRows ?? []).map((q) => ({
      id: q.id,
      questionTypeId: q.question_type_id as string,
    })) ?? [];

  const answers: AnalyticsAnswerInput[] =
    (answerRows ?? []).map((a) => ({
      questionId: a.question_id,
      isCorrect: !!a.is_correct,
      correctAnswer: null,
      selectedAnswer: a.selected_answer as any,
    })) ?? [];

  const accuracyByTypeAll = computeAccuracyByQuestionType(questions, answers);

  // Sort weakest → strongest
  const accuracyByType = accuracyByTypeAll.sort((a, b) => a.accuracy - b.accuracy);

  return {
    props: {
      accuracyByType,
      attemptSummaries,
    },
  };
};

export default ReadingAnalyticsPage;
