// pages/listening/game/leaderboard.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

import ListeningNavTabs from '@/components/listening/ListeningNavTabs';

type LeaderboardRow = {
  rank: number;
  nickname: string;
  countryCode: string;
  highestStreak: number;
  totalCorrect: number;
};

type Props = {
  rows: LeaderboardRow[];
};

const ListeningGameLeaderboardPage: NextPage<Props> = ({ rows }) => {
  return (
    <>
      <Head>
        <title>Listening Game Leaderboard • GramorX</title>
        <meta
          name="description"
          content="See top Listening game streaks and scores across all users."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="xs">
                <Link href="/listening/game">
                  <Icon name="ArrowLeft" size={12} />
                  <span>Back to game hub</span>
                </Link>
              </Button>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                <Icon name="Trophy" size={12} />
                <span>Leaderboard</span>
              </span>
            </div>
            <ListeningNavTabs activeKey="game" />
          </div>

          <section className="mb-6">
            <Card className="border-border bg-card/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Listening game leaderboard
                  </p>
                  <p className="mt-1 text-sm text-foreground sm:text-base">
                    These are the people who treat “game mode” like serious training, not casual
                    scrolling.
                  </p>
                </div>
                <Button asChild size="sm">
                  <Link href="/listening/game/challenge?mode=speed">
                    <Icon name="Zap" size={14} />
                    <span>Try to beat them</span>
                  </Link>
                </Button>
              </div>
            </Card>
          </section>

          <section>
            {rows.length === 0 ? (
              <Card className="border-border bg-card/60 p-4 text-xs text-muted-foreground sm:text-sm">
                Leaderboard isn&apos;t live yet. Once we connect this to real game data, your streaks
                and scores will show up here. For now, just focus on beating yourself.
              </Card>
            ) : (
              <Card className="border-border bg-card/60 p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs text-muted-foreground sm:text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide">
                        <th className="px-4 py-2 font-medium">Rank</th>
                        <th className="px-4 py-2 font-medium">Player</th>
                        <th className="px-4 py-2 font-medium">Country</th>
                        <th className="px-4 py-2 font-medium">Best streak</th>
                        <th className="px-4 py-2 font-medium">Total correct</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr
                          key={row.rank}
                          className="border-b border-border/60 last:border-b-0"
                        >
                          <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                            #{row.rank}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                            {row.nickname}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-muted-foreground sm:text-sm">
                            {row.countryCode}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                            {row.highestStreak}
                          </td>
                          <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                            {row.totalCorrect}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </section>
        </Container>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      props: {
        rows: [],
      },
    };
  }

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(
          '/listening/game/leaderboard',
        )}`,
        permanent: false,
      },
    };
  }

  // Placeholder static rows – later plug this into Supabase view
  const rows: LeaderboardRow[] = [];

  return {
    props: {
      rows,
    },
  };
};

export default ListeningGameLeaderboardPage;
