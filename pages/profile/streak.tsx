import { useMemo } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import dynamic from 'next/dynamic';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { Icon } from '@/components/design-system/Icon';
import { StreakProgressBar } from '@/components/streak/StreakProgressBar';
import { StreakChip } from '@/components/user/StreakChip';
import { useStreak } from '@/hooks/useStreak';
import { useStreakHistory } from '@/hooks/useStreakHistory';
import { useStreakTokens } from '@/hooks/useStreakTokens';
import { getServerClient } from '@/lib/supabaseServer';
import { buildStreakAnalytics, loadShieldSummary } from '@/lib/streakServer';
import type { StreakDay } from '@/types/streak';

const Heatmap = dynamic(() => import('@/components/user/StreakHeatmap').then((mod) => mod.StreakHeatmap), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full animate-pulse rounded-ds-2xl border border-dashed border-border bg-muted" />
  ),
});

type ServerSummary = {
  current: number;
  longest: number;
  lastActive: string | null;
  timezone: string;
  nextMilestone: number;
  streakBrokenRecently: boolean;
  shields: number;
};

type Props = {
  history: StreakDay[];
  summary: ServerSummary;
};

const HISTORY_DAYS = 120;

const formatRelativeLastActive = (iso: string | null) => {
  if (!iso) return 'No activity logged yet';
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return 'No activity logged yet';
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((today.getTime() - date.getTime()) / 86_400_000);
  if (diffDays <= 0) return 'Active today';
  if (diffDays === 1) return 'Last active yesterday';
  return `Last active ${diffDays} days ago`;
};

const formatAbsoluteDate = (iso: string | null, timezone: string) => {
  if (!iso) return '—';
  try {
    const formatter = new Intl.DateTimeFormat(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: timezone || 'UTC',
    });
    return formatter.format(new Date(`${iso}T00:00:00Z`));
  } catch {
    return iso;
  }
};

const SummaryCard = ({
  label,
  value,
  secondary,
}: {
  label: string;
  value: string;
  secondary?: string;
}) => (
  <div className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-h4 font-semibold text-foreground">{value}</p>
    {secondary ? <p className="text-sm text-muted-foreground">{secondary}</p> : null}
  </div>
);

