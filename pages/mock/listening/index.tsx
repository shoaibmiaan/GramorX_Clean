// pages/mock/listening/index.tsx
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
// TODO: adjust this import to whatever you actually use for listening tests
import { listeningPracticeList } from '@/data/listening';

type ListeningMockTest = {
  slug: string;
  title: string;
  sections: number;
  questions: number;
  durationMinutes: number;
  lastAttemptedAt?: string | null;
  isNew?: boolean;
  isRecommended?: boolean;
};

type ListeningStats = {
  totalAttempts: number;
  lastBand: number | null;
  bestBand: number | null;
};

type ListeningIndexProps = {
  tests: ListeningMockTest[];
  stats: ListeningStats;
};

const DEFAULT_STATS: ListeningStats = {
  totalAttempts: 0,
  lastBand: null,
  bestBand: null,
};

const ListeningMocksIndexPage: NextPage<ListeningIndexProps> = ({ tests, stats }) => {
  const { totalAttempts, lastBand, bestBand } = stats;
  const primaryTestSlug = tests[0]?.slug ?? null;
  const hasTests = tests.length > 0;

  const handleStartNew = () => {
    track('mock_listening_start_new', {});
  };

  const handleResume = () => {
    track('mock_listening_resume_click', {});
  };

  const handleHistory = () => {
    track('mock_listening_history_open', {});
  };

  const handleOpenTest = (slug: string) => {
    track('mock_listening_open_test', { slug });
  };

  return (
    <>
      <Head>
        <title>IELTS Listening Mocks • GramorX</title>
        <meta
          name="description"
          content="Strict IELTS Listening mock tests with real exam timing, sections, and analytics."
        />
      </Head>

      <section className="min-h-screen bg-lightBg dark:bg-dark/90">
        <Container className="flex flex-col gap-6 py-6 lg:py-8">
          {/* Hero + stats (minimal, no noisy top bar) */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground">
                IELTS Listening mocks. Exam-room strict.
              </h1>

              <p className="max-w-xl text-sm lg:text-[15px] text-muted-foreground">
                Four sections, 40 questions, strict timing, and auto-save — tuned to simulate real IELTS Listening,
                not YouTube practice.
              </p>
            </div>

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

          {/* Quick actions – same pattern as Reading */}
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
                    ? `/mock/listening/${encodeURIComponent(primaryTestSlug)}`
                    : '/mock/listening'
                }
              >
                <Icon name="Play" size={16} />
                <span>{hasTests ? 'Start new Listening mock' : 'Listening mocks coming soon'}</span>
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
              <Link href="/mock/listening/history">
                <Icon name="BarChart3" size={16} />
                <span>Listening history</span>
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
                            <span>{test.sections} sections</span>
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
                        {test.isRecommended && (
                          <Badge tone="success" size="xs">
                            Recommended
                          </Badge>
                        )}
                        {test.isNew && (
                          <Badge tone="info" size="xs">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="inline-flex items-center gap-1">
                        <Icon name="Headphones" size={12} />
                        <span>Academic / General Listening</span>
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
                      <Link href={`/mock/listening/${encodeURIComponent(test.slug)}`}>
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
                <p className="font-medium text-foreground">No Listening mocks yet</p>
                <p className="text-xs text-muted-foreground">
                  We&apos;re setting up your Listening test bank. Check back soon for strict, exam-style mocks.
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

export const getServerSideProps: GetServerSideProps<ListeningIndexProps> = async ({ req, res }) => {
  const supabase = getServerClient(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // TODO: replace with real stats from your listening attempts table
  const stats: ListeningStats = DEFAULT_STATS;

  // TODO: if you already pull tests from Supabase, replace this mapping with that
  const tests: ListeningMockTest[] = listeningPracticeList.map((test, index) => ({
    slug: test.id,
    title: test.title,
    sections: test.sections ?? 4,
    questions: test.totalQuestions ?? 40,
    durationMinutes: Math.round((test.durationSec ?? 1800) / 60),
    lastAttemptedAt: null,
    isRecommended: index === 0,
    isNew: false,
  }));

  return {
    props: {
      tests,
      stats,
    },
  };
};

export default ListeningMocksIndexPage;
