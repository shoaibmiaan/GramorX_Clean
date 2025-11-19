// pages/mock/listening/submitted.tsx
import * as React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

type ListeningAttempt = {
  id: string;
  test_slug: string;
  score: number | null;
  band: number | null;
  section_scores: any;
  submitted_at: string | null;
  meta?: any;
};

type ListeningReviewResponse = {
  attempt: ListeningAttempt;
  test: { slug: string; title: string } | null;
  answers: any[];
  questions: any[];
  sections: any[];
};

const ListeningSubmittedPage: NextPage = () => {
  const router = useRouter();
  const attemptId = (router.query.attemptId as string | undefined) ?? null;

  const [data, setData] = React.useState<ListeningReviewResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!attemptId) return;

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/listening/review/${encodeURIComponent(attemptId)}`
        );
        if (!res.ok) {
          throw new Error('Failed to load attempt');
        }

        const json = (await res.json()) as ListeningReviewResponse;
        if (cancelled) return;

        setData(json);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(
            'Could not load your mock result. Try again or open from Mock Dashboard.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  const attempt = data?.attempt ?? null;
  const test = data?.test ?? null;
  const totalQuestions = data?.questions?.length ?? 40;
  const score = attempt?.score ?? null;
  const band = attempt?.band ?? null;

  const sectionScores: any[] = Array.isArray(attempt?.section_scores)
    ? (attempt?.section_scores as any[])
    : [];

  function renderBody() {
    if (!attemptId) {
      return (
        <Card className="rounded-ds-3xl p-6">
          <p className="text-sm font-semibold">
            Missing attemptId in the URL.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Open this page from the end of a mock test or from the Mock Dashboard.
          </p>
          <div className="mt-4 flex gap-2">
            <Button
              asChild
              variant="secondary"
              size="sm"
              className="rounded-ds-2xl"
            >
              <Link href="/mock">Back to Mock Home</Link>
            </Button>
          </div>
        </Card>
      );
    }

    if (loading) {
      return (
        <Card className="rounded-ds-3xl p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-primary/10">
              <Icon name="Loader2" className="h-4 w-4 animate-spin" />
            </span>
            <div>
              <p className="text-sm font-medium">Crunching your mock...</p>
              <p className="text-xs text-muted-foreground">
                We&rsquo;re pulling your score and section breakdown.
              </p>
            </div>
          </div>
        </Card>
      );
    }

    if (error || !attempt) {
      return (
        <Card className="rounded-ds-3xl border-red-500/40 bg-red-950/40 p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
              <Icon name="TriangleAlert" className="h-4 w-4 text-red-400" />
            </span>
            <div>
              <p className="text-sm font-semibold text-red-50">
                Couldn&apos;t load this result.
              </p>
              <p className="mt-1 text-xs text-red-100/80">
                {error ??
                  'Something broke while loading. Open this attempt from the Mock Dashboard again.'}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  asChild
                  size="sm"
                  variant="secondary"
                  className="rounded-ds-2xl"
                >
                  <Link href="/mock/dashboard">Go to Mock Dashboard</Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-ds-2xl"
                  onClick={() => router.reload()}
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    const submittedAt = attempt.submitted_at
      ? new Date(attempt.submitted_at)
      : null;

    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.4fr)]">
        {/* LEFT: Big score card */}
        <Card className="rounded-ds-3xl p-6">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Listening Mock Result
              </p>
              <h1 className="font-slab text-h3">
                {test?.title ?? 'Listening Mock'}
              </h1>
              {submittedAt && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Submitted{' '}
                  {submittedAt.toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              )}
            </div>
            <Badge tone="success" size="sm">
              Attempt #{attempt.id.slice(0, 6)}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <span className="font-slab text-4xl">
                  {band != null ? band.toFixed(1) : '–'}
                </span>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Band estimate
                </p>
                <p className="text-sm text-muted-foreground">
                  IELTS Listening band based on this attempt.
                </p>
              </div>
            </div>

            <div className="h-10 w-px bg-border/70" />

            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Raw score
              </p>
              <p className="text-sm font-semibold">
                {score != null ? score : '–'} / {totalQuestions}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Correct answers out of total questions.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              asChild
              size="sm"
              variant="primary"
              className="rounded-ds-2xl"
            >
              <Link href="/mock/dashboard">View Mock Dashboard</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="secondary"
              className="rounded-ds-2xl"
            >
              <Link href="/mock/listening/overview">
                Take another Listening Mock
              </Link>
            </Button>
          </div>
        </Card>

        {/* RIGHT: section breakdown + meta */}
        <div className="space-y-4">
          <Card className="rounded-ds-3xl p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Section breakdown
              </p>
            </div>

            {sectionScores.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Section-wise scores are not available for this attempt.
              </p>
            ) : (
              <div className="space-y-2">
                {sectionScores.map((s: any, idx: number) => {
                  const label =
                    s.label ??
                    (typeof s.section === 'number'
                      ? `Section ${s.section}`
                      : `Section ${idx + 1}`);
                  const correct =
                    typeof s.correct === 'number'
                      ? s.correct
                      : Number(s.correct ?? NaN);
                  const total =
                    typeof s.total === 'number'
                      ? s.total
                      : Number(s.total ?? NaN);
                  const pct =
                    Number.isFinite(correct) && Number.isFinite(total) && total > 0
                      ? Math.round((correct / total) * 100)
                      : null;

                  // Map percentage into Tailwind width buckets (no inline styles)
                  let widthClass = 'w-0';
                  if (pct != null) {
                    if (pct >= 90) widthClass = 'w-full';
                    else if (pct >= 70) widthClass = 'w-3/4';
                    else if (pct >= 50) widthClass = 'w-1/2';
                    else if (pct >= 25) widthClass = 'w-1/4';
                    else if (pct > 0) widthClass = 'w-[10%]';
                  }

                  return (
                    <div
                      key={idx}
                      className="rounded-ds-2xl border border-muted bg-muted/40 px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <p className="font-medium">{label}</p>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {Number.isFinite(correct) && Number.isFinite(total)
                            ? `${correct}/${total}`
                            : '–'}
                        </span>
                      </div>
                      {pct != null && (
                        <div className="mt-1.5">
                          <div className="h-1.5 w-full rounded-full bg-muted">
                            <div
                              className={`h-1.5 rounded-full bg-primary transition-all ${widthClass}`}
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {pct}% correct in this section.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="rounded-ds-3xl border-dashed p-4 text-[11px] text-muted-foreground">
            <p className="mb-1 font-medium text-foreground">What next?</p>
            <p>
              Use this band as a checkpoint, not a label. Hit another mock after
              fixing your weak sections, then watch the band climb in the Mock
              Dashboard.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Listening Mock Result • GramorX</title>
        <meta
          name="description"
          content="Your IELTS-style Listening mock result and band estimate."
        />
      </Head>
      <main className="min-h-screen bg-background py-8">
        <Container>{renderBody()}</Container>
      </main>
    </>
  );
};

export default ListeningSubmittedPage;
