// pages/mock/reading/[slug].tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

import type {
  ReadingTest as ReadingTestType,
  ReadingPassage as ReadingPassageType,
  ReadingQuestion as ReadingQuestionType,
} from '@/lib/reading/types';

import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import { ReadingExamShell } from '@/components/reading/ReadingExamShell';
import FocusGuard from '@/components/exam/FocusGuard';

type PageProps = {
  test: ReadingTestType | null;
  passages: ReadingPassageType[];
  questions: ReadingQuestionType[];
};

const ReadingMockRunPage: NextPage<PageProps> = ({ test, passages, questions }) => {
  if (!test) {
    return (
      <>
        <Head>
          <title>Reading mock not found · GramorX</title>
        </Head>
        <main className="h-[100dvh] w-full bg-background overflow-hidden">
          <Card className="mx-auto max-w-xl p-8 text-center space-y-4">
            <div className="flex flex-col items-center gap-2">
              <Icon name="AlertCircle" className="h-8 w-8 text-destructive" />
              <h1 className="text-lg font-semibold">Reading mock not found</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              This reading mock is not available anymore or the link is incorrect.
            </p>
            <div className="flex justify-center">
              <Button asChild>
                <Link href="/mock/reading">
                  <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                  Back to Reading Mocks
                </Link>
              </Button>
            </div>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{test.title} · Reading Mock · GramorX</title>
      </Head>
      {/* One-page full-screen exam room. No Container, no extra layout. */}
      <main className="min-h-[100dvh] w-full bg-background">
        <FocusGuard exam="reading" slug={test.slug} active />
        <ReadingExamShell test={test} passages={passages} questions={questions} />
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const slugParam = ctx.params?.slug;

  if (!slugParam || typeof slugParam !== 'string') {
    return {
      props: {
        test: null,
        passages: [],
        questions: [],
      },
    };
  }

  const supabase = getServerClient<Database>(ctx.req, ctx.res);
  type TestRow = Database['public']['Tables']['reading_tests']['Row'];
  type PassageRow = Database['public']['Tables']['reading_passages']['Row'];
  type QuestionRow = Database['public']['Tables']['reading_questions']['Row'];

  const { data: testsRows, error: testsError } = await supabase
    .from('reading_tests')
    .select('*')
    .eq('slug', slugParam)
    .eq('is_active', true)
    .limit(1);

  if (testsError || !testsRows || testsRows.length === 0) {
    return {
      props: {
        test: null,
        passages: [],
        questions: [],
      },
    };
  }

  const testRow: TestRow = testsRows[0];

  const { data: passageRows } = await supabase
    .from('reading_passages')
    .select('*')
    .eq('test_id', testRow.id)
    .order('passage_order', { ascending: true });

  const { data: questionRows } = await supabase
    .from('reading_questions')
    .select('*')
    .eq('test_id', testRow.id)
    .order('question_order', { ascending: true });

  const allowedQuestionTypes = new Set([
    'tfng',
    'true_false_not_given',
    'yynn',
    'yes_no_not_given',
    'mcq',
    'mcq_single',
    'mcq_multiple',
    'gap',
    'gap_fill',
    'gapfill',
    'blank',
    'fill_blank',
    'summary_completion',
    'matching',
    'match',
    'short_answer',
    'sentence_completion',
  ]);

  const sanitizeCorrectAnswer = (
    value: unknown,
  ): ReadingQuestionType['correctAnswer'] => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map((v) => String(v));
    if (typeof value === 'object') return value as Record<string, unknown>;
    return null;
  };

  const sanitizeConstraints = (value: unknown): Record<string, unknown> => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  };

  const test: ReadingTestType = {
    id: testRow.id,
    slug: testRow.slug,
    title: testRow.title,
    description: testRow.description,
    examType: testRow.exam_type,
    durationSeconds: testRow.duration_seconds ?? 3600,
    createdAt: testRow.created_at,
    updatedAt: testRow.updated_at,
  };

  const passages: ReadingPassageType[] =
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

  const questions: ReadingQuestionType[] = [];

  (questionRows ?? []).forEach((row: QuestionRow) => {
    const typeIdRaw = row.question_type_id ?? '';
    const typeKey = String(typeIdRaw).toLowerCase();

    if (!allowedQuestionTypes.has(typeKey)) {
      // eslint-disable-next-line no-console
      console.warn('Skipping unsupported reading question type', typeKey);
      return;
    }

    questions.push({
      id: row.id,
      testId: row.test_id,
      passageId: row.passage_id,
      questionOrder: row.question_order,
      questionTypeId: String(typeIdRaw),
      prompt: row.prompt,
      instruction: row.instruction,
      correctAnswer: sanitizeCorrectAnswer(row.correct_answer),
      constraintsJson: sanitizeConstraints(row.constraints_json ?? {}),
      tags: row.tags ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  });

  return {
    props: {
      test,
      passages,
      questions,
    },
  };
};

export default ReadingMockRunPage;
