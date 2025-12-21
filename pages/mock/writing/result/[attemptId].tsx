// pages/mock/writing/result/[attemptId].tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';

import { getServerClient } from '@/lib/supabaseServer';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { Icon } from '@/components/design-system/Icon';

import { WritingResultSummary } from '@/components/writing/result/WritingResultSummary';
import { WritingTaskBreakdown } from '@/components/writing/result/WritingTaskBreakdown';
import { WritingCriteriaGrid } from '@/components/writing/result/WritingCriteriaGrid';
import { WritingWarnings } from '@/components/writing/result/WritingWarnings';
import { WritingNextSteps } from '@/components/writing/result/WritingNextSteps';
import { WritingResultLoading } from '@/components/writing/result/WritingResultLoading';
import { WritingResultEmptyState } from '@/components/writing/result/WritingResultEmptyState';
import { getWritingAttempt, getWritingEvaluation } from '@/lib/writing/api';
import { WritingFeedbackBlocks } from '@/components/writing/result/WritingFeedbackBlocks';
import { WritingBandReasoning } from '@/components/writing/result/WritingBandReasoning';
import { WritingImprovementsTable } from '@/components/writing/result/WritingImprovementsTable';
import { formatFeedback } from '@/lib/writing/format/formatFeedback';
import {
  formatBandScore,
  hasSubmittedStatus,
  type WritingAnswer,
  type WritingEvaluation,
  type WritingAttemptMeta,
} from '@/lib/writing/types';

