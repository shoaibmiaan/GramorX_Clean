// pages/mock/writing/index.tsx
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

// ------------------------------------------------------------------------------------
// Types
// ------------------------------------------------------------------------------------

type WritingMockListItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: string | null;
};

type TestAttemptInfo = {
  attemptsCount: number;
  latestCreatedAt: string | null;
};

type WritingStats = {
  totalAttempts: number;
  totalTestsAttempted: number;
  lastAttemptAt: string | null;
};

type PageProps = {
  tests: WritingMockListItem[];
  stats: WritingStats;
  attemptMap: Record<string, TestAttemptInfo>;
  error?: string | null;
};

// ------------------------------------------------------------------------------------
// GSSP
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
          destination: '/login?next=/mock/writing',
          permanent: false,
        },
      };
    }

    // Load active, published writing mocks
    const { data: testsRows, error: testsErr } = await supabase
      .from('writing_tests')
      .select(
        'id, slug, title, description, difficulty, is_mock, is_active, is_published',
      )
      .eq('is_mock', true)
      .eq('is_active', true)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (testsErr) throw testsErr;

    // Load attempts for this user
    const { data: attemptsRows, error: attemptsErr } = await supabase
      .from('attempts_writing')
      .select('id, prompt_id, submitted_at')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false });

    if (attemptsErr) throw attemptsErr;

    const stats: WritingStats = {
      totalAttempts: attemptsRows?.length ?? 0,
      totalTestsAttempted: 0,
      lastAttemptAt: attemptsRows?.[0]?.submitted_at ?? null,
    };

    const attemptMapBySlug: Record<string, TestAttemptInfo> = {};

    // Tie attempts to tests via prompts
    if (testsRows && attemptsRows && attemptsRows.length > 0) {
      const promptIds = attemptsRows
        .map((a) => a.prompt_id)
        .filter(Boolean) as string[];

      if (promptIds.length > 0) {
        const { data: promptsRows, error: promptsErr } = await supabase
          .from('writing_prompts')
          .select('id, test_id')
          .in('id', promptIds);

        if (promptsErr) throw promptsErr;

        const testIdByPromptId: Record<string, string> = {};
        promptsRows?.forEach((p) => {
          testIdByPromptId[p.id] = (p as any).test_id ?? '';
        });

        const slugByTestId: Record<string, string> = {};
        testsRows?.forEach((t) => {
          slugByTestId[t.id] = (t as any).slug ?? '';
        });

        for (const a of attemptsRows) {
          if (!a.prompt_id) continue;
          const testId = testIdByPromptId[a.prompt_id];
          if (!testId) continue;
          const slug = slugByTestId[testId];
          if (!slug) continue;

          if (!attemptMapBySlug[slug]) {
            attemptMapBySlug[slug] = {
              attemptsCount: 0,
              latestCreatedAt: null,
            };
          }

          attemptMapBySlug[slug].attemptsCount += 1;

          if (
            a.submitted_at &&
            (!attemptMapBySlug[slug].latestCreatedAt ||
              a.submitted_at > attemptMapBySlug[slug].latestCreatedAt!)
          ) {
            attemptMapBySlug[slug].latestCreatedAt = a.submitted_at;
          }
        }

        stats.totalTestsAttempted = Object.keys(attemptMapBySlug).length;
      }
    }

    const tests: WritingMockListItem[] =
      testsRows?.map((t: any) => ({
        id: t.id,
        slug: t.slug,
        title: t.title ?? 'Writing Mock',
        description: t.description ?? null,
        difficulty: t.difficulty ?? null,
      })) ?? [];

    return {
      props: {
        tests,
        stats,
        attemptMap: attemptMapBySlug,
      },
    };
  } catch (err: any) {
    return {
      props: {
        tests: [],
        stats: {
          totalAttempts: 0,
          totalTestsAttempted: 0,
          lastAttemptAt: null,
        },
        attemptMap: {},
        error: err?.message ?? 'Unexpected error loading Writing mocks.',
      },
    };
  }
};

