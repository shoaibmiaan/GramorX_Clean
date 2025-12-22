// pages/mock/listening/index.tsx
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

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type ListeningMockListItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: string | null; // mapped from level
  durationSeconds: number;
  totalQuestions: number;
};

type TestAttemptInfo = {
  latestBandScore: number | null;
  latestCreatedAt: string | null;
};

type ListeningStats = {
  totalAttempts: number;
  totalTestsAttempted: number;
  bestBand: number | null;
  avgBand: number | null;
  lastAttemptAt: string | null;
};

type ListeningAttemptSummary = {
  rawScore: number;
  totalQuestions: number;
  bandScore: number | null;
  createdAt: string;
};

type PageProps = {
  tests: ListeningMockListItem[];
  attemptSummaries: ListeningAttemptSummary[];
  stats: ListeningStats;
  attemptMap: Record<string, TestAttemptInfo>;
  error?: string;
};

// -----------------------------------------------------------------------------
// PAGE
// -----------------------------------------------------------------------------

const ListeningMockIndexPage: NextPage<PageProps> = ({
  tests,
  attemptSummaries,
  stats,
  attemptMap,
  error,
}) => {
  if (error) {
    return (
      <>
        <Head>
          <title>Error · Listening Mocks · GramorX</title>
        </Head>
        <Container className="py-10 max-w-4xl">
          <Card className="p-6 text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Icon name="AlertTriangle" className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-h4 font-semibold">Unable to load Listening mocks</h2>
            <p className="text-small text-muted-foreground">{error}</p>
            <Button asChild>
              <Link href="/">
                <Icon name="Home" className="h-4 w-4 mr-2" />
                Go Home
              </Link>
            </Button>
          </Card>
        </Container>
      </>
    );
  }

  const hasAttempts = stats.totalAttempts > 0;

  const helperText = hasAttempts
    ? `You attempted ${stats.totalTestsAttempted} mock${
        stats.totalTestsAttempted === 1 ? '' : 's'
      }. Best band ${stats.bestBand ?? '--'}.`
    : `Start your first Listening Mock to unlock analytics.`;

  return (
    <>
      <Head>
        <title>IELTS Listening Mock Command Center</title>
      </Head>

      <main className="bg-lightBg dark:bg-dark/90">
        {/* ------------------------------------------------------------- */}
        {/* TOP HERO COMMAND BAR */}
        {/* ------------------------------------------------------------- */}
        <section className="border-b border-border/50 bg-card/70 backdrop-blur py-8">
          <Container>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              {/* Left side */}
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-ds-full bg-primary/10 px-3 py-1 text-caption font-medium text-primary">
                  <Icon name="Headphones" size={14} />
                  <span>Listening Mock Suite</span>
                </div>

                <h1 className="font-slab text-h2 leading-tight">
                  Your Listening Mock Command Center.
                </h1>

                <p className="text-small text-muted-foreground max-w-xl leading-relaxed">
                  Four sections. Forty questions. Single continuous audio — strict IELTS
                  computer-based environment with exam-room layout and band tracking.
                </p>

                <div className="text-caption text-muted-foreground">{helperText}</div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button asChild size="md" variant="primary" className="rounded-ds-xl">
                    <Link href="#tests-list">Start a Listening Mock</Link>
                  </Button>
                  <Button asChild size="md" variant="secondary" className="rounded-ds-xl">
                    <Link href="/mock">Back to Mock Hub</Link>
                  </Button>
                </div>
              </div>

              {/* Right side quick stats */}
              <Card className="p-5 rounded-ds-2xl border border-border/60 bg-card/80 shadow-sm w-full max-w-xs">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
                  Listening Quick Stats
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-caption text-muted-foreground">Best</p>
                    <p className="text-h4 font-semibold">{stats.bestBand ?? '--'}</p>
                  </div>
                  <div>
                    <p className="text-caption text-muted-foreground">Avg</p>
                    <p className="text-h4 font-semibold">{stats.avgBand ?? '--'}</p>
                  </div>
                  <div>
                    <p className="text-caption text-muted-foreground">Attempts</p>
                    <p className="text-h4 font-semibold">{stats.totalAttempts}</p>
                  </div>
                </div>
              </Card>
            </div>
          </Container>
        </section>

        {/* ------------------------------------------------------------- */}
        {/* GRID LAYOUT */}
        {/* ------------------------------------------------------------- */}
        <section className="pb-20 pt-8">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)]">
              {/* ------------------ LEFT: MOCK LIST ------------------ */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-slab text-h3">Listening Mock Library</h2>
                    <p className="text-caption text-muted-foreground">
                      All full-length Listening tests available.
                    </p>
                  </div>
                </div>

                <div id="tests-list" className="grid gap-5 md:grid-cols-2">
                  {tests.map((t) => {
                    const attempt = attemptMap[t.slug];

                    return (
                      <Card
                        key={t.id}
                        className="p-4 rounded-ds-2xl bg-card/70 border border-border/60 shadow-sm transition hover:shadow-lg hover:-translate-y-1"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="neutral" size="xs">
                              Academic
                            </Badge>

                            {t.difficulty && (
                              <Badge variant="soft" size="xs">
                                {t.difficulty}
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-small font-semibold leading-snug line-clamp-2">
                            {t.title}
                          </h3>

                          <p className="text-[11px] text-muted-foreground">
                            {Math.round(t.durationSeconds / 60)} min • {t.totalQuestions}{' '}
                            questions
                          </p>

                          {!attempt ? (
                            <Badge variant="outline" size="xs" className="rounded-ds-xl">
                              <Icon name="EyeOff" className="h-3.5 w-3.5 mr-1" />
                              Not attempted
                            </Badge>
                          ) : (
                            <Badge variant="accent" size="xs" className="rounded-ds-xl">
                              <Icon name="CheckCircle" className="h-3.5 w-3.5 mr-1" />
                              Band {attempt.latestBandScore ?? '--'}
                            </Badge>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <Button
                            asChild
                            className="rounded-ds-xl text-caption font-semibold flex-1"
                            variant="primary"
                          >
                            <Link href={`/mock/listening/${t.slug}`}>
                              {attempt ? 'Re-attempt Mock' : 'Start Mock'}
                            </Link>
                          </Button>

                          <Button
                            asChild
                            variant="secondary"
                            size="icon"
                            className="rounded-ds ml-2"
                          >
                            <Link href={`/mock/listening/history?test=${t.slug}`}>
                              <Icon name="History" className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* ------------------ RIGHT RAIL ------------------ */}
              <div className="space-y-6">
                <Card className="p-4 rounded-ds-2xl bg-card/80 border border-border/60 shadow-sm text-caption space-y-2">
                  <p className="text-[11px] uppercase font-semibold tracking-wide text-muted-foreground">
                    Listening Metrics
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <Info label="Mocks available" value={tests.length} />
                    <Info label="Mocks attempted" value={stats.totalTestsAttempted} />
                    <Info label="Best band" value={stats.bestBand ?? '--'} />
                    <Info label="Avg band" value={stats.avgBand ?? '--'} />
                  </div>

                  {stats.lastAttemptAt && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Last attempt:{' '}
                      {new Date(stats.lastAttemptAt).toLocaleDateString()}
                    </p>
                  )}
                </Card>

                <Card className="p-4 rounded-ds-2xl bg-card/80 border border-border/60 shadow-sm text-caption space-y-3">
                  <p className="text-[11px] uppercase font-semibold tracking-wide text-muted-foreground">
                    Power Tools (Listening)
                  </p>

                  <Tool href="/mock/listening/drill/section" icon="Waveform">
                    Section-wise practice
                  </Tool>
                  <Tool href="/mock/listening/drill/question-type" icon="Target">
                    Question-type drills
                  </Tool>
                  <Tool href="/mock/listening/analytics" icon="Activity">
                    Analytics & Weaknesses
                  </Tool>
                  <Tool href="/mock/listening/techniques" icon="BookOpen">
                    Techniques trainer
                  </Tool>
                </Card>
              </div>
            </div>
          </Container>
        </section>
      </main>
    </>
  );
};

// -----------------------------------------------------------------------------
// Helper Components
// -----------------------------------------------------------------------------

const Info = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between text-caption">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

const Tool = ({
  href,
  icon,
  children,
}: {
  href: string;
  icon: string;
  children: React.ReactNode;
}) => (
  <Link
    href={href}
    className="flex justify-between items-center px-3 py-2 rounded-md border hover:bg-muted/70 transition-colors"
  >
    <span>{children}</span>
    <Icon name={icon} className="h-4 w-4" />
  </Link>
);

// -----------------------------------------------------------------------------
// SSR
// -----------------------------------------------------------------------------

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  try {
    const supabase = getServerClient<Database>(ctx.req, ctx.res);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        redirect: {
          destination: '/login?next=/mock/listening',
          permanent: false,
        },
      };
    }

    const [testsRes, attemptsRes] = await Promise.all([
      supabase
        .from('listening_tests')
        .select(
          'id, slug, title, description, duration_minutes, questions, level',
        )
        .eq('is_mock', true)
        .eq('is_published', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('listening_attempts')
        .select('id, test_id, raw_score, band_score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200),
    ]);

    const { data: testsRows, error: testsErr } = testsRes;
    if (testsErr) throw testsErr;

    type ListeningAttemptsRow =
      Database['public']['Tables']['listening_attempts']['Row'];

    const stats: ListeningStats = {
      totalAttempts: 0,
      totalTestsAttempted: 0,
      bestBand: null,
      avgBand: null,
      lastAttemptAt: null,
    };

    const { data: attempts, error: attemptsErr } = attemptsRes;
    if (attemptsErr) throw attemptsErr;

    const safeAttempts: ListeningAttemptsRow[] = attempts ?? [];

    stats.totalAttempts = safeAttempts.length;
    if (safeAttempts.length > 0) {
      stats.lastAttemptAt = safeAttempts[0].created_at;
    }

    const attemptSummaries: ListeningAttemptSummary[] = safeAttempts.map((a) => ({
      rawScore: Number(a.raw_score ?? 0),
      totalQuestions: 40,
      bandScore: a.band_score != null ? Number(a.band_score) : null,
      createdAt: a.created_at,
    }));

    const bands = safeAttempts
      .map((a) => (a.band_score != null ? Number(a.band_score) : null))
      .filter((v): v is number => typeof v === 'number');

    if (bands.length > 0) {
      stats.bestBand = Math.max(...bands);
      const avg = bands.reduce((acc, v) => acc + v, 0) / bands.length;
      stats.avgBand = Math.round((avg + Number.EPSILON) * 10) / 10;
    }

    const mapByTestId: Record<string, TestAttemptInfo> = {};
    for (const a of safeAttempts) {
      if (!a.test_id) continue;
      if (!mapByTestId[a.test_id]) {
        mapByTestId[a.test_id] = {
          latestBandScore: a.band_score != null ? Number(a.band_score) : null,
          latestCreatedAt: a.created_at,
        };
      }
    }

    stats.totalTestsAttempted = Object.keys(mapByTestId).length;

    const testSlugMap = Object.fromEntries(
      (testsRows ?? []).map((t) => [t.id, t.slug]),
    );

    const attemptMap: Record<string, TestAttemptInfo> = {};
    Object.entries(mapByTestId).forEach(([testId, info]) => {
      const slug = testSlugMap[testId];
      if (slug) attemptMap[slug] = info;
    });

    const tests: ListeningMockListItem[] =
      testsRows?.map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        description: t.description ?? null,
        difficulty: t.level ?? null, // mapped from level
        durationSeconds: (t.duration_minutes ?? 40) * 60,
        totalQuestions: t.questions ?? 40,
      })) ?? [];

    return {
      props: {
        tests,
        attemptSummaries,
        stats,
        attemptMap,
      },
    };
  } catch (err: unknown) {
    console.error('Failed to load Listening mocks', err);
    const message =
      err instanceof Error ? err.message : 'Failed to load Listening mocks.';
    return {
      props: {
        tests: [],
        attemptSummaries: [],
        stats: {
          totalAttempts: 0,
          totalTestsAttempted: 0,
          bestBand: null,
          avgBand: null,
          lastAttemptAt: null,
        },
        attemptMap: {},
        error: message,
      },
    };
  }
};

export default ListeningMockIndexPage;
