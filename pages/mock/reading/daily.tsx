// pages/mock/reading/daily.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';
import type { ReadingTest } from '@/lib/reading/types';
import { getDailyChallengeSeed, pickDailyIndex } from '@/lib/reading/dailyChallenge';
import { computeDailyStreak } from '@/lib/reading/streak';
import { DailyStreakCard } from '@/components/reading/daily/DailyStreakCard';

type PageProps = {
  test: ReadingTest | null;
  streak: {
    currentStreak: number;
    longestStreak: number;
  };
};

const DailyReadingPage: NextPage<PageProps> = ({ test, streak }) => {
  return (
    <>
      <Head>
        <title>Daily Reading Challenge · GramorX</title>
      </Head>

      <section className="py-10 bg-background">
        <Container className="max-w-3xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Badge size="xs" variant="outline">
                Daily challenge
              </Badge>
              <h1 className="text-xl font-semibold tracking-tight">
                One passage a day. No excuses.
              </h1>
              <p className="text-xs text-muted-foreground">
                Finish today’s Reading challenge to keep your streak alive.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/mock/reading">
                <Icon name="arrow-left" className="h-4 w-4 mr-1" />
                Back to Reading
              </Link>
            </Button>
          </div>

          <DailyStreakCard streak={streak} />

          {test ? (
            <Card className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Today’s mock
                </p>
                <p className="text-sm font-medium">{test.title}</p>
                {test.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {test.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <p className="text-xs text-muted-foreground">
                  {test.durationSeconds
                    ? `${Math.round(test.durationSeconds / 60)} minutes`
                    : '60 minutes'}{' '}
                  · {test.examType === 'academic' ? 'Academic' : 'General Training'}
                </p>
                <Button asChild size="sm">
                  <Link href={`/mock/reading/${test.slug}`}>
                    <Icon name="play-circle" className="h-4 w-4 mr-1" />
                    Start today’s mock
                  </Link>
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-4 text-xs text-muted-foreground">
              No Reading tests available yet. Add at least one row in{' '}
              <code className="mx-1">reading_tests</code> to unlock the daily challenge.
            </Card>
          )}
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

  // load some reading tests
  const { data: testsRows } = await supabase
    .from('reading_tests')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(30);

  let test: ReadingTest | null = null;

  if (testsRows && testsRows.length > 0) {
    const seed = getDailyChallengeSeed(user.id, new Date());
    const idx = pickDailyIndex(seed, testsRows.length);
    const row = testsRows[idx];

    test = {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      examType: row.exam_type,
      durationSeconds: row.duration_seconds ?? 3600,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // streak from attempts_reading
  const { data: attemptsRows } = await supabase
    .from('attempts_reading')
    .select('created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  const streak = computeDailyStreak(
    (attemptsRows ?? []).map((r) => ({ date: r.created_at })),
  );

  return {
    props: {
      test,
      streak,
    },
  };
};

export default DailyReadingPage;
