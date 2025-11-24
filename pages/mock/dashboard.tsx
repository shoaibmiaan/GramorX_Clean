// pages/mock/dashboard.tsx
import * as React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

type ListeningMockSummary = {
  ok: true;
  lastBand: number | null;
  bestBand: number | null;
  mocksTaken: number;
  latestAttemptId: string | null;
  targetBand: number | null;
};

const MockDashboardPage: NextPage = () => {
  const [listening, setListening] = React.useState<ListeningMockSummary | null>(
    null
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/mock/listening/summary');
        const json = (await res.json()) as ListeningMockSummary | { ok: false; error: string };

        if (cancelled) return;

        if (!json || (json as any).ok === false) {
          setError(
            (json as any).error || 'Could not load listening mock summary.'
          );
          setListening(null);
        } else {
          setListening(json as ListeningMockSummary);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError('Failed to load mock dashboard data.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const lastBand = listening?.lastBand ?? null;
  const bestBand = listening?.bestBand ?? null;
  const mocksTaken = listening?.mocksTaken ?? 0;
  const targetBand = listening?.targetBand ?? null;
  const latestAttemptId = listening?.latestAttemptId ?? null;

  // Simple gap calc
  const bandGap =
    lastBand != null && targetBand != null ? targetBand - lastBand : null;

  return (
    <>
      <Head>
        <title>Mock Dashboard • GramorX</title>
        <meta
          name="description"
          content="Overview of your full IELTS mock results and band targets."
        />
      </Head>
      <main className="min-h-screen bg-background py-8">
        <Container>
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon name="Gauge" size={18} />
              </span>
              <div>
                <h1 className="font-slab text-h3">Mock Exam Dashboard</h1>
                <p className="text-xs text-muted-foreground">
                  Only serious attempts. Bands, trends and how far you are from
                  your target.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 text-right">
              <Badge tone="info" size="sm">
                Listening • Reading • Writing (coming next)
              </Badge>
              <p className="text-[11px] text-muted-foreground">
                This view focuses only on full exam mocks, not light practice.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.5fr)]">
            {/* LEFT: Listening block */}
            <Card className="rounded-ds-3xl p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Icon name="Headphones" size={16} />
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                      Listening mocks
                    </p>
                    <h2 className="font-slab text-h5">IELTS Listening</h2>
                  </div>
                </div>
                {mocksTaken > 0 && (
                  <Badge tone="neutral" size="sm">
                    {mocksTaken} mock{mocksTaken === 1 ? '' : 's'} taken
                  </Badge>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {/* Last band */}
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Last mock band
                  </p>
                  <p className="text-2xl font-semibold">
                    {lastBand != null ? lastBand.toFixed(1) : '–'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Most recent full Listening mock.
                  </p>
                </div>

                {/* Best band */}
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Best mock band
                  </p>
                  <p className="text-2xl font-semibold">
                    {bestBand != null ? bestBand.toFixed(1) : '–'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Highest band you&apos;ve hit so far.
                  </p>
                </div>

                {/* Target gap */}
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    Target vs now
                  </p>
                  <p className="text-2xl font-semibold">
                    {targetBand != null ? targetBand.toFixed(1) : '–'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {bandGap != null
                      ? bandGap > 0
                        ? `${bandGap.toFixed(1)} bands to climb.`
                        : bandGap < 0
                        ? `You’re already ${
                            Math.abs(bandGap).toFixed(1)
                          } above target.`
                        : 'You are exactly on target.'
                      : 'Target band comes from your profile.'}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Icon name="Info" size={13} />
                  <span>
                    Dashboard uses only full-mock attempts from the Listening
                    CBE flow.
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    asChild
                    size="sm"
                    variant="primary"
                    className="rounded-ds-2xl"
                  >
                    <Link href="/mock/listening/overview">
                      Start new Listening Mock
                    </Link>
                  </Button>
                  {latestAttemptId && (
                    <Button
                      asChild
                      size="sm"
                      variant="secondary"
                      className="rounded-ds-2xl"
                    >
                      <Link
                        href={`/mock/listening/submitted?attemptId=${encodeURIComponent(
                          latestAttemptId
                        )}`}
                      >
                        View last result
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              {loading && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Loading your listening stats...
                </p>
              )}
              {error && !loading && (
                <p className="mt-3 text-[11px] text-red-500">{error}</p>
              )}
              {!loading && !error && !mocksTaken && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  No listening mocks yet. Take your first full mock to unlock
                  this dashboard.
                </p>
              )}
            </Card>

            {/* RIGHT: placeholder for other modules / overall target */}
            <div className="space-y-4">
              <Card className="rounded-ds-3xl p-5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  Overall mock plan
                </p>
                <h2 className="mt-1 font-slab text-h5">
                  Full exam band roadmap
                </h2>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  This dashboard will aggregate Listening, Reading, Writing and
                  Speaking mocks. Right now you&apos;re seeing only Listening,
                  wired to real attempts.
                </p>
                <ul className="mt-3 space-y-1.5 text-[11px] text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Icon name="Dot" size={12} />
                    <span>Lock in consistent Listening band with 3–5 mocks.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Dot" size={12} />
                    <span>
                      Then stack in Reading + Writing mocks for full exam
                      simulation.
                    </span>
                  </li>
                </ul>
              </Card>

              <Card className="rounded-ds-3xl border-dashed p-4 text-[11px] text-muted-foreground">
                <p className="mb-1 font-medium text-foreground">Dev notes</p>
                <p>
                  Reading + Writing mock blocks can plug into this layout later
                  using their own summary APIs. For now, Listening is fully
                  production-wired.
                </p>
              </Card>
            </div>
          </div>
        </Container>
      </main>
    </>
  );
};

export default MockDashboardPage;
