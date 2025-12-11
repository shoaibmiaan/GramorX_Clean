// pages/mock/writing/[slug].tsx
import * as React from 'react';
import Head from 'next/head';
import type { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

import { WritingExamShell } from '@/components/writing/WritingExamShell';

type ExamType = 'Academic' | 'General Training';

type PageProps = {
  test: {
    id: string;
    slug: string;
    title: string;
    examType: ExamType;
    durationMinutes: number;
    task1Prompt: string | null;
    task2Prompt: string | null;
  };
};

type SubmitPayload = {
  testId: string;
  answers: {
    taskId: string;
    label: 'Task 1' | 'Task 2';
    text: string;
    wordCount: number;
  }[];
};

const WritingMockExamPage: NextPage<PageProps> = ({ test }) => {
  const router = useRouter();

  const handleSubmit = async (payload: SubmitPayload) => {
    try {
      const res = await fetch('/api/mock/writing/attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error('Failed to submit writing attempt', await res.text());
        alert('Failed to submit attempt. Please try again.');
        return;
      }

      const data = await res.json();
      if (!data?.attemptId) {
        alert('Attempt submitted but attemptId missing in response.');
        return;
      }

      await router.push(`/mock/writing/result/${data.attemptId}`);
    } catch (error) {
      console.error('Error submitting writing attempt', error);
      alert('Something went wrong while submitting your attempt.');
    }
  };

  return (
    <>
      <Head>
        <title>{test.title} · Writing Mock | GramorX</title>
      </Head>

      {/* Full-screen exam shell, WritingExamShell should handle strict UI itself */}
      <WritingExamShell test={test} onSubmit={handleSubmit} />
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient(ctx);

  const slug = ctx.params?.slug as string | undefined;
  if (!slug) {
    return { notFound: true };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=/mock/writing/${encodeURIComponent(slug)}`,
        permanent: false,
      },
    };
  }

  type WritingTestsRow =
    Database['public']['Tables']['writing_tests']['Row'];

  const { data: testRow, error } = await supabase
    .from('writing_tests')
    .select(
      'id, slug, title, exam_type, duration_minutes, task1_prompt, task2_prompt, is_mock, is_published'
    )
    .eq('slug', slug)
    .eq('is_mock', true)
    .eq('is_published', true)
    .maybeSingle();

  if (error) {
    console.error('[mock/writing/[slug]] test error', error);
  }

  if (!testRow) {
    return { notFound: true };
  }

  const test: PageProps['test'] = {
    id: testRow.id,
    slug: testRow.slug,
    title: testRow.title,
    examType: (testRow as any).exam_type ?? 'Academic',
    durationMinutes: (testRow as any).duration_minutes ?? 60,
    task1Prompt: (testRow as any).task1_prompt ?? null,
    task2Prompt: (testRow as any).task2_prompt ?? null,
  };

  return {
    props: { test },
  };
};

export default WritingMockExamPage;
