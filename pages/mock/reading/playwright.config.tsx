// pages/mock/reading/index.tsx
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
import { readingPracticeList } from '@/data/reading';

type ReadingMockTest = {
  slug: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  passages: number;
  questions: number;
  durationMinutes: number;
  lastAttemptedAt?: string | null;
  isNew?: boolean;
  isRecommended?: boolean;
};

type MockStats = {
  totalAttempts: number;
  bestBand: number | null;
  lastBand: number | null;
};

type MockReadingIndexProps = {
  candidateId: string | null;
  tests: ReadingMockTest[];
  stats: MockStats;
};

const DEFAULT_STATS: MockStats = {
  totalAttempts: 0,
  bestBand: null,
  lastBand: null,
};

const MockReadingIndexPage: NextPage<MockReadingIndexProps> = ({ candidateId, tests, stats }) => {
  const { totalAttempts, bestBand, lastBand } = stats;
  const primaryTestSlug = tests[0]?.slug ?? null;
  const hasTests = tests.length > 0;

  const handleStartNew = () => {
    track('mock_reading_start_new', {});
  };

  const handleResume = () => {
    track('mock_reading_resume_click', {});
  };

  const handleHistory = () => {
    track('mock_reading_history_open', {});
  };

  const handleOpenTest = (slug: string) => {
    track('mock_reading_open_test', { slug });
  };

  return (
    <>
      <Head>
        <title>IELTS Reading Mocks • GramorX</title>
        <meta
          name="description"
          content="Strict IELTS Reading mock tests with real exam timing, passages, and analytics."
        />
      </Head>

      <section className="min-h-screen bg-lightBg dark:bg-dark/90">
        <Container className="flex flex-col gap-6 py-6 lg:py-8">
          {/* Hero + stats only, no noisy top bar */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
                IELTS Reading mocks. Exam-room strict.
              </h1>

              <p className="max-w-xl text-sm lg:text-[15px] text-muted-foreground">
                Three passages, 40 questions, 60 minutes. Strict timing, auto-save, and post-test analytics tuned for
                real IELTS Reading.
              </p>

              {candidateId && (
                <p className="text-[11px] text-muted-foreground">
                  Signed in as{' '}
                  <span className="font-mono font-semibold text-foreground">
                    {candidateId}
                  </span>
                  .
                </p>
              )}
            </div>

            {/* Compact stats */}
            <div className="flex flex-row gap-2 text-xs lg:flex-col lg:gap-3 lg:text-sm">
              <StatPill
                label="Total attempts"
                value={totalAttempts > 0 ? totalAttempts.toString() : '—'}
                icon="Activity"
              />
              <StatPill
                label="Best band"
                value={bestBand != null ? bestBand.toFixed(1) : '—'}
                icon="Star"
              />
              <StatPill
                label="Last band"
                value={lastBand != null ? lastBand.toFixed(1) : '—'}
                icon="Clock"
              />
            </div>
          </div>

          {/* Quick actions – minimal */}
          <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
            <Button
              size="sm"
              className="inline-flex flex-1 items-center justify-center gap-2 sm:w-auto sm:flex-none"
              onClick={handleStartNew}
              asChild
            >
              <Link
                href={
                  primaryTestSlug
                    ? `/mock/reading/${encodeURIComponent(primaryTestSlug)}`
                    : '/mock/reading'
                }
              >
                <Icon name="Play" size={16} />
                <span>{hasTests ? 'Start new Reading mock' : 'Reading mocks coming soon'}</span>
              </Link>
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="inline-flex flex-1 items-center justify-center gap-2 sm:w-auto sm:flex-none"
              onClick={handleResume}
              disabled
            >
              <Icon name="RotateCcw" size={16} />
              <span>Resume active attempt</span>
              <Badge tone="neutral" size="xs" className="uppercase tracking-wide">
                None
              </Badge>
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="inline-flex flex-1 items-center justify-center gap-2 sm:w-auto sm:flex-none"
              onClick={handleHistory}
              asChild
            >
              <Link href="/mock/reading/history">
                <Icon name="BarChart3" size={16} />
                <span>Reading history</span>
              </Link>
            </Button>
          </div>

          {/* Tests grid / empty-state */}
          {hasTests ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:gap-4">
              {tests.map((test) => (
                <Card
                  key={test.slug}
                  className="flex flex-col justify-between border border-border/80 bg-background/80 transition-all hover:border-primary/60 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <h2 className="text-sm font-semibold text-foreground lg:text-[15px] line-clamp-2">
                          {test.title}
                        </h2>

                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Icon name="Layers" size={12} />
                            <span>{test.passages} passages</span>
                          </span>
                          <span className="h-3 w-px bg-border/60" />
                          <span className="inline-flex items-center gap-1">
                            <Icon name="ListOrdered" size={12} />
                            <span>{test.questions} questions</span>
                          </span>
                          <span className="h-3 w-px bg-border/60" />
                          <span className="inline-flex items-center gap-1">
                            <Icon name="Timer" size={12} />
                            <span>{test.durationMinutes} min</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <Badge tone={mapDifficultyTone(test.difficulty)} size="xs">
                          {test.difficulty}
                        </Badge>

                        {(test.isRecommended || test.isNew) && (
                          <div className="flex flex-wrap justify-end gap-1">
                            {test.isRecommended && (
                              <Badge tone="success" size="xxs">
                                Recommended
                              </Badge>
                            )}
                            {test.isNew && (
                              <Badge tone="info" size="xxs">
                                New
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="inline-flex items-center gap-1">
                        <Icon name="Target" size={12} />
                        <span>Academic Reading</span>
                      </div>

                      <div className="inline-flex items-center gap-1 opacity-80">
                        <Icon name="History" size={12} />
                        <span>
                          {test.lastAttemptedAt
                            ? `Last attempted: ${test.lastAttemptedAt}`
                            : 'Not attempted yet'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/70 px-4 py-3">
                    <span className="text-[11px] text-muted-foreground">
                      Strict exam mode • Auto-save
                    </span>

                    <Button
                      size="xs"
                      className="inline-flex items-center gap-1"
                      onClick={() => handleOpenTest(test.slug)}
                      asChild
                    >
                      <Link href={`/mock/reading/${encodeURIComponent(test.slug)}`}>
                        <span>Start</span>
                        <Icon name="ChevronRight" size={14} />
                      </Link>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="mt-2 border-dashed border-border/70 bg-background/80">
              <div className="flex flex-col gap-2 px-4 py-6 text-center text-sm text-muted-foreground">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Icon name="Inbox" size={18} />
                </div>
                <p className="font-medium text-foreground">No Reading mocks yet</p>
                <p className="text-xs text-muted-foreground">
                  We&apos;re setting up your Reading test bank. Check back soon for strict, exam-style mocks.
                </p>
              </div>
            </Card>
          )}
        </Container>
      </section>
    </>
  );
};

type StatPillProps = {
  label: string;
  value: string;
  icon: string;
};

const StatPill: React.FC<StatPillProps> = ({ label, value, icon }) => {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5">
      <Icon name={icon} size={14} className="text-muted-foreground" />
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold text-foreground">{value}</span>
      </div>
    </div>
  );
};

function mapDifficultyTone(
  difficulty: ReadingMockTest['difficulty']
): React.ComponentProps<typeof Badge>['tone'] {
  switch (difficulty) {
    case 'Easy':
      return 'success';
    case 'Medium':
      return 'warning';
    case 'Hard':
      return 'danger';
    default:
      return 'neutral';
  }
}

export const getServerSideProps: GetServerSideProps<MockReadingIndexProps> = async ({ req, res }) => {
  const supabase = getServerClient(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rawId = user?.id ?? null;
  const year = new Date().getFullYear();
  const candidateId = rawId ? `GX-${year}-${rawId.slice(0, 8).toUpperCase()}` : null;

  const tests: ReadingMockTest[] = readingPracticeList.map((paper, index) => ({
    slug: paper.id,
    title: paper.title,
    difficulty: 'Medium', // TODO: map from paper.level/difficulty if you add it
    passages: paper.passages,
    questions: paper.totalQuestions,
    durationMinutes: Math.round(paper.durationSec / 60),
    lastAttemptedAt: null,
    isRecommended: index === 0,
    isNew: false,
  }));

  return {
    props: {
      candidateId,
      tests,
      stats: DEFAULT_STATS,
    },
  };
};

export default MockReadingIndexPage;
