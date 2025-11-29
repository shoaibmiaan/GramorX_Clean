// pages/mock/reading/drill/speed.tsx
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
import type { ReadingPassage, ReadingQuestion, ReadingTest } from '@/lib/reading/types';
import { ReadingExamShell } from '@/components/reading/ReadingExamShell';
import { speedTrainingLevels } from '@/data/reading/speedTrainingConfigs';

type PageProps = {
  test: ReadingTest | null;
  passages: ReadingPassage[];
  questions: ReadingQuestion[];
  levelId: string;
};

const SpeedTrainingPage: NextPage<PageProps> = ({ test, passages, questions, levelId }) => {
  const level = speedTrainingLevels.find((l) => l.id === levelId) ?? speedTrainingLevels[1];

  if (!test) {
    return (
      <>
        <Head>
          <title>Reading Speed Training · GramorX</title>
        </Head>
        <section className="py-16">
          <Container className="max-w-3xl">
            <Card className="p-6 text-sm text-muted-foreground">
              No Reading test found for speed training.
            </Card>
          </Container>
        </section>
      </>
    );
  }

  const speedTest: ReadingTest = {
    ...test,
    durationSeconds: level.durationMinutes * 60,
  };

  return (
    <>
      <Head>
        <title>Speed Training – {level.label} · GramorX</title>
      </Head>

      <section className="py-6 bg-background">
        <Container className="max-w-4xl space-y-3">
          <Card className="p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Badge size="xs" variant="outline">
                Speed training
              </Badge>
              <span className="font-medium">{level.label}</span>
              <span className="text-muted-foreground">
                {level.durationMinutes} minutes · {level.description}
              </span>
            </div>
            <Button
              asChild
              size="xs"
              variant="outline"
            >
              <a href="/mock/reading">
                <Icon name="arrow-left" className="h-3.5 w-3.5 mr-1" />
                Back to mocks
              </a>
            </Button>
          </Card>
        </Container>

        <ReadingExamShell test={speedTest} passages={passages} questions={questions} />
      </section>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient<Database>(ctx);

  const levelIdRaw = ctx.query.level;
  const levelId =
    typeof levelIdRaw === 'string' ? levelIdRaw : speedTrainingLevels[1].id;

  // pick any reading test for now (later: choose by difficulty)
  const { data: testsRows } = await supabase
    .from('reading_tests')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(1);

  if (!testsRows || !testsRows.length) {
    return {
      props: {
        test: null,
        passages: [],
        questions: [],
        levelId,
      },
    };
  }

  const testRow = testsRows[0];

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

  return {
    props: {
      test,
      passages,
      questions,
      levelId,
    },
  };
};

export default SpeedTrainingPage;
