// pages/mock/reading/drill/index.tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';
import { hasAtLeast, type PlanTier } from '@/lib/plans';
import withPlan from '@/lib/withPlan';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import { UpgradeGate } from '@/components/payments/UpgradeGate';

type DrillStats = {
  totalDrills: number;
  avgAccuracy: number | null;
  bestAccuracy: number | null;
  lastDrillAt: string | null;
};

type PageProps = {
  stats: DrillStats;
  tier: PlanTier;
};

const ReadingDrillHubPage: NextPage<PageProps> = ({ stats, tier }) => {
  const isBasicPlus = hasAtLeast(tier, 'basic');
  const isElite = hasAtLeast(tier, 'elite');

  return (
    <>
      <Head>
        <title>Reading Drills • GramorX</title>
      </Head>

      <Container className="py-10">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">IELTS Reading</p>
            <h1 className="font-slab text-h1 text-foreground">Reading Drills</h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Short, focused sessions that sharpen speed and accuracy.
            </p>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Card className="px-4 py-3 rounded-ds-2xl border border-border/60 bg-card/80">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-ds-xl bg-muted text-foreground">
                  <Icon name="Activity" className="h-4 w-4" />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] text-muted-foreground">Total drills</p>
                  <p className="text-sm font-semibold">{stats.totalDrills}</p>
                </div>
              </div>
            </Card>

            <Card className="px-4 py-3 rounded-ds-2xl border border-border/60 bg-card/80">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-ds-xl bg-muted text-foreground">
                  <Icon name="Target" className="h-4 w-4" />
                </div>
                <div className="leading-tight">
                  <p className="text-[11px] text-muted-foreground">Avg accuracy</p>
                  <p className="text-sm font-semibold">
                    {stats.avgAccuracy == null ? '—' : `${Math.round(stats.avgAccuracy * 100)}%`}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {isBasicPlus && !isElite && (
          <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/5 px-4 py-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-primary">Smart Mode (Elite)</p>
              <p className="text-xs text-muted-foreground">
                Upgrade to Elite for personalised smart drills and adaptive pacing.
              </p>
            </div>
            <Button href="/pricing" size="sm" variant="primary">
              <Icon name="sparkles" className="mr-1 h-4 w-4" />
              Upgrade to Smart Mode
            </Button>
          </Card>
        )}

        <UpgradeGate
          required="basic"
          tier={tier}
          variant="overlay"
          title="Pro drills"
          description="Unlock focused Reading drills to sharpen speed and accuracy."
          ctaLabel="Upgrade for Focused Practice"
          ctaFullWidth
        >
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* SPEED */}
            <Card className="p-6 rounded-ds-2xl border border-border/60 bg-card/80">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Badge variant="secondary" size="sm">Speed</Badge>
                  <h2 className="font-slab text-h3">Speed Drill</h2>
                  <p className="text-sm text-muted-foreground">
                    Practice fast reading under a strict timer.
                  </p>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-ds-xl bg-muted text-foreground">
                  <Icon name="Timer" className="h-5 w-5" />
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li>• 1 passage</li>
                <li>• Fewer questions</li>
                <li>• Strict timer</li>
              </ul>

              <Button asChild size="sm" className="mt-5 w-full rounded-ds-2xl">
                <Link href="/mock/reading/drill/speed">Start Speed Drill</Link>
              </Button>
            </Card>

            {/* DAILY */}
            <Card className="p-6 rounded-ds-2xl border border-border/60 bg-card/80">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Badge variant="success" size="sm">Daily</Badge>
                  <h2 className="font-slab text-h3">Daily Challenge</h2>
                  <p className="text-sm text-muted-foreground">
                    One focused drill every day.
                  </p>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-ds-xl bg-success/10 text-success">
                  <Icon name="Flame" className="h-5 w-5" />
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li>• 1 task/day</li>
                <li>• Consistency wins</li>
                <li>• Builds streak</li>
              </ul>

              <Button asChild size="sm" className="mt-5 w-full rounded-ds-2xl" variant="secondary">
                <Link href="/mock/reading/daily">Open Daily</Link>
              </Button>
            </Card>

            {/* WEEKLY */}
            <Card className="p-6 rounded-ds-2xl border border-border/60 bg-card/80">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <Badge variant="warning" size="sm">Weekly</Badge>
                  <h2 className="font-slab text-h3">Weekly Plan</h2>
                  <p className="text-sm text-muted-foreground">
                    A structured plan to improve over time.
                  </p>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-ds-xl bg-warning/10 text-warning">
                  <Icon name="Calendar" className="h-5 w-5" />
                </div>
              </div>

              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li>• 7-day guidance</li>
                <li>• Balanced practice</li>
                <li>• Track progress</li>
              </ul>

              <Button asChild size="sm" className="mt-5 w-full rounded-ds-2xl" variant="secondary">
                <Link href="/mock/reading/weekly">Open Weekly</Link>
              </Button>
            </Card>
          </div>

          <div className="mt-8">
            <Card className="p-5 rounded-ds-2xl border border-border/60 bg-card/80">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Your drill snapshot</p>
                  <p className="text-xs text-muted-foreground">
                    Best accuracy:{' '}
                    {stats.bestAccuracy == null ? '—' : `${Math.round(stats.bestAccuracy * 100)}%`}
                    {' · '}
                    Last drill:{' '}
                    {stats.lastDrillAt == null ? '—' : new Date(stats.lastDrillAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="secondary" className="rounded-ds-2xl">
                    <Link href="/mock/reading/history">History</Link>
                  </Button>
                  <Button asChild size="sm" className="rounded-ds-2xl">
                    <Link href="/mock/reading">Back to Reading</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </UpgradeGate>
      </Container>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = withPlan('free', async (ctx, planCtx) => {
  const supabase = getServerClient<Database>(ctx.req, ctx.res);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { redirect: { destination: '/login', permanent: false } } as const;
  }

  // NOTE: this is intentionally defensive; if you don't have drill attempts table,
  // it should still load the hub without crashing.
  let stats: DrillStats = {
    totalDrills: 0,
    avgAccuracy: null,
    bestAccuracy: null,
    lastDrillAt: null,
  };

  try {
    const { data } = await supabase
      .from('reading_drill_attempts')
      .select('accuracy,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const rows = Array.isArray(data) ? data : [];
    const accuracies = rows
      .map((r: any) => (typeof r?.accuracy === 'number' ? r.accuracy : null))
      .filter((v: number | null): v is number => v != null);

    stats = {
      totalDrills: rows.length,
      avgAccuracy: accuracies.length ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length : null,
      bestAccuracy: accuracies.length ? Math.max(...accuracies) : null,
      lastDrillAt: rows[0]?.created_at ?? null,
    };
  } catch {
    // swallow – keep defaults
  }

  return { props: { stats, tier: planCtx.tier } };
});

export default ReadingDrillHubPage;
