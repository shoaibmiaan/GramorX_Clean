// pages/mock/reading/review/[attemptId].tsx
import * as React from 'react';
import Head from 'next/head';
import type { GetServerSideProps, NextPage } from 'next';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';
import type { ReadingTest, ReadingPassage, ReadingQuestion } from '@/lib/reading/types';
import { ReadingReviewShell } from '@/components/reading/review/ReadingReviewShell';

type ReviewAnswer = {
  questionId: string;
  isCorrect: boolean;
  selectedAnswer: string | string[] | null;
};

type AttemptForReview = {
  id: string;
  rawScore: number | null;
  bandScore: number | null;
  questionCount: number | null;
  createdAt: string;
  durationSeconds: number | null;
};

type PageProps = {
  test: ReadingTest | null;
  passages: ReadingPassage[];
  questions: ReadingQuestion[];
  attempt: AttemptForReview | null;
  answers: ReviewAnswer[];
};

const ReadingReviewPage: NextPage<PageProps> = ({
  test,
  passages,
  questions,
  attempt,
  answers,
}) => {
  if (!test || !attempt) {
    return (
      <>
        <Head>
          <title>Reading Review · GramorX</title>
        </Head>
        <section className="py-16 bg-background">
          <Container className="max-w-3xl">
            <Card className="p-6 text-sm text-muted-foreground space-y-3">
              <p>Review data for this Reading attempt could not be found.</p>
            </Card>
          </Container>
        </section>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Review – {test.title} · Reading Mock · GramorX</title>
      </Head>
      <ReadingReviewShell
        test={test}
        passages={passages}
        questions={questions}
        attempt={{
          id: attempt.id,
          rawScore: attempt.rawScore,
          bandScore: attempt.bandScore,
          questionCount: attempt.questionCount,
          createdAt: attempt.createdAt,
          durationSeconds: attempt.durationSeconds,
        }}
        answers={answers}
      />
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient<Database>(ctx);

  const attemptIdParam = ctx.params?.attemptId;
  if (typeof attemptIdParam !== 'string') {
    return { notFound: true };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      redirect: { destination: '/login', permanent: false },
    };
  }

  // Load attempt (ensure it belongs to user)
  const { data: attemptRow } = await supabase
    .from('attempts_reading')
    .select('*')
    .eq('id', attemptIdParam)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!attemptRow) {
    return {
      props: {
        test: null,
        passages: [],
        questions: [],
        attempt: null,
        answers: [],
      },
    };
  }

  // Load test
  const { data: testRow } = await supabase
    .from('reading_tests')
    .select('*')
    .eq('id', attemptRow.test_id)
    .maybeSingle();

  if (!testRow) {
    return {
      props: {
        test: null,
        passages: [],
        questions: [],
        attempt: null,
        answers: [],
      },
    };
  }

  const [{ data: passageRows }, { data: questionRows }, { data: answerRows }] =
    await Promise.all([
      supabase
        .from('reading_passages')
        .select('*')
        .eq('test_id', testRow.id)
        .order('passage_order', { ascending: true }),
      supabase
        .from('reading_questions')
        .select('*')
        .eq('test_id', testRow.id)
        .order('question_order', { ascending: true }),
      supabase
        .from('attempts_reading_answers')
        .select('question_id, is_correct, selected_answer')
        .eq('attempt_id', attemptRow.id),
    ]);

  const test: ReadingTest = {
    id: testRow.id,
    slug: testRow.slug,
    title: testRow.title,
    description: testRow.description,
    examType: testRow.exam_type,
    durationSeconds: testRow.duration_seconds ?? 3600,
    createdAt: testRow.created_at,
    updatedAt: testRow.updated_at,
  };

  const passages: ReadingPassage[] =
    (passageRows ?? []).map((row) => ({
      id: row.id,
      testId: row.test_id,
      passageOrder: row.passage_order,
      title: row.title,
      subtitle: row.subtitle,
      content: row.content,
      wordCount: row.word_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) ?? [];

  const questions: ReadingQuestion[] =
    (questionRows ?? []).map((row) => ({
      id: row.id,
      testId: row.test_id,
      passageId: row.passage_id,
      questionOrder: row.question_order,
      questionTypeId: row.question_type_id as any,
      prompt: row.prompt,
      instruction: row.instruction,
      correctAnswer: row.correct_answer as any,
      constraintsJson: (row.constraints_json ?? {}) as Record<string, unknown>,
      tags: row.tags ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) ?? [];

  const attempt: AttemptForReview = {
    id: attemptRow.id,
    rawScore: attemptRow.raw_score ?? null,
    bandScore: attemptRow.band_score ?? null,
    questionCount: attemptRow.question_count ?? null,
    createdAt: attemptRow.created_at,
    durationSeconds: attemptRow.duration_seconds ?? null,
  };

  const answers: ReviewAnswer[] =
    (answerRows ?? []).map((row) => ({
      questionId: row.question_id,
      isCorrect: !!row.is_correct,
      selectedAnswer: row.selected_answer as any,
    })) ?? [];

  return {
    props: {
      test,
      passages,
      questions,
      attempt,
      answers,
    },
  };
};

export default ReadingReviewPage;