// ------------------------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------------------------

function formatDateTime(value: string | null) {
  if (!value) return null;
  try {
    const d = new Date(value);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------------------------
// Component
// ------------------------------------------------------------------------------------

const WritingMockIndexPage: NextPage<PageProps> = ({
  tests,
  stats,
  attemptMap,
  error,
}) => {
  if (error) {
    return (
      <>
        <Head>
          <title>Writing Mock Tests · GramorX</title>
        </Head>
        <section className="py-10 md:py-12">
          <Container className="max-w-3xl">
            <Card className="space-y-3 p-4 md:p-6">
              <div className="flex items-start gap-3">
                <Icon
                  name="AlertTriangle"
                  className="mt-0.5 h-5 w-5 text-destructive"
                />
                <div className="space-y-1">
                  <h1 className="text-base font-semibold">
                    Something went wrong loading Writing mocks
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {error}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Try refreshing the page. If the issue continues, contact support.
                  </p>
                </div>
              </div>
              <div>
                <Button asChild size="sm">
                  <Link href="/mock">Back to Mock home</Link>
                </Button>
              </div>
            </Card>
          </Container>
        </section>
      </>
    );
  }

  const hasAttempts = stats.totalAttempts > 0;

  return (
    <>
      <Head>
        <title>Writing Mock Tests · GramorX</title>
        <meta
          name="description"
          content="Full IELTS Writing mocks (Task 1 + Task 2) with AI scoring, analytics, and detailed feedback."
        />
      </Head>

      <section className="py-10 md:py-12 bg-lightBg">
        <Container className="space-y-8">
          {/* Hero */}
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
              <Icon name="PenSquare" className="h-3.5 w-3.5" />
              <span>IELTS Writing • Full mocks</span>
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-3">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                  Writing Mock Tests (Task 1 + Task 2)
                </h1>
                <p className="max-w-2xl text-sm md:text-base text-muted-foreground">
                  Practice complete IELTS Writing exams in a strict 60-minute environment
                  that mirrors the real computer-based test – with AI-powered scoring and
                  feedback.
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <Button asChild size="sm">
                  <Link href={tests[0] ? `/mock/writing/run?testSlug=${encodeURIComponent(
                    tests[0].slug,
                  )}` : '/mock/writing'}>
                    <Icon name="Play" className="mr-1.5 h-4 w-4" />
                    {tests[0] ? 'Start first full mock' : 'No mocks available'}
                  </Link>
                </Button>
                <Button asChild size="sm" variant="outline" tone="neutral">
                  <Link href="/mock/writing/history">
                    <Icon name="Clock" className="mr-1.5 h-4 w-4" />
                    View Writing history
                  </Link>
                </Button>
              </div>
            </div>
          </header>

          {/* Stats + explainer */}
          <section className="grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <Card className="space-y-3 p-4 md:p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Your Writing mock progress
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Track how many full mocks you&apos;ve completed and when you last
                    practised.
                  </p>
                </div>
                <Badge size="xs" tone={hasAttempts ? 'success' : 'neutral'}>
                  {hasAttempts ? 'Active' : 'Not started'}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs md:text-sm">
                <div className="rounded-ds-lg border border-border bg-card/60 px-3 py-3">
                  <p className="text-[11px] text-muted-foreground">Total attempts</p>
                  <p className="mt-1 text-lg font-semibold">
                    {stats.totalAttempts}
                  </p>
                </div>
                <div className="rounded-ds-lg border border-border bg-card/60 px-3 py-3">
                  <p className="text-[11px] text-muted-foreground">
                    Distinct mocks
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {stats.totalTestsAttempted}
                  </p>
                </div>
                <div className="rounded-ds-lg border border-border bg-card/60 px-3 py-3">
                  <p className="text-[11px] text-muted-foreground">
                    Last attempt
                  </p>
                  <p className="mt-1 text-xs font-medium">
                    {formatDateTime(stats.lastAttemptAt) ?? 'Not yet attempted'}
                  </p>
                </div>
              </div>

              {hasAttempts ? (
                <p className="text-[11px] text-muted-foreground">
                  Keep your streak alive: aim for at least{' '}
                  <span className="font-medium">1 full Writing mock per week</span> to see
                  steady band improvement.
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  No attempts yet. Start your first full Writing mock and unlock
                  AI-powered feedback.
                </p>
              )}
            </Card>

            <Card className="space-y-3 p-4 md:p-5 text-xs">
              <div className="flex items-center gap-2">
                <Icon name="Info" className="h-4 w-4 text-muted-foreground" />
                <p className="text-[13px] font-medium">How Writing mocks work</p>
              </div>
              <ul className="space-y-2 text-[11px] text-muted-foreground">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                  <span>
                    Each mock includes <span className="font-medium">Task 1 + Task 2</span>{' '}
                    in a single 60-minute exam.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                  <span>
                    Your responses are auto-saved frequently, so you don&apos;t lose work if
                    the tab refreshes.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                  <span>
                    After submitting, you get{' '}
                    <span className="font-medium">AI-powered scores</span> for Task 1 &amp;
                    Task 2, with band prediction and key improvement areas.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                  <span>
                    You can revisit your attempts from the{' '}
                    <span className="font-medium">Writing history</span> page anytime.
                  </span>
                </li>
              </ul>
            </Card>
          </section>

          {/* Tests list */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold md:text-base">
                Available Writing mocks
              </h2>
              <Button asChild size="xs" variant="outline" tone="neutral">
                <Link href="/mock">
                  <Icon name="LayoutDashboard" className="mr-1.5 h-3.5 w-3.5" />
                  Back to Mock home
                </Link>
              </Button>
            </div>

            {tests.length === 0 ? (
              <Card className="p-5 text-sm text-muted-foreground">
                No Writing mocks are currently available. Check back later.
              </Card>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {tests.map((t) => {
                  const attemptsInfo = attemptMap[t.slug];
                  const attempted = attemptsInfo?.attemptsCount && attemptsInfo.attemptsCount > 0;
                  const latest = formatDateTime(attemptsInfo?.latestCreatedAt ?? null);

                  return (
                    <Card
                      key={t.id}
                      className="flex flex-col justify-between gap-3 p-4 md:p-5"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{t.title}</p>
                            {t.description && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t.description}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge size="xs" tone="neutral">
                              Full mock
                            </Badge>
                            {t.difficulty && (
                              <span className="text-[11px] text-muted-foreground">
                                Level: {t.difficulty}
                              </span>
                            )}
                          </div>
                        </div>
                        {attempted ? (
                          <p className="text-[11px] text-muted-foreground">
                            <span className="font-medium">
                              {attemptsInfo!.attemptsCount} attempt
                              {attemptsInfo!.attemptsCount > 1 ? 's' : ''}
                            </span>{' '}
                            · Last on {latest}
                          </p>
                        ) : (
                          <p className="text-[11px] text-muted-foreground">
                            You haven&apos;t attempted this mock yet.
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] text-muted-foreground">
                          Includes Task 1 &amp; Task 2 in one sitting.
                        </div>
                        <Button asChild size="sm">
                          <Link
                            href={`/mock/writing/run?testSlug=${encodeURIComponent(
                              t.slug,
                            )}`}
                          >
                            {attempted ? 'Re-attempt Mock' : 'Start Mock'}
                            <Icon
                              name={attempted ? 'RotateCw' : 'Play'}
                              className="ml-1.5 h-3.5 w-3.5"
                            />
                          </Link>
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </Container>
      </section>
    </>
  );
};

export default WritingMockIndexPage;
