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
  const notFound = !test || !attempt;

  if (notFound) {
    return (
      <>
        <Head>
          <title>Reading review · GramorX</title>
        </Head>
        <Container className="py-10">
          <Card className="mx-auto max-w-xl p-8 text-center space-y-3">
            <p className="text-sm font-semibold">Review not available</p>
            <p className="text-xs text-muted-foreground">
              We could not find this attempt or it is not accessible with your account.
            </p>
          </Card>
        </Container>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Review – {test.title} · Reading Mock · GramorX</title>
      </Head>
      <Container className="py-8 max-w-5xl">
        <ReadingReviewShell
          test={test}
          passages={passages}
          questions={questions}
          attempt={attempt}
          answers={answers}
        />
      </Container>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const attemptIdParam = ctx.params?.attemptId;
  if (!attemptIdParam || typeof attemptIdParam !== 'string') {
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

  const supabase = getServerClient(ctx.req, ctx.res);

  type AttemptRow = Database['public']['Tables']['reading_attempts']['Row'];
  type TestRow = Database['public']['Tables']['reading_tests']['Row'];
  type PassageRow = Database['public']['Tables']['reading_passages']['Row'];
  type QuestionRow = Database['public']['Tables']['reading_questions']['Row'];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // force login for review
  if (!user) {
    return {
      redirect: {
        destination: '/login?role=student',
        permanent: false,
      },
    };
  }

  // 1) load attempt (no join)
  const { data: attemptRow, error: attemptError } = await supabase
    .from('reading_attempts')
    .select('*')
    .eq('id', attemptIdParam)
    .maybeSingle<AttemptRow>();

  if (attemptError || !attemptRow) {
    // eslint-disable-next-line no-console
    console.error('reading_review: attempt error', attemptError);
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

  // safety: user must own this attempt
  if (attemptRow.user_id !== user.id) {
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

  // 2) load test
  const { data: testRow, error: testError } = await supabase
    .from('reading_tests')
    .select('*')
    .eq('id', attemptRow.test_id)
    .maybeSingle<TestRow>();

  if (testError || !testRow) {
    // eslint-disable-next-line no-console
    console.error('reading_review: test error', testError);
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

  // 3) load passages + questions for that test
  const [{ data: passageRows, error: pErr }, { data: questionRows, error: qErr }] =
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
    ]);

  if (pErr || qErr) {
    // eslint-disable-next-line no-console
    console.error('reading_review: passage/question error', pErr, qErr);
  }

  const passages: ReadingPassage[] =
    (passageRows ?? []).map((row: PassageRow) => ({
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
    (questionRows ?? []).map((row: QuestionRow) => ({
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

  // 4) answers from attempt.meta.answers
  const meta = (attemptRow.meta as any) || {};
  const answersMap: Record<string, any> = meta.answers ?? {};

  const reviewAnswers: ReviewAnswer[] = questions.map((q) => {
    const selected = answersMap[q.id] ?? null;
    const correct = (q as any).correctAnswer;

    let isCorrect = false;

    if (correct == null) {
      isCorrect = false;
    } else if (typeof correct === 'string') {
      isCorrect = selected != null && selected === correct;
    } else if (Array.isArray(correct)) {
      if (Array.isArray(selected)) {
        const givenSet = new Set(selected as any[]);
        isCorrect = (correct as any[]).every((v) => givenSet.has(v));
      }
    } else if (
      typeof correct === 'object' &&
      selected &&
      typeof selected === 'object'
    ) {
      const cObj = correct as Record<string, any>;
      const gObj = selected as Record<string, any>;
      const keys = Object.keys(cObj);
      isCorrect = keys.every((k) => gObj[k] === cObj[k]);
    }

    let selectedAnswer: string | string[] | null = null;
    if (selected == null) {
      selectedAnswer = null;
    } else if (typeof selected === 'string') {
      selectedAnswer = selected;
    } else if (Array.isArray(selected)) {
      selectedAnswer = selected as string[];
    } else {
      selectedAnswer = String(selected);
    }

    return {
      questionId: q.id,
      isCorrect,
      selectedAnswer,
    };
  });

  const sectionStats = (attemptRow.section_stats as any) || {};
  const attempt: AttemptForReview = {
    id: attemptRow.id,
    rawScore: attemptRow.raw_score,
    bandScore: attemptRow.band_score,
    questionCount: sectionStats.totalQuestions ?? null,
    durationSeconds: attemptRow.duration_seconds,
    createdAt: attemptRow.started_at ?? attemptRow.created_at,
  };

  return {
    props: {
      test,
      passages,
      questions,
      attempt,
      answers: reviewAnswers,
    },
  };
};

export default ReadingReviewPage;
