// pages/mock/listening/result/[attemptId].tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps, NextPage } from "next";

import { Container } from "@/components/design-system/Container";
import { Card } from "@/components/design-system/Card";
import { Badge } from "@/components/design-system/Badge";
import { Button } from "@/components/design-system/Button";
import { Icon } from "@/components/design-system/Icon";

import { getServerClient } from "@/lib/supabaseServer";
import MockAllLayout from "@/components/layouts/MockAllLayout";

type AttemptSummary = {
  id: string;
  rawScore: number | null;
  bandScore: number | null;
  questionCount: number | null;
  durationSeconds: number | null;
  createdAt: string;
};

type TestSummary = {
  id: string;
  title: string;
  slug: string;
  totalQuestions: number | null;
  durationMinutes: number | null;
};

type SectionStat = {
  section: number;
  correct: number;
  total: number;
};

type PageProps = {
  attempt: AttemptSummary | null;
  test: TestSummary | null;
  sectionStats: SectionStat[];
  isLoggedIn: boolean;
};

const ListeningResultPage: NextPage<PageProps> & {
  getLayout?: (page: React.ReactNode) => React.ReactNode;
} = ({
  attempt,
  test,
  sectionStats,
  isLoggedIn,
}) => {
  const notFound = !attempt || !test;

  if (notFound) {
    return (
      <>
        <Head>
          <title>Listening Result · GramorX</title>
        </Head>

        <main className="bg-lightBg dark:bg-dark/90 pb-20">
          <section className="py-16">
            <Container className="max-w-xl">
              <Card className="mx-auto rounded-ds-2xl border border-border/60 bg-card/80 p-8 text-center shadow-sm space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <Icon name="AlertTriangle" className="h-5 w-5 text-destructive" />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                    Result not available
                  </p>
                  <p className="text-sm text-grayish">
                    {isLoggedIn
                      ? "We couldn't find that attempt. Please retry a Listening mock."
                      : "You need to be logged in to view this result."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                  {!isLoggedIn && (
                    <Button asChild size="sm">
                      <Link href="/login?role=student">
                        <Icon name="LogIn" className="h-4 w-4 mr-1" />
                        Log in
                      </Link>
                    </Button>
                  )}
                  <Button asChild size="sm" variant="outline">
                    <Link href="/mock/listening">
                      <Icon name="ArrowLeft" className="h-4 w-4 mr-1" />
                      Back to Listening mocks
                    </Link>
                  </Button>
                </div>
              </Card>
            </Container>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Listening Result · GramorX</title>
      </Head>

      <main className="bg-lightBg dark:bg-dark/90 pb-20">

        {/* -------------------------------------------------------------- */}
        {/* HERO SECTION */}
        {/* -------------------------------------------------------------- */}
        <section className="py-10 md:py-14 border-b border-border/40 bg-card/70 backdrop-blur">
          <Container className="space-y-4">

            <div className="inline-flex items-center gap-2 rounded-ds-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Icon name="Headphones" size={14} />
              <span>Listening Result</span>
            </div>

            <h1 className="font-slab text-h2">
              Your Listening Score
            </h1>

            <p className="text-sm text-muted-foreground max-w-xl">
              Full breakdown of your Listening mock: band score, raw score,
              section accuracy, and improvement suggestions.
            </p>

            <div className="flex gap-3 pt-3">
              <Button
                asChild
                size="md"
                variant="primary"
                className="rounded-ds-xl"
              >
                <Link href="/mock/listening">Start another mock</Link>
              </Button>

              <Button
                asChild
                size="md"
                variant="secondary"
                className="rounded-ds-xl"
              >
                <Link href="/mock/listening/history">Back to history</Link>
              </Button>
            </div>
          </Container>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* SCORE SUMMARY */}
        {/* -------------------------------------------------------------- */}
        <section className="py-12">
          <Container>
            <div className="grid gap-6 md:grid-cols-2">

              {/* MAIN SCORE CARD */}
              <Card className="rounded-ds-2xl p-6 border border-border/60 bg-card/80">
                <h2 className="font-slab text-h4 mb-4">Overall Performance</h2>

                <div className="grid grid-cols-3 gap-4 text-center">

                  <div>
                    <p className="text-xs text-muted-foreground">Band score</p>
                    <p className="text-3xl font-bold text-foreground">
                      {attempt.bandScore ?? "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Correct answers</p>
                    <p className="text-3xl font-bold text-foreground">
                      {attempt.rawScore ?? "—"}/{attempt.questionCount ?? test.totalQuestions ?? 40}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="text-3xl font-bold text-foreground">
                      {attempt.durationSeconds
                        ? `${Math.round(attempt.durationSeconds / 60)}m`
                        : "—"}
                    </p>
                  </div>

                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  Attempted on {new Date(attempt.createdAt).toLocaleDateString()}
                </p>
              </Card>

              {/* TEST DETAILS */}
              <Card className="rounded-ds-2xl p-6 border border-border/60 bg-card/80">
                <h2 className="font-slab text-h4 mb-4">Test Details</h2>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Test</span>
                    <span className="font-medium text-foreground">{test.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total questions</span>
                    <span className="font-medium text-foreground">
                      {test.totalQuestions ?? 40}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Duration</span>
                    <span className="font-medium text-foreground">
                      {test.durationMinutes ?? 30} minutes
                    </span>
                  </div>
                </div>
              </Card>

            </div>
          </Container>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* SECTION WISE BREAKDOWN */}
        {/* -------------------------------------------------------------- */}
        <section className="pb-12">
          <Container>
            <h2 className="font-slab text-h4 mb-4">Section Breakdown</h2>

            <div className="grid gap-4 md:grid-cols-4">
              {sectionStats.map((s) => (
                <Card
                  key={s.section}
                  className="rounded-ds-2xl p-5 border border-border/60 bg-card/80 text-center"
                >
                  <p className="text-xs text-muted-foreground">Section {s.section}</p>
                  <p className="mt-2 text-lg font-semibold">
                    {s.correct}/{s.total}
                  </p>

                  <Badge
                    size="xs"
                    variant={
                      s.correct / s.total >= 0.75
                        ? "success"
                        : s.correct / s.total >= 0.5
                        ? "info"
                        : "danger"
                    }
                    className="mt-3"
                  >
                    {Math.round((s.correct / s.total) * 100)}% accuracy
                  </Badge>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* AI COACH CTA */}
        {/* -------------------------------------------------------------- */}
        <section className="bg-muted/40 pb-16 pt-10">
          <Container>
            <Card className="max-w-4xl mx-auto rounded-ds-2xl p-6 bg-card/90 border border-border/60">

              <div className="grid md:grid-cols-2 gap-6">

                <div className="space-y-2">
                  <p className="text-xs tracking-wide uppercase text-primary font-semibold">
                    Next smart move
                  </p>

                  <h3 className="font-slab text-h3">
                    Send this attempt to AI Lab for deeper insights.
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    Find your weakest sections, accent issues, question types, and
                    get personalised practice drills based on this attempt.
                  </p>
                </div>

                <div className="bg-muted rounded-ds-2xl p-4 space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Icon name="Sparkles" size={14} />
                    <span>Recommended flow</span>
                  </div>

                  <ol className="text-xs text-muted-foreground space-y-2">
                    <li>1. Review your accuracy above.</li>
                    <li>2. Send this attempt to AI Lab.</li>
                    <li>3. Get section-wise weakness mapping.</li>
                    <li>4. Reattempt Listening with targeted drills.</li>
                  </ol>

                  <div className="flex gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="secondary"
                      className="rounded-ds-xl w-full"
                    >
                      <Link href={`/ai?listeningAttempt=${attempt.id}`}>
                        Open AI Lab
                      </Link>
                    </Button>

                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="rounded-ds-xl w-full"
                    >
                      <Link href="/mock/listening/history">
                        Back to history
                      </Link>
                    </Button>
                  </div>
                </div>

              </div>

            </Card>
          </Container>
        </section>
      </main>
    </>
  );
};

ListeningResultPage.getLayout = (page: React.ReactNode) => (
  <MockAllLayout>{page}</MockAllLayout>
);

export default ListeningResultPage;

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);
  const attemptId = ctx.params?.attemptId as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: attemptRow } = await supabase
    .from("listening_attempts")
    .select("*, listening_tests (id, title, slug, questions, duration_minutes)")
    .eq("id", attemptId)
    .single();

  if (!attemptRow) {
    return {
      props: { attempt: null, test: null, sectionStats: [], isLoggedIn: !!user },
    };
  }

  const sectionStats: SectionStat[] = [];
  const sectionScores = (attemptRow.section_scores as any) ?? {};
  const questionCount = attemptRow.total_questions ?? attemptRow.questions ?? null;

  Object.keys(sectionScores).forEach((sec) => {
    const bucket = sectionScores[sec];
    const total = Math.max(
      (typeof bucket === "number" ? null : bucket?.total) ??
        Math.floor((questionCount ?? 40) / 4),
      1,
    );
    sectionStats.push({
      section: Number(sec),
      correct:
        typeof bucket === "number" ? bucket : bucket?.correct ?? bucket?.score ?? 0,
      total,
    });
  });

  // Ensure stable order and at least four sections
  if (sectionStats.length === 0 && questionCount) {
    const perSectionTotal = Math.max(Math.floor(questionCount / 4), 1);
    for (let i = 1; i <= 4; i += 1) {
      sectionStats.push({ section: i, correct: 0, total: perSectionTotal });
    }
  }

  sectionStats.sort((a, b) => a.section - b.section);

  return {
    props: {
      attempt: {
        id: attemptRow.id,
        rawScore: attemptRow.raw_score ?? attemptRow.score ?? null,
        bandScore: attemptRow.band_score ?? attemptRow.band ?? null,
        questionCount,
        durationSeconds: attemptRow.duration_seconds,
        createdAt: attemptRow.created_at,
      },
      test: attemptRow.listening_tests
        ? {
            id: attemptRow.listening_tests.id,
            title: attemptRow.listening_tests.title,
            slug: attemptRow.listening_tests.slug,
            totalQuestions:
              attemptRow.listening_tests.questions ??
              (attemptRow.listening_tests as any).question_count ??
              null,
            durationMinutes: attemptRow.listening_tests.duration_minutes,
          }
        : null,
      sectionStats,
      isLoggedIn: !!user,
    },
  };
};
