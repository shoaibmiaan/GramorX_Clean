// pages/mock/listening/[slug].tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';

import IELTSListeningExam from '@/components/listening/IELTSListeningExam';
import type {
  ListeningTest,
  ListeningSection,
  ListeningQuestion,
} from '@/lib/listening/types';

type PageProps = {
  test: ListeningTest | null;
  sections: ListeningSection[];
  questions: ListeningQuestion[];
  candidateId: string;
};

const ListeningMockRunPage: NextPage<PageProps> = ({
  test,
  sections,
  questions,
  candidateId,
}) => {
  if (!test) {
    return (
      <>
        <Head>
          <title>Listening mock not found · GramorX</title>
        </Head>
        <Container className="py-10">
          <Card className="mx-auto max-w-xl space-y-4 p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <Icon name="AlertCircle" className="h-8 w-8 text-destructive" />
              <h1 className="text-h4 font-semibold">Listening mock not found</h1>
            </div>
            <p className="text-small text-muted-foreground">
              This listening mock is not available anymore or the link is incorrect.
            </p>
            <div className="flex justify-center">
              <Button asChild>
                <Link href="/mock/listening">
                  <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                  Back to Listening Mocks
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
        <title>{test.title} · IELTS Listening Mock · GramorX</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
      </Head>

      {/* Full-screen exam room, no layout chrome, no side gaps */}
      <div className="fixed inset-0 z-0 flex h-[100dvh] w-[100vw] overflow-hidden bg-background">
        <IELTSListeningExam
          test={test}
          sections={sections}
          questions={questions}
          candidateId={candidateId}
        />
      </div>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const slugParam = ctx.params?.slug;

  if (!slugParam || typeof slugParam !== 'string') {
    return {
      props: {
        test: null,
        sections: [],
        questions: [],
        candidateId: 'GX-UNKNOWN',
      },
    };
  }

  const supabase = getServerClient<Database>(ctx.req, ctx.res);

  type TestRow = Database['public']['Tables']['listening_tests']['Row'];
  type SectionRow = Database['public']['Tables']['listening_sections']['Row'];
  type QuestionRow = Database['public']['Tables']['listening_questions']['Row'];

  const { data: testsRows, error: testsError } = await supabase
    .from('listening_tests')
    .select('*')
    .eq('slug', slugParam)
    .eq('is_mock', true)
    .eq('is_published', true)
    .limit(1);

  if (testsError || !testsRows || testsRows.length === 0) {
    return {
      props: {
        test: null,
        sections: [],
        questions: [],
        candidateId: 'GX-UNKNOWN',
      },
    };
  }

  const testRow: TestRow = testsRows[0];

  const { data: sectionRows } = await supabase
    .from('listening_sections')
    .select('*')
    .eq('test_id', testRow.id)
    .order('order_no', { ascending: true });

  const { data: questionRows } = await supabase
    .from('listening_questions')
    .select('*')
    .eq('test_id', testRow.id)
    .order('question_number', { ascending: true });

const test: ListeningTest = {
  id: testRow.id,
  slug: testRow.slug,
  title: testRow.title,
  description: testRow.description,

  // legacy full URL
  audioUrl: testRow.audio_url,

  // NEW: path in v2 bucket
  audioObjectPath: (testRow as any).audio_object_path ?? null,

  transcript: testRow.transcript,
  durationSeconds: (testRow.duration_minutes ?? 40) * 60,
  totalQuestions: testRow.questions ?? 40,
  level: testRow.level,
  isPublished: testRow.is_published ?? false,
  createdAt: testRow.created_at,
  updatedAt: testRow.updated_at,
};

  const sections: ListeningSection[] =
    (sectionRows ?? []).map((row: SectionRow) => ({
      id: row.id,
      testId: row.test_id,
      testSlug: row.test_slug,
      orderNo: row.order_no,
      audioUrl: row.audio_url ?? test.audioUrl ?? null,
      startMs: row.start_ms ?? null,
      endMs: row.end_ms ?? null,
      startSec: row.start_sec ?? null,
      endSec: row.end_sec ?? null,
      title: row.title,
      transcript: row.transcript,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) ?? [];

  const questions: ListeningQuestion[] =
    (questionRows ?? []).map((row: QuestionRow) => ({
      id: row.id,
      testId: row.test_id,
      testSlug: row.test_slug,
      sectionId: row.section_id,
      sectionNo: row.section_no,
      questionNumber: row.question_number,
      qno: row.qno,
      questionType: row.question_type,
      type: row.type,
      prompt: row.prompt,
      questionText: row.question_text,
      options: (row.options ?? []) as unknown[],
      correctAnswer: row.correct_answer as unknown,
      answerKey: row.answer_key as unknown,
      matchLeft: (row.match_left ?? []) as unknown[],
      matchRight: (row.match_right ?? []) as unknown[],
      explanation: row.explanation,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })) ?? [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const candidateId = user?.id
    ? `GX-${user.id.substring(0, 8).toUpperCase()}`
    : 'GX-UNKNOWN';

  return {
    props: {
      test,
      sections,
      questions,
      candidateId,
    },
  };
};

export default ListeningMockRunPage;
