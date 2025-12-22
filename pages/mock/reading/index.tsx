// pages/mock/reading/index.tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';

import { ReadingForecastPanel } from '@/components/reading/ReadingForecastPanel';
import { AISummaryCard } from '@/components/reading/AISummaryCard';
import { DailyChallengeBanner } from '@/components/reading/daily/DailyChallengeBanner';
import { BandPredictorCard } from '@/components/reading/analytics/BandPredictorCard';

import type { ReadingAttemptSummary } from '@/lib/reading/bandPredictor';
import { computeDailyStreak } from '@/lib/reading/streak';

// ------------------------------------------------------------------------------------
// TYPES
// ------------------------------------------------------------------------------------

type ReadingMockListItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  examType: string;
  difficulty: string | null;
  totalQuestions: number;
  totalPassages: number;
  durationSeconds: number;
  tags: string[];
};

type TestAttemptInfo = {
  latestBandScore: number | null;
  latestCreatedAt: string | null;
};

type ReadingStats = {
  totalAttempts: number;
  totalTestsAttempted: number;
  bestBand: number | null;
  avgBand: number | null;
  lastAttemptAt: string | null;
};

type PageProps = {
  tests: ReadingMockListItem[];
  attemptSummaries: ReadingAttemptSummary[];
  streakCurrent: number;
  stats: ReadingStats;
  attemptMap: Record<string, TestAttemptInfo>;
  error?: string;
};

// ------------------------------------------------------------------------------------

