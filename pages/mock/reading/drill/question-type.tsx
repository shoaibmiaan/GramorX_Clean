// pages/mock/reading/drill/question-type.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';

import { getServerClient } from '@/lib/supabaseServer';
import type { ReadingQuestion } from '@/lib/reading/types';
import { ReadingQuestionItem } from '@/components/reading/ReadingQuestionItem';

type PageProps = {
  questionTypeId: string;
  questions: ReadingQuestion[];
};

const QuestionTypeDrillPage: NextPage<PageProps> = ({ questionTypeId, questions }) => {
  return (
    <>
      <Head>
        <title>Question Type Drill</title>
      </Head>

      <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 pb-20">
        <Container className="py-10 space-y-6">
          <Card className="p-4 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold">Question Type Drill</h1>
              <p className="text-sm text-muted-foreground">
                Practice only this question type. Try to move quickly but accurately.
              </p>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/mock/reading">
                <Icon name="ChevronLeft" className="h-4 w-4 mr-1" />
                Back to Reading
              </Link>
            </Button>
          </Card>

          <div className="space-y-3">
            {questions.map((q) => (
              <ReadingQuestionItem key={q.id} question={q} />
            ))}
          </div>
        </Container>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);

  const questionTypeId = typeof ctx.query.type === 'string' ? ctx.query.type : 'mcq_single';

  const { data: questions } = await supabase
    .from('reading_questions')
    .select('*')
    .eq('type', questionTypeId)
    .limit(20);

  return {
    props: {
      questionTypeId,
      questions: (questions as any) ?? [],
    },
  };
};

export default QuestionTypeDrillPage;
