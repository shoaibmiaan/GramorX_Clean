// pages/mock/index.tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';
import { track } from '@/lib/analytics/track';
import { getServerClient } from '@/lib/supabaseServer';

const MODULES = [
  {
    key: 'full',
    title: 'Full IELTS Mock',
    description: 'All 4 modules in one strict CBE-style exam.',
    icon: 'Target',
    href: '/mock/full',
    badge: 'All modules',
  },
  {
    key: 'listening',
    title: 'Listening Mocks',
    description: 'Timed audio, section-wise questions, auto scoring.',
    icon: 'Headphones',
    href: '/mock/listening',
    badge: 'Module',
  },
  {
    key: 'reading',
    title: 'Reading Mocks',
    description: '40-question passages with instant band estimate.',
    icon: 'BookOpen',
    href: '/mock/reading',
    badge: 'Module',
  },
  {
    key: 'writing',
    title: 'Writing Mocks',
    description: 'Task 1 + Task 2 with AI structure & band feedback.',
    icon: 'PenSquare',
    href: '/mock/writing',
    badge: 'Module',
  },
  {
    key: 'speaking',
    title: 'Speaking Mocks',
    description: 'NRQ-style interview flow with follow-ups.',
    icon: 'Mic',
    href: '/mock/speaking',
    badge: 'Module',
  },
];

type MockHomeStats = {
  lastBandScore: number | null;
  bestBandScore: number | null;
  attemptsCount: number;
};

type Props = {
  candidateId: string;
  stats: MockHomeStats | null; // allow null just in case
};

