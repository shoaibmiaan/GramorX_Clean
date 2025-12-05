// pages/mock/listening/review/[attemptId].tsx
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

type ReviewAnswer = {
  id: string;
  questionNumber: number;
  section: number;
  userAnswer: string | null;
  correctAnswer: string | null;
  isCorrect: boolean;
};

type AttemptSummary = {
  id: string;
  rawScore: number | null;
  bandScore: number | null;
  questionCount: number | null;
  createdAt: string;
};

type TestSummary = {
  id: string;
  title: string;
  slug: string;
  totalQuestions: number | null;
};

type PageProps = {
  attempt: AttemptSummary | null;
  test: TestSummary | null;
  answers: ReviewAnswer[];
  isLoggedIn: boolean;
};

const ListeningReviewPage: NextPage<PageProps> & {
  getLayout?: (page: React.ReactNode) => React.ReactNode;
} = ({
  attempt,
  test,
  answers,
  isLoggedIn,
}) => {
  const notFound = !attempt || !test;

  if (notFound) {
    return (
      <>
        <Head>
          <title>Listening Review · GramorX</title>
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
                    Review not available
                  </p>
                  <p className="text-sm text-grayish">
                    {isLoggedIn
                      ? "We couldn't find that attempt. Please retry a Listening mock."
                      : "You need to be logged in to view this review."}
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

  const sections = Array.from(
    new Set(answers.map((a) => a.section)),
  ).sort((a, b) => a - b);

  return (
    <>
      <Head>
        <title>Listening Review · GramorX</title>
      </Head>

      <main className="bg-lightBg dark:bg-dark/90 pb-20">

        {/* -------------------------------------------------------------- */}
        {/* HEADER */}
        {/* -------------------------------------------------------------- */}
        <section className="py-10 md:py-14 border-b border-border/40 bg-card/70 backdrop-blur">
          <Container className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-ds-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Icon name="Headphones" size={14} />
              <span>Listening Review</span>
            </div>

            <h1 className="font-slab text-h2 leading-tight">
              Check your answers for: {test.title}
            </h1>

            <p className="text-sm text-muted-foreground max-w-xl">
              Every question. Your answer vs correct answer. Clean and simple.
            </p>

            <div className="flex gap-3 pt-3">
              <Button
                asChild
                size="md"
                variant="primary"
                className="rounded-ds-xl"
              >
                <Link href="/mock/listening">Retry Listening mock</Link>
              </Button>

              <Button
                asChild
                size="md"
                variant="secondary"
                className="rounded-ds-xl"
              >
                <Link href={`/mock/listening/result/${attempt.id}`}>
                  Back to result
                </Link>
              </Button>
            </div>
          </Container>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* SCORE SUMMARY */}
        {/* -------------------------------------------------------------- */}
        <section className="py-12">
          <Container>
            <Card className="rounded-ds-2xl p-6 border border-border/60 bg-card/80">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Band</p>
                  <p className="text-3xl font-bold">{attempt.bandScore ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Correct</p>
                  <p className="text-3xl font-bold">
                    {attempt.rawScore}/{attempt.questionCount ?? test.totalQuestions}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-lg font-semibold">
                    {new Date(attempt.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>
          </Container>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* ANSWER REVIEW */}
        {/* -------------------------------------------------------------- */}
        <section className="pb-12">
          <Container>

            <div className="space-y-10">
              {sections.map((sec) => (
                <div key={sec} className="space-y-4">
                  <h2 className="font-slab text-h4">Section {sec}</h2>

                  <div className="space-y-4">
                    {answers
                      .filter((a) => a.section === sec)
                      .sort((a, b) => a.questionNumber - b.questionNumber)
                      .map((a) => (
                        <Card
                          key={a.id}
                          className="rounded-ds-2xl p-5 border border-border/60 bg-card/80"
                        >
                          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">

                            {/* Question number */}
                            <div className="flex items-center gap-2">
                              <Badge size="sm" variant="neutral">
                                Q{a.questionNumber}
                              </Badge>

                              {a.isCorrect ? (
                                <Badge size="sm" variant="success">
                                  Correct
                                </Badge>
                              ) : (
                                <Badge size="sm" variant="danger">
                                  Incorrect
                                </Badge>
                              )}
                            </div>

                            {/* Answers */}
                            <div className="flex flex-col gap-1 text-sm">
                              <p className="text-muted-foreground">
                                Your answer:{" "}
                                <span
                                  className={
                                    a.isCorrect
                                      ? "text-success font-medium"
                                      : "text-danger font-medium"
                                  }
                                >
                                  {a.userAnswer ?? "—"}
                                </span>
                              </p>

                              <p className="text-muted-foreground">
                                Correct answer:{" "}
                                <span className="text-foreground font-medium">
                                  {a.correctAnswer ?? "—"}
                                </span>
                              </p>
                            </div>

                          </div>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </div>

          </Container>
        </section>

        {/* -------------------------------------------------------------- */}
        {/* AI LAB CTA */}
        {/* -------------------------------------------------------------- */}
        <section className="bg-muted/40 py-14">
          <Container>
            <Card className="rounded-ds-2xl p-6 bg-card/90 border border-border/60 max-w-4xl mx-auto">
              <div className="grid gap-6 md:grid-cols-2">

                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-primary font-semibold">
                    Next smart move
                  </p>

                  <h3 className="font-slab text-h3">Fix your Listening weaknesses with AI.</h3>

                  <p className="text-sm text-muted-foreground">
                    AI Lab will highlight which sections, accents, and question formats
                    you consistently struggle with.
                  </p>
                </div>

                <div className="bg-muted rounded-ds-2xl p-4 text-sm space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <Icon name="Sparkles" size={14} />
                    <span>Recommended flow</span>
                  </div>

                  <ol className="text-xs text-muted-foreground space-y-2">
                    <li>1. Review your incorrect answers above.</li>
                    <li>2. Send this attempt to AI Lab.</li>
                    <li>3. Get analysis by section, accent & question type.</li>
                    <li>4. Retake Listening mocks with targeted drills.</li>
                  </ol>

                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="secondary"
                      size="sm"
                      className="rounded-ds-xl w-full"
                    >
                      <Link href={`/ai?attempt=${attempt.id}`}>Open AI Lab</Link>
                    </Button>

                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="rounded-ds-xl w-full"
                    >
                      <Link href="/mock/listening/history">Back to history</Link>
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

ListeningReviewPage.getLayout = (page: React.ReactNode) => (
  <MockAllLayout>{page}</MockAllLayout>
);

export default ListeningReviewPage;

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);
  const attemptId = ctx.params?.attemptId as string;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: attemptRow } = await supabase
    .from("listening_attempts")
    .select("*, listening_tests (id, title, slug, questions)")
    .eq("id", attemptId)
    .single();

  if (!attemptRow) {
    return {
      props: {
        attempt: null,
        test: null,
        answers: [],
        isLoggedIn: !!user,
      },
    };
  }

  const { data: answerRows } = await supabase
    .from("listening_attempt_answers")
    .select("*")
    .eq("attempt_id", attemptId)
    .order("question_number", { ascending: true });

  const answers: ReviewAnswer[] =
    answerRows?.map((a: any) => ({
      id: a.id,
      questionNumber: a.question_number ?? a.qno ?? 0,
      section: a.section ?? 1,
      userAnswer: a.user_answer,
      correctAnswer: a.correct_answer,
      isCorrect:
        typeof a.is_correct === "boolean"
          ? a.is_correct
          : a.user_answer?.trim().toLowerCase() === a.correct_answer?.trim().toLowerCase(),
    })) ?? [];

  return {
    props: {
      attempt: {
        id: attemptRow.id,
        rawScore: attemptRow.raw_score ?? attemptRow.score ?? null,
        bandScore: attemptRow.band_score ?? attemptRow.band ?? null,
        questionCount: attemptRow.total_questions ?? attemptRow.questions,
        createdAt: attemptRow.created_at,
      },
      test: attemptRow.listening_tests
        ? {
            id: attemptRow.listening_tests.id,
            title: attemptRow.listening_tests.title,
            slug: attemptRow.listening_tests.slug,
            totalQuestions: attemptRow.listening_tests.questions,
          }
        : null,
      answers,
      isLoggedIn: !!user,
    },
  };
};
