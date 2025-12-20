// pages/mock/writing/history/index.tsx
import * as React from 'react';
import Head from 'next/head';
import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import { Badge } from '@/components/design-system/Badge';

type PageProps = {
  attempts: {
    id: string;
    createdAt: string;
    testTitle: string;
    testSlug: string;
    overallBand: number | null;
  }[];
  stats: {
    totalAttempts: number;
    bestBand: number | null;
    lastBand: number | null;
    lastAttemptAt: string | null;
  };
};

const WritingHistoryPage: NextPage<PageProps> = ({ attempts, stats }) => {
  return (
    <>
      <Head>
        <title>Writing mock history | GramorX</title>
      </Head>

      <Container className="py-8 lg:py-10 space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary">
              <Icon name="Clock" className="h-3.5 w-3.5" />
              <span>Writing mock history</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">
              Your Writing mock attempts
            </h1>
            <p className="text-xs text-muted-foreground lg:text-sm">
              Track how your Writing band is progressing over time across full mocks.
            </p>
          </div>

          <Button as={Link} href="/mock/writing" size="sm">
            <Icon name="PenSquare" className="mr-1.5 h-4 w-4" />
            Back to Writing mocks
          </Button>
        </div>

        {/* Stats row */}
        <div className="grid gap-3 md:grid-cols-3">
          <Card className="space-y-1 p-4 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Total attempts
            </div>
            <div className="text-2xl font-semibold">
              {stats.totalAttempts}
            </div>
          </Card>
          <Card className="space-y-1 p-4 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Best band
            </div>
            <div className="text-2xl font-semibold">
              {stats.bestBand ?? '—'}
            </div>
          </Card>
          <Card className="space-y-1 p-4 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Last band
            </div>
            <div className="text-2xl font-semibold">
              {stats.lastBand ?? '—'}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {stats.lastAttemptAt
                ? new Date(stats.lastAttemptAt).toLocaleDateString()
                : 'No attempts yet'}
            </div>
          </Card>
        </div>

        {/* Attempts table */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Icon name="ListOrdered" className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Attempt history</h2>
            </div>
            <Badge size="xs" tone="neutral">
              {attempts.length} attempts
            </Badge>
          </div>

          {attempts.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No Writing mock attempts yet. Start your first mock from the Writing mocks home page.
            </div>
          ) : (
            <div className="max-h-[480px] overflow-auto text-xs">
              <table className="min-w-full border-t text-left">
                <thead className="bg-muted/60 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Mock</th>
                    <th className="px-3 py-2 font-medium">Band</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((a) => (
                    <tr key={a.id} className="border-t text-xs">
                      <td className="px-3 py-2 align-middle">
                        {new Date(a.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div className="flex flex-col">
                          <span className="font-medium">{a.testTitle}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {a.testSlug}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle">
                        {a.overallBand ?? '—'}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            as={Link}
                            href={`/mock/writing/result/${a.id}`}
                            size="xs"
                            tone="neutral"
                            variant="outline"
                          >
                            <Icon name="BarChart2" className="mr-1 h-3.5 w-3.5" />
                            Result
                          </Button>
                          <Button
                            as={Link}
                            href={`/mock/writing/review/${a.id}`}
                            size="xs"
                            tone="neutral"
                            variant="ghost"
                          >
                            <Icon name="Eye" className="mr-1 h-3.5 w-3.5" />
                            Review
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Container>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient(ctx);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=/mock/writing/history`,
        permanent: false,
      },
    };
  }

  type AttemptsWritingRow =
    Database['public']['Tables']['writing_attempts']['Row'];
  type WritingTestsRow =
    Database['public']['Tables']['writing_tests']['Row'];

  const { data: rows, error } = await supabase
    .from('writing_attempts')
    .select(
      'id, created_at, user_id, overall_band, writing_tests ( id, slug, title )'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[mock/writing/history] attempts error', error);
  }

  const attemptsRaw = (rows as (AttemptsWritingRow & {
    writing_tests: WritingTestsRow | null;
  })[] | null) ?? [];

  const attempts: PageProps['attempts'] = attemptsRaw
    .filter((row) => row.writing_tests)
    .map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      testTitle: row.writing_tests!.title,
      testSlug: row.writing_tests!.slug,
      overallBand: (row as any).overall_band ?? null,
    }));

  const totalAttempts = attempts.length;
  const bands = attempts
    .map((a) => a.overallBand)
    .filter((b): b is number => typeof b === 'number');

  const bestBand = bands.length ? Math.max(...bands) : null;
  const lastBand = bands.length ? bands[0] : null;
  const lastAttemptAt = attempts[0]?.createdAt ?? null;

  return {
    props: {
      attempts,
      stats: {
        totalAttempts,
        bestBand,
        lastBand,
        lastAttemptAt,
      },
    },
  };
};

export default WritingHistoryPage;
