// pages/mock/reading/[slug].tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';
import { ReadingExamShell } from '@/components/reading/ReadingExamShell';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';

type ReadingTestRow = Database['public']['Tables']['reading_tests']['Row'];
type ReadingPassageRow = Database['public']['Tables']['reading_passages']['Row'];
type ReadingQuestionRow = Database['public']['Tables']['reading_questions']['Row'];

type PageProps = {
  test: ReadingTestRow | null;
  passages: ReadingPassageRow[];
  questions: ReadingQuestionRow[];
};

const ReadingMockRunPage: NextPage<PageProps> = ({ test, passages, questions }) => {
  if (!test) {
    return (
      <>
        <Head>
          <title>Reading Mock Not Found · GramorX</title>
        </Head>
        <Container className="py-16">
          <Card className="mx-auto max-w-xl space-y-4 p-6 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-surface-elevated">
              <Icon name="alert-triangle" className="h-5 w-5 text-destructive" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">
              This Reading mock is not available
            </h1>
            <p className="text-sm text-foreground-muted">
              The test link you opened is not active anymore or the slug is invalid. Pick another
              mock from the Reading Mock Room.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <Button asChild variant="outline" size="sm">
                <Link href="/mock/reading/history">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="clock-restore" className="h-3.5 w-3.5" />
                    View history
                  </span>
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/mock/reading">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="arrow-left" className="h-3.5 w-3.5" />
                    Back to Reading mocks
                  </span>
                </Link>
              </Button>
            </div>
          </Card>
        </Container>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{test.title} · IELTS Reading Mock · GramorX</title>
      </Head>
      {/* ReadingExamShell is responsible for the strict exam-room layout, timer, nav, etc. */}
      <ReadingExamShell test={test} passages={passages} questions={questions} />
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const { slug } = ctx.params ?? {};

  if (!slug || typeof slug !== 'string') {
    return { notFound: true };
  }

  const supabase = getServerClient(ctx.req, ctx.res);

  const { data: test, error: testError } = await supabase
    .from('reading_tests')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (testError) {
    // eslint-disable-next-line no-console
    console.error('[reading mock run] failed to load test', testError);
  }

  if (!test) {
    return {
      props: {
        test: null,
        passages: [],
        questions: [],
      },
    };
  }

  const { data: passages, error: passagesError } = await supabase
    .from('reading_passages')
    .select('*')
    .eq('test_id', test.id)
    .order('passage_order', { ascending: true });

  if (passagesError) {
    // eslint-disable-next-line no-console
    console.error('[reading mock run] failed to load passages', passagesError);
  }

  const { data: questions, error: questionsError } = await supabase
    .from('reading_questions')
    .select('*')
    .eq('test_id', test.id)
    .order('question_order', { ascending: true });

  if (questionsError) {
    // eslint-disable-next-line no-console
    console.error('[reading mock run] failed to load questions', questionsError);
  }

  return {
    props: {
      test,
      passages: passages ?? [],
      questions: questions ?? [],
    },
  };
};

export default ReadingMockRunPage;
