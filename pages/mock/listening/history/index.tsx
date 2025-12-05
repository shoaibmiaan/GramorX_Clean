// pages/mock/listening/history/index.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";

import { Container } from "@/components/design-system/Container";
import { Card } from "@/components/design-system/Card";
import { Button } from "@/components/design-system/Button";
import { Badge } from "@/components/design-system/Badge";
import { Icon } from "@/components/design-system/Icon";
import DrillBreakdown, {
  type BandPoint,
  type ListeningAnalytics,
  type SectionAccuracy,
  type TypeAccuracy,
} from "@/components/listening/analytics/DrillBreakdown";

import { getServerClient } from "@/lib/supabaseServer";
import { LISTENING_QUESTION_TYPE_LABELS } from "@/lib/listening/questionTypes";
import MockAllLayout from "@/components/layouts/MockAllLayout";

export type ListeningAttempt = {
  id: string;
  testTitle: string;
  testSlug: string;
  rawScore: number | null;
  bandScore: number | null;
  createdAt: string;
  durationSeconds: number | null;
};

type PageProps = {
  attempts: ListeningAttempt[];
  analytics: ListeningAnalytics | null;
  isLoggedIn: boolean;
};

const ListeningHistoryPage: React.FC<PageProps> & {
  getLayout?: (page: React.ReactNode) => React.ReactNode;
} = ({
  attempts,
  analytics,
  isLoggedIn,
}) => {
  const hasAttempts = attempts.length > 0;

  const bands = attempts
    .map((a) => (typeof a.bandScore === "number" ? a.bandScore : null))
    .filter((b): b is number => Number.isFinite(b));

  const bestBand = bands.length ? Math.max(...bands) : null;
  const lastBand = bands.length ? bands[0] : null;
  const totalAttempts = attempts.length;

  const lastAttemptDate = hasAttempts
    ? new Date(attempts[0].createdAt).toLocaleDateString()
    : "—";

  return (
    <>
      <Head>
        <title>Listening History · GramorX</title>
      </Head>

      <main className="bg-lightBg dark:bg-dark/90 pb-20">
        {/* -------------------------------------------------------------- */}
        {/* HERO / COMMAND HEADER */}
        {/* -------------------------------------------------------------- */}
        <section className="py-10 md:py-14 border-b border-border/40 bg-card/70 backdrop-blur">
          <Container>
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-ds-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <Icon name="Headphones" size={14} />
                <span>Listening attempt history</span>
                {!isLoggedIn && (
                  <Badge size="xs" variant="neutral">
                    Sign in to see your data
                  </Badge>
                )}
              </div>

              <h1 className="font-slab text-display leading-tight">
                Every Listening mock. Every band.
              </h1>

              <p className="text-sm text-muted-foreground max-w-xl">
                See how your Listening band is moving over time — scores, timing,
                section accuracy, and question-type breakdown for all your mocks.
              </p>

              <div className="flex gap-3 pt-3 flex-wrap">
                <Button
                  asChild
                  size="md"
                  variant="primary"
                  className="rounded-ds-xl"
                >
                  <Link href="/mock/listening">Start new Listening mock</Link>
                </Button>

                {hasAttempts && (
                  <Button
                    asChild
                    size="md"
                    variant="secondary"
                    className="rounded-ds-xl"
                  >
                    <Link href="#attempts-list">Jump to attempts</Link>
                  </Button>
                )}
              </div>
            </div>
          </Container>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* TOP STATS STRIP */}
        {/* -------------------------------------------------------------- */}
        {hasAttempts && (
          <section className="pt-6">
            <Container>
              <Card className="rounded-ds-2xl border border-border/60 bg-card/90 p-4 md:p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                      Listening progress snapshot
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Quick view of your bands and attempts so far.
                    </p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground">
                    <Icon name="Clock" size={12} />
                    <span>
                      Last attempt:{" "}
                      <span className="font-medium text-foreground">
                        {lastAttemptDate}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4 text-center text-xs">
                  <div className="rounded-ds-xl bg-muted/70 px-3 py-3">
                    <p className="text-[11px] text-muted-foreground">Best band</p>
                    <p className="mt-1 text-lg font-semibold">
                      {bestBand ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-ds-xl bg-muted/70 px-3 py-3">
                    <p className="text-[11px] text-muted-foreground">Last band</p>
                    <p className="mt-1 text-lg font-semibold">
                      {lastBand ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-ds-xl bg-muted/70 px-3 py-3">
                    <p className="text-[11px] text-muted-foreground">Avg band</p>
                    <p className="mt-1 text-lg font-semibold">
                      {analytics?.averageBand ?? "—"}
                    </p>
                  </div>
                  <div className="rounded-ds-xl bg-muted/40 px-3 py-3">
                    <p className="text-[11px] text-muted-foreground">
                      Total attempts
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {totalAttempts}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>
                    Section and question-type analytics are calculated from your
                    recent mocks.
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="Sparkles" size={12} />
                    <span>Pair this with AI Lab for targeted drills.</span>
                  </span>
                </div>
              </Card>
            </Container>
          </section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* ANALYTICS */}
        {/* -------------------------------------------------------------- */}
        {isLoggedIn && analytics && (
          <section className="py-10">
            <Container>
              <DrillBreakdown analytics={analytics} />
            </Container>
          </section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* EMPTY STATE */}
        {/* -------------------------------------------------------------- */}
        {!hasAttempts && (
          <section className="py-24">
            <Container className="max-w-xl text-center space-y-5">
              <Icon
                name="CircleDashed"
                size={44}
                className="mx-auto text-muted-foreground"
              />

              <h2 className="font-slab text-h3">No Listening mocks yet</h2>
              <p className="text-sm text-muted-foreground">
                Once you attempt a Listening mock, all your results, band
                history, and section analytics will appear here.
              </p>

              <Button
                asChild
                size="lg"
                variant="primary"
                className="rounded-ds-xl px-6"
              >
                <Link href="/mock/listening">Start first Listening mock</Link>
              </Button>
            </Container>
          </section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* ATTEMPT LIST */}
        {/* -------------------------------------------------------------- */}
        {hasAttempts && (
          <section id="attempts-list" className="py-12">
            <Container>
              <div className="mb-6">
                <h2 className="font-slab text-h3">Your Listening attempts</h2>
                <p className="text-sm text-muted-foreground">
                  Click any attempt to view detailed breakdown and section-wise scores.
                </p>
              </div>

              <div className="space-y-4">
                {attempts.map((a) => (
                  <Card
                    key={a.id}
                    className="rounded-ds-2xl p-5 border border-border/60 bg-card/80 flex items-center justify-between hover:-translate-y-1 transition shadow-sm"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{a.testTitle}</h3>
                        <Badge variant="neutral" size="xs">
                          {new Date(a.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {a.rawScore !== null
                          ? `${a.rawScore} correct · Band ${a.bandScore ?? "—"}`
                          : "Not submitted"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="rounded-ds-xl"
                      >
                        <Link href={`/mock/listening/review/${a.id}`}>
                          Review
                        </Link>
                      </Button>

                      <Button
                        asChild
                        size="sm"
                        variant="primary"
                        className="rounded-ds-xl"
                      >
                        <Link href={`/mock/listening/result/${a.id}`}>
                          Open result
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Container>
          </section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* AI RECOMMENDATION CTA */}
        {/* -------------------------------------------------------------- */}
        {hasAttempts && (
          <section className="py-16 bg-muted/40">
            <Container>
              <Card className="max-w-4xl mx-auto rounded-ds-2xl p-6 bg-card/90 border border-border/60">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-xs tracking-wide uppercase text-primary font-semibold">
                      Next smart move
                    </p>
                    <h3 className="font-slab text-h3">
                      Fix your Listening weaknesses with AI.
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      AI Lab will show your weak sections, accent difficulty,
                      question types you keep missing, and targeted drills for
                      improvement.
                    </p>
                  </div>

                  <div className="bg-muted rounded-ds-2xl p-4 space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                      <Icon name="Sparkles" size={14} />
                      <span>Recommended flow</span>
                    </div>

                    <ol className="text-xs text-muted-foreground space-y-2">
                      <li>1. Pick any past attempt from above.</li>
                      <li>2. Send its score to AI Lab.</li>
                      <li>3. Get deep section-wise analysis.</li>
                      <li>4. Retry targeted drills &amp; reattempt a mock.</li>
                    </ol>

                    <div className="flex gap-2">
                      <Button
                        asChild
                        size="sm"
                        variant="secondary"
                        className="rounded-ds-xl w-full"
                      >
                        <Link href="/ai">Open AI Lab</Link>
                      </Button>

                      <Button
                        asChild
                        size="sm"
                        variant="ghost"
                        className="rounded-ds-xl w-full"
                      >
                        <Link href="/mock/listening">Back to Listening mocks</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </Container>
          </section>
        )}

        {/* -------------------------------------------------------------- */}
        {/* COMING SOON BANNER – POWER TECHNIQUES FROM HISTORY */}
        {/* -------------------------------------------------------------- */}
        {isLoggedIn && (
          <section className="pt-10">
            <Container>
              <Card className="mx-auto max-w-4xl rounded-ds-2xl border border-dashed border-primary/40 bg-gradient-to-r from-primary/5 via-card/90 to-primary/5 p-5 md:p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-ds-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                      <Icon name="Sparkles" size={14} />
                      <span>Listening Power Techniques · Coming soon</span>
                    </div>
                    <h3 className="font-slab text-h4">
                      Turn your history into auto-generated drill plans.
                    </h3>
                    <p className="text-xs md:text-sm text-muted-foreground max-w-xl">
                      Soon you’ll be able to auto-generate weakness drills, retry packs,
                      and technique checklists straight from your attempt history — no
                      manual planning needed.
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 text-[11px] text-muted-foreground md:text-right">
                    <span className="inline-flex items-center gap-1 rounded-ds-full bg-muted/70 px-3 py-1">
                      <Icon name="Construction" size={14} />
                      <span>In active development</span>
                    </span>
                    <span>Watch this space. You’ll see it light up here first.</span>
                  </div>
                </div>
              </Card>
            </Container>
          </section>
        )}
      </main>
    </>
  );
};

ListeningHistoryPage.getLayout = (page: React.ReactNode) => (
  <MockAllLayout>{page}</MockAllLayout>
);

export default ListeningHistoryPage;

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return { props: { attempts: [], analytics: null, isLoggedIn: false } };
  }

  const { data: attemptRows } = await supabase
    .from("listening_attempts")
    .select(
      "id, raw_score, band_score, created_at, duration_seconds, total_questions, questions, listening_tests (title, slug)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const attempts: ListeningAttempt[] =
    attemptRows?.map((row: any) => ({
      id: row.id,
      testTitle: row.listening_tests?.title ?? "Untitled Test",
      testSlug: row.listening_tests?.slug ?? "",
      rawScore: row.raw_score ?? row.score ?? null,
      bandScore: row.band_score ?? row.band ?? null,
      createdAt: row.created_at,
      durationSeconds: row.duration_seconds,
    })) ?? [];

  const attemptIds = attemptRows?.map((row: any) => row.id) ?? [];

  if (attemptIds.length === 0) {
    return { props: { attempts, analytics: null, isLoggedIn: true } };
  }

  const { data: answerRows } = await supabase
    .from("listening_attempt_answers")
    .select("attempt_id, question_id, section, is_correct")
    .in("attempt_id", attemptIds);

  const questionIds = Array.from(
    new Set((answerRows ?? []).map((a) => a.question_id).filter(Boolean))
  );

  const { data: questionRows } = questionIds.length
    ? await supabase
        .from("listening_questions")
        .select("id, question_type")
        .in("id", questionIds)
    : { data: [] as any };

  const typeMap = new Map<string, string>();
  (questionRows ?? []).forEach((q: any) => {
    if (q.id) typeMap.set(String(q.id), q.question_type ?? "");
  });

  const sectionBuckets = new Map<number, { total: number; correct: number }>();
  const typeBuckets = new Map<
    string,
    { total: number; correct: number; label: string }
  >();

  (answerRows ?? []).forEach((a: any) => {
    const section = Number(a.section ?? 1);
    const secBucket = sectionBuckets.get(section) ?? {
      total: 0,
      correct: 0,
    };
    secBucket.total += 1;
    if (a.is_correct) secBucket.correct += 1;
    sectionBuckets.set(section, secBucket);

    const typeKey = typeMap.get(String(a.question_id)) ?? "other";
    const label =
      LISTENING_QUESTION_TYPE_LABELS[
        typeKey as keyof typeof LISTENING_QUESTION_TYPE_LABELS
      ] ?? "Other";
    const typeBucket = typeBuckets.get(typeKey) ?? {
      total: 0,
      correct: 0,
      label,
    };
    typeBucket.total += 1;
    if (a.is_correct) typeBucket.correct += 1;
    typeBuckets.set(typeKey, typeBucket);
  });

  const sectionAccuracy: SectionAccuracy[] = Array.from(
    sectionBuckets.entries()
  )
    .map(([section, bucket]) => ({
      section,
      total: bucket.total,
      correct: bucket.correct,
    }))
    .sort((a, b) => a.section - b.section);

  const typeAccuracy: TypeAccuracy[] = Array.from(typeBuckets.entries())
    .map(([type, bucket]) => ({
      type,
      label: bucket.label,
      total: bucket.total,
      correct: bucket.correct,
    }))
    .sort((a, b) => b.total - a.total);

  const bandTrend: BandPoint[] = (attemptRows ?? [])
    .slice(0, 12)
    .map((row: any) => ({
      attemptId: row.id,
      band:
        typeof row.band_score === "number" ? row.band_score : row.band ?? null,
      createdAt: row.created_at,
    }));

  const numericBands = bandTrend
    .map((b) => (typeof b.band === "number" ? b.band : null))
    .filter((b): b is number => Number.isFinite(b));

  const analytics: ListeningAnalytics = {
    attemptsWithScores: numericBands.length,
    averageBand:
      numericBands.length > 0
        ? Number(
            (
              numericBands.reduce((sum, v) => sum + v, 0) / numericBands.length
            ).toFixed(1)
          )
        : null,
    sectionAccuracy,
    typeAccuracy,
    bandTrend,
  };

  return { props: { attempts, analytics, isLoggedIn: true } };
};
