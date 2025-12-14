// pages/mock/reading/history/index.tsx
import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import { getServerClient } from "@/lib/supabaseServer";
import type { Database } from "@/lib/database.types";

import { Container } from "@/components/design-system/Container";
import { Card } from "@/components/design-system/Card";
import { Button } from "@/components/design-system/Button";
import { Icon } from "@/components/design-system/Icon";

import {
  ReadingHistoryTable,
  type ReadingHistoryRow,
} from "@/components/reading/history/ReadingHistoryTable";

type PageProps = {
  rows: ReadingHistoryRow[];
  filterSlug?: string | null;
  filterTitle?: string | null;
  error?: string | null;
};

const safeDateTime = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  // guard against invalid dates
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

const ReadingHistoryPage: NextPage<PageProps> = ({
  rows,
  filterSlug,
  filterTitle,
  error,
}) => {
  const hasFilter = !!filterSlug;

  // Keep client-side filter (still useful if you ever pass full rows + change query behavior),
  // but SSR already filters when ?test= is present.
  const displayRows = React.useMemo(
    () =>
      hasFilter && filterSlug
        ? rows.filter((r) => r.testSlug === filterSlug)
        : rows,
    [rows, hasFilter, filterSlug],
  );

  const stats = React.useMemo(() => {
    if (!displayRows.length) {
      return {
        total: 0,
        distinctTests: 0,
        bestBand: null as number | null,
        latest: null as string | null,
      };
    }

    const total = displayRows.length;
    const byTest = new Set(displayRows.map((r) => r.testSlug));
    const bands = displayRows
      .map((r) => r.bandScore)
      .filter((b): b is number => typeof b === "number");
    const bestBand = bands.length ? Math.max(...bands) : null;
    const latest = displayRows[0]?.createdAt ?? null;

    return {
      total,
      distinctTests: byTest.size,
      bestBand,
      latest,
    };
  }, [displayRows]);

  return (
    <>
      <Head>
        <title>Reading History · GramorX</title>
        <meta
          name="description"
          content="Your IELTS Reading mock attempt history with quick access to results and reviews."
        />
      </Head>

      <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 pb-20">
        <section className="pt-10 md:pt-14">
          <Container>
            {/* Header */}
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  IELTS Reading · Attempts
                </p>

                <h1 className="font-slab text-h1 leading-tight text-foreground">
                  History
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  {hasFilter ? (
                    <>
                      Filtered by test:{" "}
                      <span className="font-semibold text-foreground">
                        {filterTitle ?? filterSlug}
                      </span>
                      <span className="mx-2">•</span>
                      <Link
                        href="/mock/reading/history"
                        className="text-primary hover:underline"
                      >
                        Clear filter
                      </Link>
                    </>
                  ) : (
                    "All your Reading attempts, newest first."
                  )}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="secondary" className="rounded-ds-xl">
                  <Link href="/mock/reading">
                    <Icon name="ChevronLeft" className="mr-1 h-4 w-4" />
                    Reading home
                  </Link>
                </Button>

                <Button asChild className="rounded-ds-xl">
                  <Link href="/mock/reading">
                    <Icon name="PlayCircle" className="mr-1 h-4 w-4" />
                    Start a mock
                  </Link>
                </Button>
              </div>
            </div>

            {/* Stats strip */}
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              <Card className="rounded-ds-2xl border border-border/70 bg-card/90 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-ds-xl bg-primary/10 text-primary">
                    <Icon name="ListChecks" className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Total attempts
                    </span>
                    <div className="text-base font-semibold text-foreground">
                      {stats.total}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="rounded-ds-2xl border border-border/70 bg-card/90 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-ds-xl bg-primary/10 text-primary">
                    <Icon name="BookOpen" className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Tests attempted
                    </span>
                    <div className="text-base font-semibold text-foreground">
                      {stats.distinctTests}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="rounded-ds-2xl border border-border/70 bg-card/90 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-ds-xl bg-primary/10 text-primary">
                    <Icon name="Clock" className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Last attempt
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {stats.latest ? safeDateTime(stats.latest) : "No attempts yet"}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Table / Empty */}
            {error ? (
              <Card className="flex flex-col gap-3 rounded-ds-2xl border border-border/70 bg-danger/5 p-6 text-danger shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Icon name="TriangleAlert" className="h-4 w-4" />
                  Couldn’t load your Reading attempts
                </div>
                <p className="text-xs text-danger/80">{error}</p>
                <div className="text-xs text-danger/80">
                  Please refresh the page or try again later. If the issue persists, contact support.
                </div>
              </Card>
            ) : displayRows.length === 0 ? (
              <Card className="flex flex-col items-center justify-center rounded-ds-2xl border border-border/70 bg-card/90 p-8 text-center shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Icon name="History" className="h-6 w-6 text-muted-foreground" />
                </div>

                <h2 className="mt-4 text-lg font-semibold">
                  No Reading attempts yet
                </h2>

                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  {hasFilter
                    ? "You haven’t attempted this specific Reading mock yet. Start a full attempt to see it here."
                    : "Once you complete a strict Reading mock, you’ll see each attempt here with band score, accuracy, and quick links to result and review."}
                </p>

                <Button asChild className="mt-5 rounded-ds-xl">
                  <Link href="/mock/reading">
                    <Icon name="PlayCircle" className="mr-1 h-4 w-4" />
                    Go to Reading mocks
                  </Link>
                </Button>
              </Card>
            ) : (
              <ReadingHistoryTable rows={displayRows} />
            )}
          </Container>
        </section>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient<Database>(ctx.req, ctx.res);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: "/login?next=/mock/reading/history",
        permanent: false,
      },
    };
  }

  const testSlug = typeof ctx.query.test === "string" ? ctx.query.test.trim() : null;

  // Lightweight select: no meta, no answers payload.
  // Also supports DB-side filter when ?test=<slug> is present.
  let q = supabase
    .from("reading_attempts")
    .select(
      `
        id,
        status,
        created_at,
        raw_score,
        band_score,
        reading_tests!inner (
          slug,
          title,
          total_questions
        )
      `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(120);

  if (testSlug) {
    q = q.eq("reading_tests.slug", testSlug);
  }

  const { data, error } = await q;

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Reading history error:", error);
    return {
      props: {
        rows: [],
        filterSlug: testSlug ?? null,
        filterTitle: null,
        error: error.message ?? "Unexpected error",
      },
    };
  }

  type Row = {
    id: string;
    status: string | null;
    created_at: string;
    raw_score: number | null;
    band_score: number | null;
    reading_tests: { slug: string; title: string; total_questions: number | null } | null;
  };

  const rows: ReadingHistoryRow[] = ((data ?? []) as Row[]).map((attempt) => {
    const totalQuestions = attempt.reading_tests?.total_questions ?? 40;

    return {
      attemptId: attempt.id,
      testSlug: attempt.reading_tests?.slug ?? "unknown",
      testTitle: attempt.reading_tests?.title ?? "Untitled Test",
      bandScore:
        attempt.band_score !== null && attempt.band_score !== undefined
          ? Number(attempt.band_score)
          : null,
      rawScore:
        attempt.raw_score !== null && attempt.raw_score !== undefined
          ? Number(attempt.raw_score)
          : null,
      totalQuestions,
      createdAt: attempt.created_at,
      status: attempt.status,
    };
  });

  const filterTitle =
    testSlug && rows.length > 0
      ? rows.find((r) => r.testSlug === testSlug)?.testTitle ?? null
      : null;

  return {
    props: {
      rows,
      filterSlug: testSlug ?? null,
      filterTitle,
    },
  };
};

export default ReadingHistoryPage;
