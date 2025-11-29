// pages/mock/reading/drill/question-type.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

import type { Database } from '@/lib/database.types';
import { getServerClient } from '@/lib/supabaseServer';
import type { ReadingQuestion } from '@/lib/reading/types';
import { ReadingQuestionItem } from '@/components/reading/ReadingQuestionItem';

type PageProps = {
  questionTypeId: string;
  questions: ReadingQuestion[];
};

const QuestionTypeDrillPage: NextPage<PageProps> = ({ questionTypeId, questions }) => {
  const [idx, setIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string | string[] | null>>({});
  const q = questions[idx];

  const handleChange = (val: string | string[] | null) => {
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  };

  const next = () => {
    setIdx((prev) => (prev + 1 < questions.length ? prev + 1 : prev));
  };

  const prev = () => {
    setIdx((prev) => (prev > 0 ? prev - 1 : prev));
  };

  if (!q) {
    return (
      <>
        <Head>
          <title>Reading Drill · GramorX</title>
        </Head>
        <section className="py-16">
          <Container>
            <Card className="p-6 text-sm text-muted-foreground">
              No questions available for this drill.
            </Card>
          </Container>
        </section>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Reading Drill – {questionTypeId} · GramorX</title>
      </Head>

      <section className="py-10 bg-background">
        <Container className="max-w-3xl space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <Badge size="xs" variant="outline">
                Question-type drill
              </Badge>
              <h1 className="text-lg font-semibold tracking-tight">
                {questionTypeId}
              </h1>
              <p className="text-xs text-muted-foreground">
                Focus drill on a single question type. No timer, just precision.
              </p>
            </div>
          </div>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Question {idx + 1} of {questions.length}
              </span>
            </div>

            <ReadingQuestionItem
              question={q}
              value={answers[q.id] ?? null}
              onChange={handleChange}
            />

            <div className="flex justify-between pt-2">
              <Button size="sm" variant="outline" onClick={prev} disabled={idx === 0}>
                <Icon name="arrow-left" className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={next}
                disabled={idx === questions.length - 1}
              >
                Next
                <Icon name="arrow-right" className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </Card>
        </Container>
      </section>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient<Database>(ctx);

  const qt = ctx.query.type;
  const questionTypeId =
    typeof qt === 'string' ? qt : 'TFNG';

  // Just sample 20 questions of this type
  const { data, error } = await supabase
    .from('reading_questions')
    .select('*')
    .eq('question_type_id', questionTypeId)
    .limit(20);

  if (error) {
    console.error(error);
  }

  const questions: ReadingQuestion[] =
    (data ?? []).map((row) => ({
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
      questionTypeId,
      questions,
    },
  };
};

export default QuestionTypeDrillPage;
