// pages/listening/game/index.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

import ListeningModuleHero from '@/components/listening/ListeningModuleHero';
import ListeningNavTabs from '@/components/listening/ListeningNavTabs';
import ListeningInfoBanner from '@/components/listening/ListeningInfoBanner';

type Props = {
  // reserved for future user gamification data
  totalChallengesPlayed: number;
  bestStreak: number;
};

const ListeningGameIndexPage: NextPage<Props> = ({
  totalChallengesPlayed,
  bestStreak,
}) => {
  return (
    <>
      <Head>
        <title>Listening Games • GramorX</title>
        <meta
          name="description"
          content="Gamified IELTS Listening drills to sharpen your focus, speed, and accuracy without burning full mock tests."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          <ListeningModuleHero
            chipLabel="Listening module"
            chipIcon="Gamepad"
            title="Listening games"
            subtitle="Short, sharp drills that attack your focus, speed, and accuracy – designed to feel like a game, but rigged to make you better at real IELTS Listening."
            metaLabel="Reality check"
            metaDescription="These are not toys. They’re intense micro-drills that punish lazy listening so the real exam feels calmer."
          />

          <ListeningNavTabs activeKey="game" />

          <section className="mb-6">
            <ListeningInfoBanner
              variant="info"
              title="How to use Listening games"
              body="Use games when your brain is tired of full tests but you still want to improve. Hit 1–2 short challenges, push your limits, then get out."
            />
          </section>

          {/* User quick stats (local, not tied to DB yet) */}
          <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border bg-card/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Challenges played
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {totalChallengesPlayed}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Even 1 focused mini-drill is better than fake “studying”.
                  </p>
                </div>
                <Icon name="Target" size={20} className="text-primary" />
              </div>
            </Card>

            <Card className="border-border bg-card/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Best correct streak (local)
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {bestStreak}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Protect streaks more than you protect your mood.
                  </p>
                </div>
                <Icon name="Flame" size={20} className="text-primary" />
              </div>
            </Card>

            <Card className="border-border bg-card/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Leaderboard
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    Global (coming)
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Start playing now. When the real leaderboard goes live, you&apos;ll already be
                    dangerous.
                  </p>
                </div>
                <Icon name="Trophy" size={20} className="text-primary" />
              </div>
            </Card>
          </section>

          {/* Game modes */}
          <section className="mb-6 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground sm:text-base">
                Game modes
              </h2>
              <Button asChild size="sm" variant="outline">
                <Link href="/listening/game/leaderboard">
                  <Icon name="Trophy" size={14} />
                  <span>View leaderboard</span>
                </Link>
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Card className="flex flex-col justify-between border-border bg-card/60 p-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <Icon name="Zap" size={13} />
                    <span>Speed round</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Speed accuracy drill
                  </p>
                  <p className="text-xs text-muted-foreground">
                    60–90 seconds of fast questions. If your focus drops, the score exposes you
                    immediately.
                  </p>
                </div>
                <div className="mt-3">
                  <Button
                    asChild
                    size="sm"
                    className="w-full justify-center"
                  >
                    <Link href="/listening/game/challenge?mode=speed">
                      <Icon name="PlayCircle" size={14} />
                      <span>Play speed round</span>
                    </Link>
                  </Button>
                </div>
              </Card>

              <Card className="flex flex-col justify-between border-border bg-card/60 p-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <Icon name="Crosshair" size={13} />
                    <span>Spelling sniper</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    Spelling & detail drill
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Short-answer style questions that punish sloppy spelling and half-listening.
                  </p>
                </div>
                <div className="mt-3">
                  <Button
                    asChild
                    size="sm"
                    className="w-full justify-center"
                  >
                    <Link href="/listening/game/challenge?mode=spelling">
                      <Icon name="PlayCircle" size={14} />
                      <span>Play spelling sniper</span>
                    </Link>
                  </Button>
                </div>
              </Card>

              <Card className="flex flex-col justify-between border-border bg-card/60 p-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    <Icon name="EyeOff" size={13} />
                    <span>No-back mode</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    No-back-button focus drill
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You answer once and move on. No review, no corrections. Just like the real
                    pressure.
                  </p>
                </div>
                <div className="mt-3">
                  <Button
                    asChild
                    size="sm"
                    className="w-full justify-center"
                  >
                    <Link href="/listening/game/challenge?mode=noback">
                      <Icon name="PlayCircle" size={14} />
                      <span>Play no-back mode</span>
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
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
        totalChallengesPlayed: 0,
        bestStreak: 0,
      },
    };
  }

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent('/listening/game')}`,
        permanent: false,
      },
    };
  }

  // Placeholder – later you can pull real stats from Supabase
  const totalChallengesPlayed = 0;
  const bestStreak = 0;

  return {
    props: {
      totalChallengesPlayed,
      bestStreak,
    },
  };
};

export default ListeningGameIndexPage;