const StreakPage: NextPage<Props> = ({ history, summary }) => {
  const streak = useStreak({
    current: summary.current,
    longest: summary.longest,
    lastDayKey: summary.lastActive,
    timezone: summary.timezone,
    nextMilestone: summary.nextMilestone,
    streakBrokenRecently: summary.streakBrokenRecently,
    shields: summary.shields,
  });
  const {
    data: historyData,
    loading: historyLoading,
    error: historyError,
    reload: reloadHistory,
  } = useStreakHistory({ initial: history, days: HISTORY_DAYS });
  const tokens = useStreakTokens();

  const current = streak.loading ? summary.current : streak.current;
  const best = streak.loading ? summary.longest : streak.longest;
  const nextMilestone = Math.max(streak.nextMilestone || summary.nextMilestone, 1);

  const milestoneCopy = nextMilestone <= current ? 'New milestone unlocked!' : `${nextMilestone - current} day(s) to your next reward`;

  const lastActiveRelative = useMemo(
    () => formatRelativeLastActive(streak.lastDayKey ?? summary.lastActive),
    [streak.lastDayKey, summary.lastActive],
  );

  const lastActiveAbsolute = useMemo(
    () => formatAbsoluteDate(streak.lastDayKey ?? summary.lastActive, streak.timezone ?? summary.timezone),
    [streak.lastDayKey, summary.lastActive, streak.timezone, summary.timezone],
  );

  const refreshAll = () => {
    void streak.reload();
    void reloadHistory();
  };

  const showSkeleton = historyLoading && historyData.length === 0;

  return (
    <section className="bg-lightBg py-16 dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
      <Container className="space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-electricBlue">Habits</p>
            <h1 className="font-slab text-display">Your daily study streak</h1>
            <p className="text-body text-muted-foreground">
              Complete at least one learning task per day to keep the streak alive. Breaks reset your count,
              but every day back on track matters.
            </p>
          </div>
          <StreakChip value={current} loading={streak.loading} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="space-y-6 rounded-ds-2xl p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current streak</p>
                <p className="font-slab text-display text-foreground">{current} days</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Best streak</p>
                <p className="font-slab text-h3 text-foreground">{best} days</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Progress to next milestone</span>
                <span>{nextMilestone} days</span>
              </div>
              <StreakProgressBar current={current} goal={nextMilestone} className="mt-2" />
              <p className="mt-1 text-sm text-muted-foreground">{milestoneCopy}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SummaryCard label="Status" value={lastActiveRelative} secondary={lastActiveAbsolute} />
              <SummaryCard label="Timezone" value={streak.timezone || summary.timezone} secondary="We localize your streak window" />
            </div>

            {streak.error ? (
              <div className="rounded-xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
                <p>We couldn&apos;t refresh your streak right now.</p>
                <Button size="sm" variant="secondary" className="mt-3" onClick={() => streak.reload()}>
                  Retry
                </Button>
              </div>
            ) : null}

            <div className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">How streaks work</p>
              <ul className="mt-2 list-disc space-y-2 pl-4">
                <li>Finish at least one verified learning action within your timezone each day.</li>
                <li>Every consecutive day increases your streak and unlocks streak token bonuses.</li>
                <li>Missing a day resets your current streak, but your best streak stays recorded.</li>
              </ul>
            </div>
          </Card>

          <Card className="space-y-4 rounded-ds-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-slab text-h4">Reward wallet</h2>
                <p className="text-sm text-muted-foreground">Earn streak tokens as you hit milestones.</p>
              </div>
              <Icon name="coins" size={24} className="text-accent" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Available tokens</p>
                  <p className="text-h3 font-semibold text-foreground">
                    {tokens.loading ? '—' : tokens.data?.availableTokens ?? 0}
                  </p>
                </div>
                <Badge tone="success" size="sm">
                  {tokens.loading ? '—' : `$${(tokens.data?.estimatedUsdValue ?? 0).toFixed(2)}`}
                </Badge>
              </div>
              <div className="rounded-xl border border-dashed border-border/60 px-4 py-3 text-sm text-muted-foreground">
                <p>
                  {tokens.loading
                    ? 'Calculating next reward window…'
                    : tokens.error
                      ? tokens.error
                      : tokens.data
                        ? `You are ${tokens.data.nextTokenInDays} day(s) away from the next streak token.`
                        : 'Start logging activity to unlock tokens.'}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => tokens.reload()} disabled={tokens.loading}>
                Refresh tokens
              </Button>
            </div>
          </Card>
        </div>

        <Card className="rounded-ds-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-slab text-h3">Heatmap</h2>
              <p className="text-sm text-muted-foreground">Each square shows how active you were on that day.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={refreshAll} disabled={historyLoading}>
              <Icon name="refresh" size={16} className="mr-1" /> Refresh streak
            </Button>
          </div>
          <div className="mt-6 space-y-4">
            {historyError ? (
              <div className="rounded-xl border border-danger/40 bg-danger/5 p-4 text-sm text-danger">
                <p>{historyError}</p>
                <Button variant="secondary" size="sm" className="mt-3" onClick={() => reloadHistory()}>
                  Try again
                </Button>
              </div>
            ) : null}
            {showSkeleton ? (
              <div className="h-64 w-full animate-pulse rounded-ds-2xl border border-dashed border-border bg-muted" />
            ) : (
              <Heatmap data={historyData} />
            )}
            {historyLoading && !showSkeleton ? (
              <p className="text-xs text-muted-foreground">Refreshing the latest activity…</p>
            ) : null}
          </div>
        </Card>
      </Container>
    </section>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    const [{ summary, history }, shields] = await Promise.all([
      buildStreakAnalytics({ supabase, userId: user.id, historyDays: HISTORY_DAYS, summaryLookback: 365 }),
      loadShieldSummary(supabase, user.id),
    ]);

    return {
      props: {
        history,
        summary: {
          current: summary.current_streak,
          longest: summary.longest_streak,
          lastActive: summary.last_activity_date ?? null,
          timezone: summary.timezone,
          nextMilestone: summary.next_milestone_days,
          streakBrokenRecently: summary.streak_broken_recently,
          shields: shields?.tokens ?? summary.shields ?? 0,
        },
      },
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[profile/streak] failed to build streak view', error);
    return {
      props: {
        history: [],
        summary: {
          current: 0,
          longest: 0,
          lastActive: null,
          timezone: 'Asia/Karachi',
          nextMilestone: 1,
          streakBrokenRecently: false,
          shields: 0,
        },
      },
    };
  }
};

export default StreakPage;
