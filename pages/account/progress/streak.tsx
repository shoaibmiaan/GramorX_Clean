import type { GetServerSideProps, NextPage } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Container } from '@/components/design-system/Container';
import { StreakProvider } from '@/components/progress/StreakProvider';
import { StreakChip } from '@/components/user/StreakChip';
import { getServerStreakPayload, type StreakResponse } from '@/lib/server/streakMetrics';
import { getServerClient, getServerUser } from '@/lib/supabaseServer';

const Heatmap = dynamic(
  () => import('@/components/user/StreakHeatmap').then((mod) => mod.StreakHeatmap),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full animate-pulse rounded-ds-2xl border border-dashed border-border bg-muted" />
    ),
  },
);

type Props = {
  streak: StreakResponse;
  streakInitial?: number | null;
};

const formatDisplayDate = (iso: string | null) => {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Karachi',
    }).format(new Date(`${iso}T00:00:00Z`));
  } catch {
    return iso;
  }
};

const buildHeatmapData = (heatmap: StreakResponse['heatmap']) =>
  Object.entries(heatmap)
    .map(([date, level]) => ({
      date,
      completed: level === 'complete' ? 1 : 0,
      total: level === 'none' ? 0 : 1,
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

const StreakPage: NextPage<Props> = ({ streak }) => {
  const heatmapData = buildHeatmapData(streak.heatmap);
  const hasProductiveDays = streak.productiveDaysLast90 > 0;

  return (
    <StreakProvider initial={streak.currentStreak}>
      <section className="bg-background text-foreground py-16">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-slab text-display">Your streak</h1>
              <p className="text-body text-muted-foreground">
                Keep learning every day—complete a study task before midnight Pakistan time to maintain the streak.
              </p>
            </div>
            <StreakChip value={streak.currentStreak} href="/account/progress/streak" />
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <Card className="rounded-ds-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-slab text-h3">Calendar heatmap</h2>
                  <p className="text-small text-muted-foreground">
                    Each square represents a day. Darker shades mean more tasks completed.
                  </p>
                </div>
                <span className="text-caption text-muted-foreground">PKT timezone</span>
              </div>
              <div className="mt-6">
                {hasProductiveDays ? (
                  <Heatmap data={heatmapData} />
                ) : (
                  <Card className="rounded-ds-2xl border border-dashed border-border bg-muted/40 p-6 text-center">
                    <div className="text-h4 font-semibold">No streak yet</div>
                    <p className="mt-2 text-body text-muted-foreground">
                      Complete your first study task before midnight Pakistan time to start your streak.
                    </p>
                    <div className="mt-4 flex justify-center">
                      <Button variant="primary" asChild>
                        <Link href="/study-plan">Go to study plan</Link>
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </Card>

            <Card className="rounded-ds-2xl p-6 space-y-4">
              <h2 className="font-slab text-h4">Summary</h2>
              <dl className="space-y-3 text-small">
                <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
                  <dt className="text-muted-foreground">Current streak</dt>
                  <dd className="font-semibold">{streak.currentStreak} days</dd>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
                  <dt className="text-muted-foreground">Longest streak</dt>
                  <dd className="font-semibold">{streak.longestStreak} days</dd>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
                  <dt className="text-muted-foreground">Last activity</dt>
                  <dd className="font-semibold">{formatDisplayDate(streak.lastActivityDate)}</dd>
                </div>
              </dl>
              <div className="rounded-xl bg-muted/60 px-4 py-3 text-small text-muted-foreground">
                <h3 className="font-semibold text-foreground">How your streak works</h3>
                <ul className="mt-2 list-disc space-y-2 pl-4">
                  <li>Complete at least one scheduled study task before midnight Pakistan time (PKT) each day.</li>
                  <li>Every productive day extends your streak and fills the heatmap for that date.</li>
                  <li>Missing a day resets your current streak, but your longest streak stays recorded for motivation.</li>
                </ul>
              </div>
              <div className="pt-4">
                <Button variant="primary" fullWidth asChild>
                  <Link href="/study-plan">Go to study plan</Link>
                </Button>
              </div>
            </Card>
          </div>
        </Container>
      </section>
    </StreakProvider>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);
  const user = await getServerUser(ctx.req, ctx.res);

  if (!user?.id) {
    const next = encodeURIComponent(ctx.resolvedUrl ?? '/account/progress/streak');
    return {
      redirect: {
        destination: `/auth/login?next=${next}`,
        permanent: false,
      },
    };
  }

  const streak = await getServerStreakPayload(ctx.req, ctx.res, user.id, supabase);

  return {
    props: {
      streak,
      streakInitial: streak.currentStreak,
    },
  };
};

export default StreakPage;
