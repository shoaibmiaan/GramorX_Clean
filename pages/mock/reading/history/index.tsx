// pages/mock/reading/history/index.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';

import { Container } from '@/components/design-system/Container';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

import { ReadingHistoryTable, type ReadingHistoryRow } from '@/components/reading/history/ReadingHistoryTable';
import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

type PageProps = {
  rows: ReadingHistoryRow[];
};

const ReadingHistoryPage: NextPage<PageProps> = ({ rows }) => {
  return (
    <>
      <Head>
        <title>Reading History · GramorX</title>
      </Head>
      <section className="py-10 bg-background">
        <Container className="max-w-4xl space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-tight">Reading history</h1>
              <p className="text-xs text-muted-foreground">
                All your IELTS-style Reading attempts in one place.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <a href="/mock/reading">
                <Icon name="arrow-left" className="h-4 w-4 mr-1" />
                Back to Reading mocks
              </a>
            </Button>
          </div>

          <ReadingHistoryTable rows={rows} />
        </Container>
      </section>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient<Database>(ctx);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      redirect: { destination: '/login', permanent: false },
    };
  }

  const { data, error } = await supabase
    .from('attempts_reading')
    .select(
      'id, test_id, created_at, raw_score, band_score, question_count, reading_tests!inner(slug, title)',
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('reading history error', error);
  }

  const rows: ReadingHistoryRow[] =
    (data ?? []).map((row: any) => ({
      attemptId: row.id,
      testSlug: row.reading_tests.slug,
      testTitle: row.reading_tests.title,
      bandScore: row.band_score,
      rawScore: row.raw_score,
      totalQuestions: row.question_count,
      createdAt: row.created_at,
    })) ?? [];

  return { props: { rows } };
};

export default ReadingHistoryPage;