type PageProps = {
  attemptId: string;
  attempt: WritingAttemptMeta | null;
  answers: WritingAnswer[];
  evaluation: WritingEvaluation | null;
  viewerHasAccess: boolean;
  pending: boolean;
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const attemptId = typeof ctx.params?.attemptId === 'string' ? ctx.params.attemptId : null;
  if (!attemptId) return { notFound: true };

  const supabase = getServerClient(ctx.req, ctx.res);
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=/mock/writing/result/${encodeURIComponent(attemptId)}`,
        permanent: false,
      },
    };
  }

  const { attempt, viewerHasAccess } = await getWritingAttempt(attemptId, ctx.req, ctx.res);
  const { answers, evaluation } = viewerHasAccess
    ? await getWritingEvaluation(attemptId, ctx.req, ctx.res)
    : { answers: [], evaluation: null };

  const pending = Boolean(attempt && hasSubmittedStatus(attempt.status) && !evaluation);

  return {
    props: {
      attemptId,
      attempt,
      answers,
      evaluation,
      viewerHasAccess,
      pending,
    },
  };
};

const WritingResultPage: NextPage<PageProps> = ({
  attemptId,
  attempt,
  answers,
  evaluation,
  viewerHasAccess,
  pending,
}) => {
  const router = useRouter();
  const [autoRefresh, setAutoRefresh] = React.useState(true);

  React.useEffect(() => {
    if (!pending || !autoRefresh) return;

    let ticks = 0;
    const id = window.setInterval(() => {
      ticks += 1;
      if (ticks > 60) {
        window.clearInterval(id);
        setAutoRefresh(false);
        return;
      }
      void router.replace(router.asPath, undefined, { scroll: false });
    }, 3000);

    return () => window.clearInterval(id);
  }, [pending, autoRefresh, router]);

  if (router.isFallback) return <WritingResultLoading />;
  if (!viewerHasAccess) return <WritingResultEmptyState reason="no_access" attemptId={attemptId} />;
  if (!attempt) return <WritingResultEmptyState reason="not_found" attemptId={attemptId} />;
  if (!evaluation && !pending) return <WritingResultEmptyState reason="not_evaluated" attemptId={attemptId} />;

  const overallBandLabel = evaluation ? formatBandScore(evaluation.overallBand) : '—';
  const formatted = formatFeedback(evaluation, answers);

  // ✅ Retry link: if slug missing, go to writing hub (no more 404)
  const retryHref = attempt.testSlug ? `/mock/writing/${encodeURIComponent(attempt.testSlug)}` : '/mock/writing';

  return (
    <>
      <Head>
        <title>{attempt.testTitle} · Result · GramorX</title>
      </Head>

      <main className="min-h-[100dvh] bg-background">
        <section className="border-b border-border/60 bg-card/60">
          <Container className="max-w-6xl py-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="neutral" size="xs">
                    Writing Result
                  </Badge>

                  {attempt.autoSubmitted ? (
                    <Badge tone="warning" size="xs">
                      Auto-submitted
                    </Badge>
                  ) : null}

                  <Badge tone="neutral" size="xs">
                    Attempt {attempt.attemptId.slice(0, 8)}
                  </Badge>

                  {pending ? (
                    <Badge tone="info" size="xs">
                      Evaluating…
                    </Badge>
                  ) : null}
                </div>

                <h1 className="text-xl font-semibold text-foreground">{attempt.testTitle}</h1>
                <p className="text-xs text-muted-foreground">
                  Training band can be slightly stricter than IELTS. Real exam is usually within ±0.5.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={retryHref}>
                    <Icon name="RotateCcw" size={16} className="mr-1.5" />
                    Retry test
                  </Link>
                </Button>

                <Button asChild variant="ghost" size="sm">
                  <Link href="/mock/writing">
                    <Icon name="ArrowLeft" size={16} className="mr-1.5" />
                    Back
                  </Link>
                </Button>
              </div>
            </div>
          </Container>
        </section>

        <Container className="max-w-6xl py-6">
          <div className="grid gap-5">
            <WritingResultSummary
              overallBandLabel={overallBandLabel}
              submittedAt={attempt.submittedAt}
              status={attempt.status}
              hasEvaluation={Boolean(evaluation)}
            />
            {formatted.summary.length ? (
              <Card className="rounded-ds-2xl border border-border/60 bg-muted/20 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Summary
                </p>
                <ul className="mt-2 space-y-1 text-sm text-foreground">
                  {formatted.summary.slice(0, 3).map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-border" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            {evaluation ? (
              <>
                <WritingTaskBreakdown
                  task1Band={formatBandScore(evaluation.task1.band)}
                  task2Band={formatBandScore(evaluation.task2.band)}
                  verdictTask1={evaluation.task1.shortVerdict ?? ''}
                  verdictTask2={evaluation.task2.shortVerdict ?? ''}
                />

                <WritingCriteriaGrid
                  criteriaBands={{
                    TR: formatBandScore(evaluation.criteria.TR.band),
                    CC: formatBandScore(evaluation.criteria.CC.band),
                    LR: formatBandScore(evaluation.criteria.LR.band),
                    GRA: formatBandScore(evaluation.criteria.GRA.band),
                  }}
                  criteriaNotes={{
                    TR: evaluation.criteria.TR.notes,
                    CC: evaluation.criteria.CC.notes,
                    LR: evaluation.criteria.LR.notes,
                    GRA: evaluation.criteria.GRA.notes,
                  }}
                />

                <WritingWarnings warnings={formatted.warnings} answers={answers} />
                <WritingFeedbackBlocks blocks={formatted.blocks} />
                <WritingBandReasoning items={formatted.bandReasoning} />
                <WritingImprovementsTable rows={formatted.improvements} />
                <WritingNextSteps nextSteps={evaluation.nextSteps ?? []} exampleBand={evaluation.overallBand} />
              </>
            ) : (
              <Card className="rounded-ds-2xl border border-border/60 bg-card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon name="Loader2" size={18} className="animate-spin" />
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">Evaluation pending</p>
                      <p className="text-sm text-muted-foreground">
                        Your attempt is submitted. Evaluation hasn’t been stored yet.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Auto-refresh is on. It will stop automatically after ~3 minutes.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => void router.replace(router.asPath, undefined, { scroll: false })}
                    >
                      Refresh now
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setAutoRefresh(false)}>
                      Stop auto-refresh
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </Container>
      </main>
    </>
  );
};

export default WritingResultPage;
