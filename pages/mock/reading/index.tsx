// pages/mock/reading/index.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, NextPage } from "next";

import { getServerClient } from "@/lib/supabaseServer";
import type { Database } from "@/lib/database.types";

import { Container } from "@/components/design-system/Container";
import { Card } from "@/components/design-system/Card";
import { Badge } from "@/components/design-system/Badge";
import { Button } from "@/components/design-system/Button";
import { Icon } from "@/components/design-system/Icon";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type ReadingMockListItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  totalQuestions: number;
  passages: number;
};

type ReadingAttempt = {
  created_at: string;
  band_score: number | null;
  raw_score: number | null;
};

type AttemptMap = Record<
  string,
  {
    latestBandScore: number | null;
    latestCreatedAt: string | null;
  }
>;

type ReadingStats = {
  totalAttempts: number;
  totalTestsAttempted: number;
  bestBand: number | null;
  avgBand: number | null;
  lastAttemptAt: string | null;
};

type PageProps = {
  tests: ReadingMockListItem[];
  attemptMap: AttemptMap;
  stats: ReadingStats;
  error?: string;
};

// -----------------------------------------------------------------------------
// PAGE
// -----------------------------------------------------------------------------

const ReadingMockIndexPage: NextPage<PageProps> = ({
  tests,
  attemptMap,
  stats,
  error,
}) => {
  if (error) {
    return (
      <Container className="py-12 max-w-xl">
        <Card className="p-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Icon name="AlertTriangle" className="text-destructive h-6 w-6" />
          </div>
          <h2 className="font-semibold text-lg">Unable to load Reading mocks</h2>
          <p className="text-sm text-muted-foreground">{error}</p>

          <Button asChild>
            <Link href="/mock">
              <Icon name="ArrowLeft" className="h-4 w-4 mr-1" />
              Back to mock home
            </Link>
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <>
      <Head>
        <title>Reading Mock Suite · GramorX</title>
      </Head>

      <main className="bg-lightBg dark:bg-dark/90">
        <Container className="py-12 space-y-20">

          {/* ----------------------------------------------------------------- */}
          {/* HERO — ENTERPRISE STYLE                                          */}
          {/* ----------------------------------------------------------------- */}
          <section className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-ds-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Icon name="BookOpen" size={14} />
              <span>Reading Mock Suite</span>
            </div>

            <h1 className="font-slab text-h2 leading-tight">
              IELTS Academic Reading mocks with strict exam flow.
            </h1>

            <p className="text-sm text-muted-foreground max-w-2xl">
              Three passages, 40 questions, transfer-free mode, strict timing, and
              original academic text difficulty — all matching real CBE conditions.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="md" variant="primary" className="rounded-ds-xl">
                <Link href="#reading-tests">Start a Reading Mock</Link>
              </Button>

              <Button asChild size="md" variant="secondary" className="rounded-ds-xl">
                <Link href="/mock">Back to Mock Hub</Link>
              </Button>
            </div>
          </section>

          {/* ----------------------------------------------------------------- */}
          {/* READING STATS                                                    */}
          {/* ----------------------------------------------------------------- */}
          <section>
            <Card className="p-6 max-w-xl rounded-ds-2xl bg-card/80 border border-border/60 shadow-sm">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
                Reading Snapshot
              </p>

              <div className="grid grid-cols-3 text-center gap-4">
                <Stat label="Best" value={stats.bestBand ?? "--"} />
                <Stat label="Avg" value={stats.avgBand ?? "--"} />
                <Stat label="Attempts" value={stats.totalAttempts} />
              </div>

              {stats.lastAttemptAt && (
                <p className="text-[11px] text-muted-foreground text-center mt-3">
                  Last attempt:{" "}
                  {new Date(stats.lastAttemptAt).toLocaleDateString()}
                </p>
              )}
            </Card>
          </section>

          {/* ----------------------------------------------------------------- */}
          {/* GRID: LIST OF READING MOCKS + TOOLS                              */}
          {/* ----------------------------------------------------------------- */}
          <section>
            <div className="grid gap-12 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)]">

              {/* ---------------- LEFT — LIST OF TESTS ---------------- */}
              <div className="space-y-6">
                <div>
                  <h2 className="font-slab text-xl">Reading Mock Library</h2>
                  <p className="text-xs text-muted-foreground">
                    All published Academic Reading tests.
                  </p>
                </div>

                <div id="reading-tests" className="grid md:grid-cols-2 gap-5">
                  {tests.map((test) => {
                    const att = attemptMap[test.slug];

                    return (
                      <Card
                        key={test.id}
                        className="p-5 rounded-ds-2xl bg-card/70 border border-border/60 shadow-sm hover:shadow-lg hover:-translate-y-1 transition"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge size="xs" variant="neutral">
                              Academic
                            </Badge>

                            {test.difficulty && (
                              <Badge size="xs" variant="soft">
                                {test.difficulty}
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-semibold text-sm leading-snug line-clamp-2">
                            {test.title}
                          </h3>

                          <p className="text-[11px] text-muted-foreground">
                            {test.passages} passages · {test.totalQuestions} questions
                          </p>

                          {!att ? (
                            <Badge variant="outline" size="xs" className="rounded-ds-xl">
                              <Icon name="EyeOff" className="h-3.5 w-3.5 mr-1" />
                              Not attempted
                            </Badge>
                          ) : (
                            <Badge variant="accent" size="xs" className="rounded-ds-xl">
                              <Icon name="CheckCircle" className="h-3.5 w-3.5 mr-1" />
                              Band {att.latestBandScore ?? "--"}
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button asChild variant="primary" className="flex-1 rounded-ds-xl text-xs">
                            <Link href={`/mock/reading/${test.slug}`}>
                              {att ? "Re-attempt Mock" : "Start Mock"}
                            </Link>
                          </Button>

                          <Button asChild size="icon" variant="secondary" className="rounded-ds">
                            <Link href={`/mock/reading/history?test=${test.slug}`}>
                              <Icon name="History" className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* ---------------- RIGHT — TOOLS PANEL ---------------- */}
              <div className="space-y-6">
                <Card className="p-5 rounded-ds-2xl bg-card/80 border border-border/60 text-xs space-y-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Reading Metrics
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <Info label="Mocks available" value={tests.length} />
                    <Info label="Mocks attempted" value={stats.totalTestsAttempted} />
                    <Info label="Best band" value={stats.bestBand ?? "--"} />
                    <Info label="Avg band" value={stats.avgBand ?? "--"} />
                  </div>
                </Card>

                <Card className="p-5 rounded-ds-2xl bg-card/80 border border-border/60 text-xs space-y-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Power Tools
                  </p>

                  <Tool href="/mock/reading/drill/passage" icon="AlignLeft">
                    Passage-wise drilling
                  </Tool>

                  <Tool href="/mock/reading/drill/question-type" icon="Target">
                    Question-type practice
                  </Tool>

                  <Tool href="/mock/reading/analytics" icon="Activity">
                    Analytics & weak areas
                  </Tool>

                  <Tool href="/mock/reading/techniques" icon="BookOpen">
                    Reading techniques lessons
                  </Tool>
                </Card>
              </div>
            </div>
          </section>

        </Container>
      </main>
    </>
  );
};

// -----------------------------------------------------------------------------
// UI SUB-COMPONENTS
// -----------------------------------------------------------------------------

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-lg font-semibold">{value}</p>
  </div>
);

const Info = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between text-xs">
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
    className="flex items-center justify-between px-3 py-2 rounded-md border hover:bg-muted/60 transition-colors"
  >
    <span>{children}</span>
    <Icon name={icon} className="h-4 w-4" />
  </Link>
);

// -----------------------------------------------------------------------------
// SERVER SIDE PROPS
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
          destination: "/login?next=/mock/reading",
          permanent: false,
        },
      };
    }

    // Load tests
    const { data: testsRows, error: testsErr } = await supabase
      .from("reading_tests")
      .select(
        "id, slug, title, description, passages, total_questions, difficulty"
      )
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (testsErr) throw testsErr;

    const tests: ReadingMockListItem[] =
      testsRows?.map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        description: t.description,
        difficulty: t.difficulty,
        passages: Number(t.passages ?? 3),
        totalQuestions: Number(t.total_questions ?? 40),
      })) ?? [];

    // Load attempts
    const { data: attempts, error: attemptsErr } = await supabase
      .from("reading_attempts")
      .select("test_slug, band_score, created_at, raw_score")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (attemptsErr) throw attemptsErr;

    const attemptMap: AttemptMap = {};
    const bands: number[] = [];

    for (const a of attempts ?? []) {
      if (!attemptMap[a.test_slug]) {
        attemptMap[a.test_slug] = {
          latestBandScore: a.band_score != null ? Number(a.band_score) : null,
          latestCreatedAt: a.created_at,
        };
      }

      if (a.band_score != null) bands.push(Number(a.band_score));
    }

    const stats: ReadingStats = {
      totalAttempts: attempts?.length ?? 0,
      totalTestsAttempted: new Set((attempts ?? []).map((a) => a.test_slug)).size,
      bestBand: bands.length > 0 ? Math.max(...bands) : null,
      avgBand:
        bands.length > 0
          ? Math.round(
              ((bands.reduce((a, b) => a + b, 0) / bands.length) + Number.EPSILON) *
                10
            ) / 10
          : null,
      lastAttemptAt: attempts?.[0]?.created_at ?? null,
    };

    return {
      props: {
        tests,
        attemptMap,
        stats,
      },
    };
  } catch (err: any) {
    return {
      props: {
        tests: [],
        attemptMap: {},
        stats: {
          totalAttempts: 0,
          totalTestsAttempted: 0,
          bestBand: null,
          avgBand: null,
          lastAttemptAt: null,
        },
        error: err.message ?? "Unexpected error occurred.",
      },
    };
  }
};

export default ReadingMockIndexPage;