const MockHomePage: NextPage<Props> = ({ candidateId, stats }) => {
  // ✅ hard fallback so UI never explodes if stats is missing
  const safeStats: MockHomeStats = stats ?? {
    lastBandScore: null,
    bestBandScore: null,
    attemptsCount: 0,
  };

  const handleOpen = (slug: string, skill: string) => {
    track('mock_test_open', { slug, skill });
  };

  return (
    <>
      <Head>
        <title>Mock Tests • IELTS (Full + Modules)</title>
        <meta
          name="description"
          content="Serious IELTS mock tests in strict exam mode – full + module-wise with band analytics."
        />
      </Head>

      <main className="bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
        <section className="py-8 lg:py-10 min-h-[calc(100vh-4rem)] flex items-stretch">
          <Container className="flex-1">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] items-stretch">
              {/* LEFT: Hero + candidate + quick snapshot */}
              <div className="flex flex-col gap-4">
                {/* Hero */}
                <Card className="flex-1 flex flex-col justify-between gap-4 bg-white/80 dark:bg-dark/80 backdrop-blur">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <Badge tone="info" size="sm">
                        IELTS Mock Control Center
                      </Badge>
                      <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                        Full &amp; Module-Wise IELTS Mock Tests
                      </h1>
                      <p className="text-sm md:text-base text-muted-foreground max-w-xl">
                        Strict exam-style mocks with autosave, band estimates, and post-test analytics.
                        No fluff – just real exam rehearsal.
                      </p>
                    </div>
                    <Icon name="AlarmClock" className="h-10 w-10 text-primary hidden sm:block" />
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <Link href="/mock/full" legacyBehavior>
                      <Button
                        as="a"
                        size="md"
                        onClick={() => handleOpen('full-ielts-mock', 'full')}
                      >
                        <Icon name="Target" className="mr-2 h-4 w-4" />
                        Start Full Mock
                      </Button>
                    </Link>

                    <a
                      href="#mock-modules"
                      className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Icon name="Grid3X3" className="mr-1.5 h-4 w-4" />
                      Browse module-wise mocks
                    </a>
                  </div>
                </Card>

                {/* Candidate + Snapshot */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Candidate identity */}
                  <Card className="flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Candidate ID
                      </span>
                      <Badge tone="neutral" size="xs">
                        Stable ID
                      </Badge>
                    </div>

                    <button
                      type="button"
                      // TODO: router.push('/account/profile')
                      className="text-left group"
                    >
                      <p className="text-lg font-semibold tracking-[0.08em] group-hover:text-primary transition-colors">
                        {candidateId}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        This is your main identity reference in all mock reports and analytics.
                      </p>
                      <span className="mt-2 inline-flex items-center text-xs text-primary group-hover:underline">
                        View profile &amp; mock history
                        <Icon name="ArrowRight" className="ml-1 h-3 w-3" />
                      </span>
                    </button>
                  </Card>

                  {/* Quick stats */}
                  <Card className="grid grid-cols-3 gap-3 items-center">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Last band
                      </p>
                      <p className="text-lg font-semibold">
                        {safeStats.lastBandScore != null
                          ? safeStats.lastBandScore.toFixed(1)
                          : '–'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Best band
                      </p>
                      <p className="text-lg font-semibold">
                        {safeStats.bestBandScore != null
                          ? safeStats.bestBandScore.toFixed(1)
                          : '–'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Attempts
                      </p>
                      <p className="text-lg font-semibold">
                        {safeStats.attemptsCount > 0 ? safeStats.attemptsCount : 0}
                      </p>
                    </div>
                  </Card>
                </div>
              </div>

              {/* RIGHT: Modules + navigation */}
              <div className="flex flex-col gap-4">
                <Card id="mock-modules" className="flex-1 flex flex-col gap-3">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Mock modules
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Pick a module or run a full exam.
                      </p>
                    </div>
                    <Badge tone="success" size="xs">
                      Exam-ready
                    </Badge>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {MODULES.map((mod) => (
                      <Link key={mod.key} href={mod.href} legacyBehavior>
                        <a
                          onClick={() => handleOpen(mod.key, mod.key)}
                          className="group rounded-lg border border-border/70 bg-white/80 dark:bg-dark/80 px-3 py-3 flex items-start gap-3 hover:border-primary/70 hover:shadow-sm transition-colors"
                        >
                          <div className="mt-0.5">
                            <Icon
                              name={mod.icon}
                              className="h-5 w-5 text-muted-foreground group-hover:text-primary"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-sm font-semibold truncate">{mod.title}</h3>
                              <Badge tone="neutral" size="xs">
                                {mod.badge}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                              {mod.description}
                            </p>
                          </div>
                        </a>
                      </Link>
                    ))}
                  </div>
                </Card>

                <Card className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Icon name="History" className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Attempts &amp; analytics</p>
                      <p className="text-[11px] text-muted-foreground">
                        Review past mocks, breakdowns, and weak areas.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/mock/attempts" legacyBehavior>
                      <Button as="a" size="xs" variant="ghost">
                        Attempts
                      </Button>
                    </Link>
                    <Link href="/mock/analytics" legacyBehavior>
                      <Button as="a" size="xs">
                        Analytics
                      </Button>
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </Container>
        </section>
      </main>
    </>
  );
};

export default MockHomePage;

export const getServerSideProps: GetServerSideProps<Props> = async ({ req, res }) => {
  const supabase = getServerClient(req, res);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: '/login?next=/mock',
        permanent: false,
      },
    };
  }

  // base defaults
  let stats: MockHomeStats = {
    lastBandScore: null,
    bestBandScore: null,
    attemptsCount: 0,
  };

  // 🔧 change this to your real table / columns
  const { data: attempts, error } = await supabase
    .from('attempts_listening')
    .select('band_score, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (!error && attempts && attempts.length > 0) {
    type Row = { band_score: number | null; created_at: string };
    const rows = attempts as Row[];

    const lastBandScore = rows[0]?.band_score ?? null;

    const bestBandScore =
      rows.reduce<number | null>((max, row) => {
        if (row.band_score == null) return max;
        if (max == null) return row.band_score;
        return row.band_score > max ? row.band_score : max;
      }, null) ?? null;

    stats = {
      lastBandScore,
      bestBandScore,
      attemptsCount: rows.length,
    };
  }

  const candidateId = `GX-2025-${String(user.id).slice(0, 8).toUpperCase()}`;

  return {
    props: {
      candidateId,
      stats,
    },
  };
};
