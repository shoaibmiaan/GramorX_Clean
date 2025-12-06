// pages/mock/listening/index.tsx
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

type ListeningMockListItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: string | null;
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

type PageProps = {
  tests: ListeningMockListItem[];
  stats: ListeningStats;
  attemptMap: Record<string, TestAttemptInfo>;
};

// -----------------------------------------------------------------------------
// PAGE
// -----------------------------------------------------------------------------

const ListeningMockIndexPage: NextPage<PageProps> = ({
  tests,
  stats,
  attemptMap,
}) => {
  return (
    <>
      <Head>
        <title>Listening Mock Suite · GramorX</title>
      </Head>

      <main className="bg-lightBg dark:bg-dark/90">
        <Container className="py-6 space-y-12">

          {/* ----------------------------------------------------------------- */}
          {/* COMPACT HERO                                                      */}
          {/* ----------------------------------------------------------------- */}
          <section className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-ds-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              <Icon name="Headphones" size={12} />
              <span>Listening Mock Suite</span>
            </div>

            <h1 className="font-slab text-h3 leading-tight">
              Strict Listening mocks with real audio + exam timing.
            </h1>

            <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
              Four sections, forty questions, one continuous audio — exactly like the IELTS computer-based test.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm" variant="primary" className="rounded-ds-xl">
                <Link href="#tests-list">Start Mock</Link>
              </Button>
              <Button asChild size="sm" variant="secondary" className="rounded-ds-xl">
                <Link href="/mock">Back to Mock Hub</Link>
              </Button>
            </div>
          </section>

          {/* ----------------------------------------------------------------- */}
          {/* MINI STATS BAR                                                    */}
          {/* ----------------------------------------------------------------- */}
          <section>
            <Card className="p-3.5 rounded-ds-2xl bg-card/80 border border-border/60 shadow-sm max-w-xl">
              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat label="Best" value={stats.bestBand ?? "--"} />
                <Stat label="Avg" value={stats.avgBand ?? "--"} />
                <Stat label="Attempts" value={stats.totalAttempts} />
              </div>
            </Card>
          </section>

          {/* ----------------------------------------------------------------- */}
          {/* TWO-COLUMN COMPACT GRID                                           */}
          {/* ----------------------------------------------------------------- */}
          <section>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1.1fr)]">

              {/* ---------------- LEFT: TEST LIST ---------------- */}
              <div className="space-y-3">
                <h2 className="font-slab text-lg">Available Listening Mocks</h2>

                <div id="tests-list" className="grid gap-4 md:grid-cols-2">
                  {tests.map((t) => {
                    const attempt = attemptMap[t.slug];
                    return (
                      <Card
                        key={t.id}
                        className="p-3.5 rounded-ds-2xl bg-card/70 border border-border/60 shadow-sm hover:shadow-md transition"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge size="xs" variant="neutral">
                              Academic
                            </Badge>

                            {t.difficulty && (
                              <Badge size="xs" variant="soft">
                                {t.difficulty}
                              </Badge>
                            )}
                          </div>

                          <h3 className="font-semibold text-sm leading-snug line-clamp-2">
                            {t.title}
                          </h3>

                          <p className="text-[10px] text-muted-foreground">
                            {Math.round(t.durationSeconds / 60)} min · {t.totalQuestions} Q
                          </p>

                          {attempt ? (
                            <Badge size="xs" variant="accent" className="rounded-ds-xl">
                              Band {attempt.latestBandScore ?? "--"}
                            </Badge>
                          ) : (
                            <Badge size="xs" variant="outline" className="rounded-ds-xl">
                              Not attempted
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            asChild
                            size="xs"
                            variant="primary"
                            className="rounded-ds-xl flex-1"
                          >
                            <Link href={`/mock/listening/${t.slug}`}>
                              {attempt ? "Re-attempt" : "Start"}
                            </Link>
                          </Button>

                          <Button
                            asChild
                            variant="secondary"
                            size="icon"
                            className="rounded-ds"
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

              {/* ---------------- RIGHT: TOOLS PANEL ---------------- */}
              <div className="space-y-4">

                <Card className="p-3.5 rounded-ds-2xl bg-card/80 border border-border/60 shadow-sm">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                    Metrics
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Info label="Mocks available" value={tests.length} />
                    <Info label="Mocks attempted" value={stats.totalTestsAttempted} />
                    <Info label="Best band" value={stats.bestBand ?? "--"} />
                    <Info label="Avg band" value={stats.avgBand ?? "--"} />
                  </div>
                </Card>

                <Card className="p-3.5 rounded-ds-2xl bg-card/80 border border-border/60 shadow-sm space-y-2 text-xs">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                    Tools
                  </p>

                  <SideTool href="/mock/listening/drill/section" icon="Waveform">
                    Section drills
                  </SideTool>

                  <SideTool href="/mock/listening/drill/question-type" icon="Target">
                    Question-type drills
                  </SideTool>

                  <SideTool href="/mock/listening/analytics" icon="Activity">
                    Analytics
                  </SideTool>

                  <SideTool href="/mock/listening/techniques" icon="BookOpen">
                    Techniques
                  </SideTool>
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
// SMALL COMPONENTS
// -----------------------------------------------------------------------------

const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-[10px] text-muted-foreground">{label}</p>
    <p className="text-lg font-semibold">{value}</p>
  </div>
);

const Info = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

const SideTool = ({
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
    className="flex justify-between items-center px-3 py-2 rounded-md border hover:bg-muted/60 transition-colors"
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

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      return {
        redirect: {
          destination: "/login?next=/mock/listening",
          permanent: false,
        },
      };
    }

    const user = userData.user;

    const { data: testsRows } = await supabase
      .from("listening_tests")
      .select("id, slug, title, description, duration_minutes, questions, level")
      .eq("is_mock", true)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    const tests: ListeningMockListItem[] =
      testsRows?.map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        description: t.description,
        difficulty: t.level,
        durationSeconds: Number(t.duration_minutes || 40) * 60,
        totalQuestions: t.questions ?? 40,
      })) ?? [];

    const { data: attempts } = await supabase
      .from("listening_attempts")
      .select("id, test_id, raw_score, band_score, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);

    const safeAttempts = attempts ?? [];

    const stats: ListeningStats = {
      totalAttempts: safeAttempts.length,
      totalTestsAttempted: new Set(safeAttempts.map((a) => a.test_id)).size,
      bestBand: null,
      avgBand: null,
      lastAttemptAt: safeAttempts.length ? safeAttempts[0].created_at : null,
    };

    const bands = safeAttempts
      .map((a) => (a.band_score != null ? Number(a.band_score) : null))
      .filter((v): v is number => typeof v === "number");

    if (bands.length > 0) {
      stats.bestBand = Math.max(...bands);
      stats.avgBand = Math.round(
        ((bands.reduce((a, b) => a + b, 0) / bands.length) + Number.EPSILON) * 10
      ) / 10;
    }

    const attemptMap: Record<string, TestAttemptInfo> = {};
    for (const a of safeAttempts) {
      if (!attemptMap[a.test_id]) {
        attemptMap[a.test_id] = {
          latestBandScore: a.band_score != null ? Number(a.band_score) : null,
          latestCreatedAt: a.created_at,
        };
      }
    }

    return {
      props: {
        tests,
        stats,
        attemptMap,
      },
    };
  } catch (err: any) {
    return {
      props: {
        tests: [],
        stats: {
          totalAttempts: 0,
          totalTestsAttempted: 0,
          bestBand: null,
          avgBand: null,
          lastAttemptAt: null,
        },
        attemptMap: {},
      },
    };
  }
};

export default ListeningMockIndexPage;
