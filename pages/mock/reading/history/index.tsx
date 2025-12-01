// pages/mock/reading/history/index.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { Container } from '@/components/design-system/Container';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';

import {
  ReadingHistoryTable,
  type ReadingHistoryRow,
} from '@/components/reading/history/ReadingHistoryTable';
import { getServerClient } from '@/lib/supabaseServer';

type PageProps = {
  rows: ReadingHistoryRow[];
  filterSlug?: string | null;
  filterTitle?: string | null;
};

const ReadingHistoryPage: NextPage<PageProps> = ({
  rows,
  filterSlug,
  filterTitle,
}) => {
  const hasFilter = !!filterSlug;

  return (
    <>
      <Head>
        <title>Reading History · GramorX</title>
      </Head>
      <section className="py-10 bg-background">
        <Container className="max-w-4xl space-y-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                Reading history
                {hasFilter && filterTitle
                  ? ` – ${filterTitle}`
                  : hasFilter && filterSlug
                  ? ` – ${filterSlug}`
                  : ''}
              </h1>
              <p className="text-xs text-muted-foreground">
                {hasFilter
                  ? 'Only attempts for this specific Reading test.'
                  : 'All your IELTS-style Reading attempts in one place.'}
              </p>
            </div>

            <div className="flex gap-2">
              {hasFilter && (
                <Button asChild size="sm" variant="ghost">
                  <Link href="/mock/reading/history">
                    <Icon name="x" className="h-4 w-4 mr-1" />
                    Clear filter
                  </Link>
                </Button>
              )}
              <Button asChild size="sm" variant="outline">
                <Link href="/mock/reading">
                  <Icon name="arrow-left" className="h-4 w-4 mr-1" />
                  Back to Reading mocks
                </Link>
              </Button>
            </div>
          </div>

          <ReadingHistoryTable rows={rows} />
        </Container>
      </section>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: { destination: '/login?role=student', permanent: false },
    };
  }

  // ✅ read test filter from query (?test=slug)
  const testSlugParam = ctx.query.test;
  const testSlug =
    typeof testSlugParam === 'string' ? testSlugParam.trim() : null;

  // base query
  let query = supabase
    .from('attempts_reading')
    .select(
      `
        id,
        test_id,
        created_at,
        raw_score,
        band_score,
        question_count,
        reading_tests!inner (
          slug,
          title
        )
      `,
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  // ✅ if testSlug is present, filter only that paper
  if (testSlug) {
    query = query.eq('reading_tests.slug', testSlug);
  }

  const { data, error } = await query;

  if (error) {
    // eslint-disable-next-line no-console
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

  // figure out title for header if filtered
  let filterTitle: string | null = null;
  if (testSlug && rows.length > 0) {
    filterTitle = rows[0].testTitle;
  }

  return {
    props: {
      rows,
      filterSlug: testSlug ?? null,
      filterTitle,
    },
  };
};

export default ReadingHistoryPage;