const ReadingMockIndexPage: NextPage<PageProps> = ({
  tests,
  attemptSummaries,
  streakCurrent,
  stats,
  attemptMap,
  error,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedDifficulty, setSelectedDifficulty] = React.useState('all');
  const [selectedType, setSelectedType] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'attempted' | 'not_attempted'>(
    'all',
  );

  if (error) {
    return (
      <>
        <Head>
          <title>Error · Reading Mocks · GramorX</title>
        </Head>
        <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 pb-20">
          <Container className="py-14">
            <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-ds-xl bg-danger/15 text-danger">
                  <Icon name="TriangleAlert" size={18} />
                </div>
                <div>
                  <h1 className="font-slab text-h3 text-foreground">Couldn’t load Reading mocks</h1>
                  <p className="mt-1 text-small text-muted-foreground">{error}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild variant="primary" className="rounded-ds-2xl">
                      <Link href="/mock">Back to Mock hub</Link>
                    </Button>
                    <Button asChild variant="secondary" className="rounded-ds-2xl">
                      <Link href="/mock/reading">Retry</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  const featuredTest = tests[0];

  const safeDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString() : '—');

  const filteredTests = tests.filter((t) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      (t.description ? t.description.toLowerCase().includes(q) : false);

    const matchesDifficulty =
      selectedDifficulty === 'all'
        ? true
        : (t.difficulty ?? '').toLowerCase() === selectedDifficulty;

    const matchesType = selectedType === 'all' ? true : t.examType === selectedType;

    const hasAttempt = Boolean(attemptMap[t.slug]?.latestCreatedAt);
    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'attempted'
          ? hasAttempt
          : !hasAttempt;

    return matchesSearch && matchesDifficulty && matchesType && matchesStatus;
  });

  const getDifficultyLabelTone = (difficulty: string | null) => {
    const d = difficulty?.toLowerCase();
    if (!d) return { label: 'Mixed', tone: 'neutral' as const };

    if (d === 'easy') return { label: 'Easy', tone: 'success' as const };
    if (d === 'medium') return { label: 'Standard', tone: 'info' as const };
    if (d === 'hard') return { label: 'Hard', tone: 'accent' as const };

    return { label: difficulty, tone: 'neutral' as const };
  };

  return (
    <>
      <Head>
        <title>Reading Mock Command Center · GramorX</title>
        <meta
          name="description"
          content="IELTS-style Reading mocks with three passages, strict timing, AI summaries, band prediction, and analytics."
        />
      </Head>

      <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 pb-20">
        {/* ------------------------------------------------------------- */}
        {/* HERO */}
        {/* ------------------------------------------------------------- */}
        <section className="pb-10 pt-10 md:pt-14">
          <Container>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-center">
              {/* Left */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    IELTS Reading · Full mocks
                  </p>
                  <h1 className="font-slab text-h1 leading-tight text-foreground">
                    Reading Mock Command Center
                  </h1>
                  <p className="max-w-[58ch] text-small text-grayish">
                    Full-length Reading mocks, strict exam-room vibes, and smart analytics so you stop
                    guessing and start improving.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild variant="primary" size="lg" className="rounded-ds-2xl px-6">
                    <Link href={featuredTest ? `/mock/reading/${featuredTest.slug}` : '/mock/reading'}>
                      <Icon name="Play" size={18} className="mr-2" />
                      Start a mock
                    </Link>
                  </Button>

                  <Button asChild variant="secondary" size="lg" className="rounded-ds-2xl px-6">
                    <Link href="/mock">
                      <Icon name="Timer" size={18} className="mr-2" />
                      Back to Mock hub
                    </Link>
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-4 text-caption text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="Fire" size={14} />
                    Streak: {streakCurrent || 0} day{streakCurrent === 1 ? '' : 's'}
                  </span>
                  <span>•</span>
                  <span>
                    Attempts logged:{' '}
                    <span className="font-semibold text-foreground">{stats.totalAttempts}</span>
                  </span>
                  {stats.bestBand != null && (
                    <>
                      <span>•</span>
                      <span>
                        Best band:{' '}
                        <span className="font-semibold text-foreground">{stats.bestBand}</span>
                      </span>
                    </>
                  )}
                  {stats.lastAttemptAt && (
                    <>
                      <span>•</span>
                      <span>
                        Last attempt:{' '}
                        <span className="font-semibold text-foreground">
                          {safeDate(stats.lastAttemptAt)}
                        </span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right: quick stats */}
              <div className="space-y-4">
                <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Snapshot
                      </p>
                      <p className="text-small text-grayish">Your reading momentum, at a glance.</p>
                    </div>

                    <Badge variant="neutral" size="sm" className="rounded-ds-full">
                      <Icon name="Shield" className="mr-1 h-3 w-3" />
                      Strict mode
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-caption text-muted-foreground">Best band</div>
                      <div className="flex items-center gap-1 text-small font-semibold text-foreground">
                        <Icon name="Trophy" className="h-4 w-4 text-primary" />
                        <span>{stats.bestBand ?? '--'}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Consistency beats lucky jumps.</p>
                    </div>

                    <div className="space-y-1">
                      <div className="text-caption text-muted-foreground">Recent avg band</div>
                      <div className="flex items-center gap-1 text-small font-semibold text-foreground">
                        <Icon name="Medal" className="h-4 w-4 text-primary" />
                        <span>{stats.avgBand ?? '--'}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Based on your recent attempts — retake underperforming mocks instead of shooting in
                        the dark.
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 border-l-2 border-primary/40 pl-3 text-small text-primary/90">
                    “One full mock per week plus light drills is enough to move the Reading band — if you
                    actually review your mistakes.”
                  </p>
                </Card>

                <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Next mock in queue
                      </p>
                      <p className="text-small text-grayish">
                        Start a fresh full-length Reading mock or retake a previous one.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-slab text-h3 leading-none">{featuredTest ? 'Ready' : 'Soon'}</p>
                      <p className="text-caption text-muted-foreground">
                        {featuredTest ? featuredTest.title : 'New mocks rolling out'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-caption text-muted-foreground">
                    <Badge variant="neutral" size="xs">
                      3 passages
                    </Badge>
                    <Badge variant="neutral" size="xs">
                      40 questions
                    </Badge>
                    <Badge variant="neutral" size="xs">
                      60 minutes
                    </Badge>
                    <Badge variant="neutral" size="xs">
                      Review workflow
                    </Badge>
                  </div>
                </Card>
              </div>
            </div>
          </Container>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* FILTERS */}
        {/* ------------------------------------------------------------- */}
        <section className="border-y border-border/60 bg-card/30 py-6">
          <Container>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
              {/* Search Bar */}
              <div className="relative">
                <Icon
                  name="Search"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="search"
                  placeholder="Search Reading mocks by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-ds-xl border border-border bg-background px-10 text-small text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <Icon name="X" className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="h-10 rounded-ds-xl border border-border bg-background px-3 text-small text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="all">All difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Standard</option>
                    <option value="hard">Hard</option>
                  </select>

                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="h-10 rounded-ds-xl border border-border bg-background px-3 text-small text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="all">All types</option>
                    <option value="Academic">Academic</option>
                    <option value="General Training">General Training</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as 'all' | 'attempted' | 'not_attempted')
                    }
                    className="h-10 rounded-ds-xl border border-border bg-background px-3 text-small text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="all">All status</option>
                    <option value="attempted">Attempted</option>
                    <option value="not_attempted">Not attempted</option>
                  </select>
                </div>

                <div className="text-caption text-muted-foreground">
                  Showing <span className="font-semibold text-foreground">{filteredTests.length}</span> of{' '}
                  <span className="font-semibold text-foreground">{tests.length}</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* MAIN CONTENT */}
        {/* ------------------------------------------------------------- */}
        <Container className="py-6 px-4 md:px-0">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* LEFT COLUMN */}
            <div className="lg:col-span-2">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-slab text-h2 text-foreground">Reading Mock Library</h2>
                  <p className="text-small text-grayish">
                    {filteredTests.length} of {tests.length} full-length Reading mocks visible with current filters.
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <Badge variant="neutral" size="sm" className="rounded-ds-full">
                    <Icon name="CheckCircle" className="mr-1 h-3 w-3" />
                    {stats.totalTestsAttempted} tests attempted
                  </Badge>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* DRILLS STRIP */}
              {/* ------------------------------------------------------------- */}
              <div className="mb-6 grid gap-4 sm:grid-cols-3">
                {/* Speed Drill */}
                <Link href="/mock/reading/drill/speed" className="group block focus:outline-none">
                  <Card className="h-full rounded-ds-2xl border border-border/60 bg-card/80 p-5 transition hover:-translate-y-[1px] hover:border-primary/30 hover:shadow-soft focus-visible:ring-2 focus-visible:ring-primary/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="success" size="xs" className="rounded-ds-xl">
                            Live
                          </Badge>
                          <p className="text-small font-semibold text-foreground">Speed Drill</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Timed sets to build pace, scanning, and exam-pressure control.
                        </p>
                      </div>

                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-ds-xl bg-primary/10 text-primary">
                        <Icon name="Zap" size={16} />
                      </div>
                    </div>

                    <div className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                      Start
                      <Icon
                        name="ArrowRight"
                        className="h-3 w-3 transition group-hover:translate-x-[1px]"
                      />
                    </div>
                  </Card>
                </Link>

                {/* Daily Drill */}
                <Link href="/mock/reading/daily" className="group block focus:outline-none">
                  <Card className="h-full rounded-ds-2xl border border-border/60 bg-card/80 p-5 transition hover:-translate-y-[1px] hover:border-primary/30 hover:shadow-soft focus-visible:ring-2 focus-visible:ring-primary/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="info" size="xs" className="rounded-ds-xl">
                            Daily
                          </Badge>
                          <p className="text-small font-semibold text-foreground">Daily Drill</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Lightweight daily practice for consistency + streak momentum.
                        </p>
                      </div>

                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-ds-xl bg-primary/10 text-primary">
                        <Icon name="Calendar" size={16} />
                      </div>
                    </div>

                    <div className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                      Open
                      <Icon
                        name="ArrowRight"
                        className="h-3 w-3 transition group-hover:translate-x-[1px]"
                      />
                    </div>
                  </Card>
                </Link>

                {/* Weekly Drill */}
                <Link href="/mock/reading/weekly" className="group block focus:outline-none">
                  <Card className="h-full rounded-ds-2xl border border-border/60 bg-card/80 p-5 transition hover:-translate-y-[1px] hover:border-primary/30 hover:shadow-soft focus-visible:ring-2 focus-visible:ring-primary/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="neutral" size="xs" className="rounded-ds-xl">
                            Weekly
                          </Badge>
                          <p className="text-small font-semibold text-foreground">Weekly Drill</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Longer session to build endurance without doing a full mock.
                        </p>
                      </div>

                      <div className="inline-flex h-8 w-8 items-center justify-center rounded-ds-xl bg-primary/10 text-primary">
                        <Icon name="Clock" size={16} />
                      </div>
                    </div>

                    <div className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                      Open
                      <Icon
                        name="ArrowRight"
                        className="h-3 w-3 transition group-hover:translate-x-[1px]"
                      />
                    </div>
                  </Card>
                </Link>
              </div>

              <div className="mb-4 flex justify-end">
                <Button asChild variant="ghost" className="rounded-ds-xl">
                  <Link href="/mock/reading/drill">
                    View all drills
                    <Icon name="ArrowRight" className="ml-2" size={16} />
                  </Link>
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {filteredTests.map((t) => {
                  const attempt = attemptMap[t.slug];
                  const hasAttempt = Boolean(attempt?.latestCreatedAt);
                  const difficultyMeta = getDifficultyLabelTone(t.difficulty);
                  const isFeatured = featuredTest?.slug === t.slug;

                  return (
                    <Link key={t.id} href={`/mock/reading/${t.slug}`} className="group block focus:outline-none">
                      <Card className="relative h-full rounded-ds-2xl border border-border/60 bg-card/80 p-5 transition hover:-translate-y-[1px] hover:border-primary/30 hover:shadow-soft focus-visible:ring-2 focus-visible:ring-primary/40">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant={hasAttempt ? 'success' : 'neutral'}
                                size="xs"
                                className="rounded-ds-xl"
                              >
                                {hasAttempt ? 'Attempted' : 'New'}
                              </Badge>

                              {t.difficulty && (
                                <Badge
                                  variant={
                                    difficultyMeta.tone === 'success'
                                      ? 'success'
                                      : difficultyMeta.tone === 'info'
                                        ? 'info'
                                        : difficultyMeta.tone === 'accent'
                                          ? 'accent'
                                          : 'neutral'
                                  }
                                  size="xs"
                                  className="rounded-ds-xl"
                                >
                                  {difficultyMeta.label}
                                </Badge>
                              )}

                              {isFeatured && (
                                <Badge
                                  variant="accent"
                                  size="xs"
                                  className="rounded-ds-xl inline-flex items-center gap-1"
                                >
                                  <Icon name="Sparkles" className="h-3 w-3" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="inline-flex h-8 w-8 items-center justify-center rounded-ds-xl bg-primary/10 text-primary">
                            <Icon name="BookOpen" size={16} />
                          </div>
                        </div>

                        <h3 className="mt-3 text-small font-semibold leading-snug line-clamp-2">{t.title}</h3>

                        {t.description && (
                          <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2">
                            {t.description}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Icon name="Layers" className="h-3 w-3" />
                            {t.totalPassages || 3} passages
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Icon name="ListChecks" className="h-3 w-3" />
                            {t.totalQuestions || 40} Qs
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Icon name="Clock" className="h-3 w-3" />
                            {Math.round((t.durationSeconds || 3600) / 60)} min
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-[11px] text-muted-foreground">
                            {hasAttempt ? (
                              <>
                                Last:{' '}
                                <span className="text-foreground">{safeDate(attempt?.latestCreatedAt ?? null)}</span>
                              </>
                            ) : (
                              <span>Start fresh</span>
                            )}
                          </div>

                          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                            Open
                            <Icon name="ArrowRight" className="h-3 w-3 transition group-hover:translate-x-[1px]" />
                          </div>
                        </div>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              {filteredTests.length === 0 && (
                <Card className="mt-6 rounded-ds-2xl border border-border/60 bg-card/80 p-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-ds-xl bg-warning/15 text-warning">
                      <Icon name="Search" size={18} />
                    </div>
                    <div>
                      <h3 className="font-slab text-h3 text-foreground">No mocks match your filters</h3>
                      <p className="mt-1 text-small text-muted-foreground">Clear search/filters and try again.</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          className="rounded-ds-2xl"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedDifficulty('all');
                            setSelectedType('all');
                            setStatusFilter('all');
                          }}
                        >
                          Reset filters
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div className="mt-8 lg:mt-0">
              <div className="sticky top-24 space-y-6">
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-caption font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    <span className="inline-block h-1.5 w-6 rounded-full bg-primary" />
                    Reading AI predictions
                  </h3>

                  <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-4">
                    <BandPredictorCard attemptSummaries={attemptSummaries} />
                  </Card>

                  <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-4">
                    <ReadingForecastPanel attemptSummaries={attemptSummaries} />
                  </Card>
                </div>

                <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-4">
                  <DailyChallengeBanner />
                </Card>

                <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-4">
                  <AISummaryCard />
                </Card>

                <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-slab text-h3 text-foreground">Quick links</h4>
                      <p className="mt-1 text-small text-muted-foreground">
                        Review, analytics, and challenges — all in one place.
                      </p>
                    </div>
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-ds-xl bg-primary/10 text-primary">
                      <Icon name="Compass" size={18} />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    <Link
                      href="/mock/reading/history"
                      className="flex items-center justify-between rounded-ds-xl border border-border/60 bg-background/40 px-3 py-2 text-small hover:border-primary/30"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon name="History" size={16} />
                        History
                      </span>
                      <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                    </Link>

                    <Link
                      href="/mock/reading/analytics"
                      className="flex items-center justify-between rounded-ds-xl border border-border/60 bg-background/40 px-3 py-2 text-small hover:border-primary/30"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon name="BarChart3" size={16} />
                        Analytics
                      </span>
                      <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                    </Link>

                    <Link
                      href="/mock/reading/challenges"
                      className="flex items-center justify-between rounded-ds-xl border border-border/60 bg-background/40 px-3 py-2 text-small hover:border-primary/30"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon name="Swords" size={16} />
                        Challenges
                      </span>
                      <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                    </Link>

                    {/* NEW: Daily Drill */}
                    <Link
                      href="/mock/reading/daily"
                      className="flex items-center justify-between rounded-ds-xl border border-border/60 bg-background/40 px-3 py-2 text-small hover:border-primary/30"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon name="Calendar" size={16} />
                        Daily Drill
                      </span>
                      <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                    </Link>

                    {/* NEW: Weekly Drill */}
                    <Link
                      href="/mock/reading/weekly"
                      className="flex items-center justify-between rounded-ds-xl border border-border/60 bg-background/40 px-3 py-2 text-small hover:border-primary/30"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon name="Clock" size={16} />
                        Weekly Drill
                      </span>
                      <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Container>
      </main>
    </>
  );
};

// ------------------------------------------------------------------------------------
// SSR
// ------------------------------------------------------------------------------------

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  try {
    const supabase = getServerClient<Database>(ctx.req, ctx.res);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        redirect: {
          destination: '/login?next=/mock/reading',
          permanent: false,
        },
      };
    }

    const [testsRes, attemptsRecentRes, attemptsCountRes, bestBandRes] = await Promise.all([
      supabase
        .from('reading_tests')
        .select(
          'id, slug, title, description, exam_type, difficulty, total_questions, total_passages, duration_seconds, tags',
        )
        .eq('is_active', true)
        .order('created_at', { ascending: false }),

      supabase
        .from('reading_attempts')
        .select('id, test_id, raw_score, band_score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200),

      supabase.from('reading_attempts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),

      supabase
        .from('reading_attempts')
        .select('band_score')
        .eq('user_id', user.id)
        .not('band_score', 'is', null)
        .order('band_score', { ascending: false })
        .limit(1),
    ]);

    const { data: testsRows, error: testsErr } = testsRes;
    if (testsErr) throw testsErr;

    const { data: attemptsRecent, error: attemptsRecentErr } = attemptsRecentRes;
    if (attemptsRecentErr) throw attemptsRecentErr;

    const { count: attemptsCount, error: attemptsCountErr } = attemptsCountRes;
    if (attemptsCountErr) throw attemptsCountErr;

    const { data: bestBandRow, error: bestBandErr } = bestBandRes;
    if (bestBandErr) throw bestBandErr;

    let attemptSummaries: ReadingAttemptSummary[] = [];
    let attemptMap: Record<string, TestAttemptInfo> = {};
    let streakCurrent = 0;

    const stats: ReadingStats = {
      totalAttempts: attemptsCount ?? 0,
      totalTestsAttempted: 0,
      bestBand: bestBandRow?.[0]?.band_score != null ? Number(bestBandRow[0].band_score) : null,
      avgBand: null, // computed from recent attempts below (last 200)
      lastAttemptAt: null,
    };

    const attempts = attemptsRecent ?? [];
    if (attempts.length > 0) stats.lastAttemptAt = attempts[0].created_at;

    attemptSummaries = attempts.map((a) => ({
      rawScore: Number(a.raw_score ?? 0),
      totalQuestions: 40,
      bandScore: a.band_score != null ? Number(a.band_score) : null,
      createdAt: a.created_at,
    }));

    const { currentStreak } = computeDailyStreak(attempts.map((a) => ({ date: a.created_at })));
    streakCurrent = currentStreak;

    // Avg band from recent attempts (max 200)
    const bands = attempts
      .map((a) => (a.band_score != null ? Number(a.band_score) : null))
      .filter((v): v is number => typeof v === 'number');

    if (bands.length > 0) {
      const avg = bands.reduce((acc, v) => acc + v, 0) / bands.length;
      stats.avgBand = Math.round((avg + Number.EPSILON) * 10) / 10;
    }

    const mapByTestId: Record<string, TestAttemptInfo> = {};
    for (const a of attempts) {
      if (!mapByTestId[a.test_id]) {
        mapByTestId[a.test_id] = {
          latestBandScore: a.band_score != null ? Number(a.band_score) : null,
          latestCreatedAt: a.created_at,
        };
      }
    }

    stats.totalTestsAttempted = Object.keys(mapByTestId).length;

    const testSlugMap = Object.fromEntries((testsRows ?? []).map((t) => [t.id, t.slug]));

    const finalMap: Record<string, TestAttemptInfo> = {};
    Object.entries(mapByTestId).forEach(([testId, info]) => {
      const slug = testSlugMap[testId];
      if (slug) finalMap[slug] = info;
    });

    attemptMap = finalMap;

    const tests: ReadingMockListItem[] =
      testsRows?.map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        description: t.description ?? null,
        examType: t.exam_type ?? 'Academic',
        difficulty: t.difficulty ?? null,
        totalQuestions: t.total_questions ?? 40,
        totalPassages: t.total_passages ?? 3,
        durationSeconds: t.duration_seconds ?? 3600,
        tags: t.tags ?? [],
      })) ?? [];

    return {
      props: {
        tests,
        attemptSummaries,
        streakCurrent,
        stats,
        attemptMap,
      },
    };
  } catch (err: any) {
    console.error('Failed to load Reading mocks', err);
    return {
      props: {
        tests: [],
        attemptSummaries: [],
        streakCurrent: 0,
        stats: {
          totalAttempts: 0,
          totalTestsAttempted: 0,
          bestBand: null,
          avgBand: null,
          lastAttemptAt: null,
        },
        attemptMap: {},
        error: err?.message ?? 'Failed to load Reading mocks.',
      },
    };
  }
};

export default ReadingMockIndexPage;
