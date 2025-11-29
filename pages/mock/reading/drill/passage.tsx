// pages/mock/reading/drill/passage.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

import type { Database } from '@/lib/database.types';
import { getServerClient } from '@/lib/supabaseServer';
import type { ReadingPassage, ReadingQuestion } from '@/lib/reading/types';
import { ReadingPassagePane } from '@/components/reading/ReadingPassagePane';
import { ReadingQuestionItem } from '@/components/reading/ReadingQuestionItem';

type PageProps = {
  passage: ReadingPassage | null;
  questions: ReadingQuestion[];
};

const PassageDrillPage: NextPage<PageProps> = ({ passage, questions }) => {
  const [answers, setAnswers] = React.useState<Record<string, string | string[] | null>>({});

  if (!passage) {
    return (
      <>
        <Head>
          <title>Passage Drill · GramorX</title>
        </Head>
        <section className="py-16">
          <Container className="max-w-3xl">
            <Card className="p-6 text-sm text-muted-foreground">
              No passage found for this drill.
            </Card>
          </Container>
        </section>
      </>
    );
  }

  const handleChange = (id: string, val: string | string[] | null) => {
    setAnswers((prev) => ({ ...prev, [id]: val }));
  };

  return (
    <>
      <Head>
        <title>Passage Drill – P{passage.passageOrder} · GramorX</title>
      </Head>
      <section className="py-10 bg-background">
        <Container className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,2fr)] max-w-5xl">
          <ReadingPassagePane
            passage={passage}
            totalPassages={1}
            highlights={[]}
          />

          <Card className="flex flex-col overflow-hidden">
            <div className="border-b px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide">
                Questions
              </span>
              <Button size="xs" variant="outline">
                <Icon name="check-circle" className="h-3.5 w-3.5 mr-1" />
                Self-check
              </Button>
            </div>

            <div className="flex-1 overflow-auto px-4 py-3 space-y-4">
              {questions.map((q) => (
                <ReadingQuestionItem
                  key={q.id}
                  question={q}
                  value={answers[q.id] ?? null}
                  onChange={(v) => handleChange(q.id, v)}
                />
              ))}

              {questions.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No questions linked to this passage yet.
                </p>
              )}
            </div>
          </Card>
        </Container>
      </section>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient<Database>(ctx);

  const testSlug = ctx.query.test;
  const passageOrderRaw = ctx.query.p;
  if (!testSlug || typeof testSlug !== 'string') {
    return { props: { passage: null, questions: [] } };
  }

  const passageOrder = Number(passageOrderRaw ?? 1);

  const { data: testRow } = await supabase
    .from('reading_tests')
    .select('id')
    .eq('slug', testSlug)
    .maybeSingle();

  if (!testRow) {
    return { props: { passage: null, questions: [] } };
  }

  const { data: passageRow } = await supabase
    .from('reading_passages')
    .select('*')
    .eq('test_id', testRow.id)
    .eq('passage_order', passageOrder)
    .maybeSingle();

  if (!passageRow) {
    return { props: { passage: null, questions: [] } };
  }

  const { data: questionRows } = await supabase
    .from('reading_questions')
    .select('*')
    .eq('test_id', testRow.id)
    .eq('passage_id', passageRow.id)
    .order('question_order', { ascending: true });

  const passage: ReadingPassage = {
    id: passageRow.id,
    testId: passageRow.test_id,
    passageOrder: passageRow.passage_order,
    title: passageRow.title,
    subtitle: passageRow.subtitle,
    content: passageRow.content,
    wordCount: passageRow.word_count,
    createdAt: passageRow.created_at,
    updatedAt: passageRow.updated_at,
  };

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
      passage,
      questions,
    },
  };
};

export default PassageDrillPage;
