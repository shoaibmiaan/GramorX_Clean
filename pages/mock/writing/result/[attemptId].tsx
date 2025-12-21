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

type TaskLabel = 'Task 1' | 'Task 2';

type WritingAnswer = {
  taskNumber: 1 | 2;
  label: TaskLabel;
  text: string;
  wordCount: number;
};

type WritingCriteriaKey = 'TR' | 'CC' | 'LR' | 'GRA';

type WritingEvaluation = {
  overallBand: number;
  task1Band: number;
  task2Band: number;
  criteria: Record<WritingCriteriaKey, number>;
  criteriaNotes: Partial<Record<WritingCriteriaKey, string[]>>;
  shortVerdictTask1?: string;
  shortVerdictTask2?: string;
  warnings?: string[];
  nextSteps?: string[];
};

type AttemptMeta = {
  attemptId: string;
  testTitle: string;
  testSlug: string | null; // ✅ allow null so UI can fall back safely
  submittedAt: string | null;
  autoSubmitted: boolean;
  status: string;
};

type PageProps = {
  attemptId: string;
  attempt: AttemptMeta | null;
  answers: WritingAnswer[];
  evaluation: WritingEvaluation | null;
  viewerHasAccess: boolean;
  pending: boolean;
  debug?: { attemptTableTried: string[]; rawAttemptKeys?: string[] };
};

const bandFmt = (n: number | null | undefined) => {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  const fixed = Math.round(n * 2) / 2;
  return fixed % 1 === 0 ? `${fixed.toFixed(0)}.0` : `${fixed.toFixed(1)}`;
};

const safeNum = (v: unknown, fallback = 0) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const pickFirstKey = (obj: any, keys: string[]) => {
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) return k;
  }
  return null;
};

const getStr = (obj: any, key: string | null, fallback = '') => {
  if (!key) return fallback;
  const v = obj?.[key];
  return v == null ? fallback : String(v);
};

const getBool = (obj: any, key: string | null, fallback = false) => {
  if (!key) return fallback;
  const v = obj?.[key];
  return Boolean(v);
};

const getNullableIso = (obj: any, key: string | null) => {
  if (!key) return null;
  const v = obj?.[key];
  return v ? String(v) : null;
};

const isSubmittedLike = (statusRaw: string) => {
  const s = (statusRaw ?? '').toLowerCase().trim();
  return ['submitted', 'complete', 'completed', 'evaluating', 'queued', 'done', 'finished'].includes(s);
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

  // ----------------------------
  // Attempt lookup (flex schema)
  // ----------------------------
  const attemptTablesToTry = ['writing_attempts', 'attempts_writing'];
  let attemptRow: any | null = null;

  for (const table of attemptTablesToTry) {
    const res = await supabase.from(table as any).select('*').eq('id', attemptId).maybeSingle();
    if (res.data) {
      attemptRow = res.data;
      break;
    }
  }

  if (!attemptRow) {
    return {
      props: {
        attemptId,
        attempt: null,
        answers: [],
        evaluation: null,
        viewerHasAccess: false,
        pending: false,
        debug:
          process.env.NODE_ENV !== 'production'
            ? { attemptTableTried: attemptTablesToTry }
            : undefined,
      },
    };
  }

  const ownerKey = pickFirstKey(attemptRow, ['user_id', 'uid', 'profile_id', 'owner_id']);
  const testIdKey = pickFirstKey(attemptRow, ['test_id', 'writing_test_id', 'mock_test_id']);
  const statusKey = pickFirstKey(attemptRow, ['status', 'attempt_status']);
  const submittedAtKey = pickFirstKey(attemptRow, ['submitted_at', 'submittedAt', 'submitted_on']);
  const autoSubmittedKey = pickFirstKey(attemptRow, ['auto_submitted', 'autoSubmitted', 'auto_submit']);

  // ✅ extra: sometimes attempt row already has slug/title fields
  const testSlugKey = pickFirstKey(attemptRow, ['test_slug', 'slug', 'writing_test_slug', 'mock_slug']);
  const testTitleKey = pickFirstKey(attemptRow, ['test_title', 'title', 'mock_title']);

  const ownerId = getStr(attemptRow, ownerKey, '');
  const viewerHasAccess = ownerId && String(ownerId) === String(user.id);

  if (!viewerHasAccess) {
    return {
      props: {
        attemptId,
        attempt: null,
        answers: [],
        evaluation: null,
        viewerHasAccess: false,
        pending: false,
        debug:
          process.env.NODE_ENV !== 'production'
            ? {
                attemptTableTried: attemptTablesToTry,
                rawAttemptKeys: Object.keys(attemptRow ?? {}),
              }
            : undefined,
      },
    };
  }

  // ----------------------------
  // Test meta (flex schema)
  // ----------------------------
  let testTitle = getStr(attemptRow, testTitleKey, '') || 'Writing Mock';
  let testSlug: string | null = (getStr(attemptRow, testSlugKey, '') || null) as string | null;

  const testId = getStr(attemptRow, testIdKey, '');
  if (testId) {
    const testTables = ['writing_tests', 'writing_mock_tests'];
    for (const t of testTables) {
      const tr = await supabase.from(t as any).select('slug, title').eq('id', testId).maybeSingle();
      if (tr.data) {
        testTitle = String((tr.data as any).title ?? testTitle);
        testSlug = String((tr.data as any).slug ?? testSlug ?? '');
        break;
      }
    }
  }

  // ✅ normalize empty slug to null
  if (testSlug && !String(testSlug).trim()) testSlug = null;

  const attempt: AttemptMeta = {
    attemptId,
    testTitle,
    testSlug,
    submittedAt: getNullableIso(attemptRow, submittedAtKey),
    autoSubmitted: getBool(attemptRow, autoSubmittedKey, false),
    status: getStr(attemptRow, statusKey, ''),
  };

  // ----------------------------
  // Answers (flex schema)
  // ----------------------------
  const answersTablesToTry = [
    { table: 'writing_attempt_answers', map: { task: 'task_number', text: 'answer_text', wc: 'word_count' } },
    { table: 'attempts_writing_answers', map: { task: 'task_number', text: 'answer_text', wc: 'word_count' } },
    { table: 'writing_user_answers', map: { task: 'task_number', text: 'text', wc: 'word_count' } },
    { table: 'attempts_writing_user_answers', map: { task: 'task_number', text: 'text', wc: 'word_count' } },
  ];

  let answers: WritingAnswer[] = [];

  for (const a of answersTablesToTry) {
    const res = await supabase
      .from(a.table as any)
      .select('*')
      .eq('attempt_id', attemptId)
      .order(a.map.task, { ascending: true });

    if (Array.isArray(res.data) && res.data.length > 0) {
      answers = res.data.map((r: any) => {
        const tn: 1 | 2 = r[a.map.task] === 2 ? 2 : 1;
        return {
          taskNumber: tn,
          label: (tn === 2 ? 'Task 2' : 'Task 1') as TaskLabel,
          text: String(r[a.map.text] ?? ''),
          wordCount: safeNum(r[a.map.wc], 0),
        };
      });
      break;
    }
  }

  // ----------------------------
  // Evaluation (stored)
  // ----------------------------
  let evaluation: WritingEvaluation | null = null;

  const evalTablesToTry = ['writing_evaluations', 'writing_ai_evaluations'];
  let evalRow: any | null = null;

  for (const t of evalTablesToTry) {
    const er = await supabase.from(t as any).select('*').eq('attempt_id', attemptId).maybeSingle();
    if (er.data) {
      evalRow = er.data;
      break;
    }
  }

  if (evalRow) {
    const criteriaNotesRaw = evalRow.criteria_notes as unknown;
    const safeNotes =
      typeof criteriaNotesRaw === 'object' && criteriaNotesRaw !== null
        ? (criteriaNotesRaw as WritingEvaluation['criteriaNotes'])
        : {};

    evaluation = {
      overallBand: safeNum(evalRow.overall_band, 0),
      task1Band: safeNum(evalRow.task1_band, 0),
      task2Band: safeNum(evalRow.task2_band, 0),
      criteria: {
        TR: safeNum(evalRow.criteria_tr, 0),
        CC: safeNum(evalRow.criteria_cc, 0),
        LR: safeNum(evalRow.criteria_lr, 0),
        GRA: safeNum(evalRow.criteria_gra, 0),
      },
      criteriaNotes: safeNotes,
      shortVerdictTask1: evalRow.short_verdict_task1 ? String(evalRow.short_verdict_task1) : undefined,
      shortVerdictTask2: evalRow.short_verdict_task2 ? String(evalRow.short_verdict_task2) : undefined,
      warnings: Array.isArray(evalRow.warnings) ? (evalRow.warnings as string[]) : [],
      nextSteps: Array.isArray(evalRow.next_steps) ? (evalRow.next_steps as string[]) : [],
    };
  }

  const pending = isSubmittedLike(attempt.status) && !evaluation;

  return {
    props: {
      attemptId,
      attempt,
      answers,
      evaluation,
      viewerHasAccess: true,
      pending,
      debug:
        process.env.NODE_ENV !== 'production'
          ? {
              attemptTableTried: attemptTablesToTry,
              rawAttemptKeys: Object.keys(attemptRow ?? {}),
            }
          : undefined,
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
  debug,
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

  if (!viewerHasAccess || !attempt) {
    return (
      <>
        <Head>
          <title>Writing Result · Not available · GramorX</title>
        </Head>

        <main className="min-h-[100dvh] bg-background">
          <Container className="max-w-3xl py-10">
            <Card className="rounded-ds-2xl border border-border/60 bg-card p-6 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <Icon name="AlertTriangle" size={18} />
              </div>

              <h1 className="mt-3 text-lg font-semibold">Result not available</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                This attempt doesn’t exist, or you don’t have access.
              </p>

              {debug ? (
                <div className="mt-4 rounded-ds-xl border border-border/60 bg-muted/20 p-3 text-left text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Dev debug</p>
                  <p className="mt-1">Tried tables: {debug.attemptTableTried.join(', ')}</p>
                  {debug.rawAttemptKeys?.length ? (
                    <p className="mt-1">Attempt keys: {debug.rawAttemptKeys.join(', ')}</p>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <Button asChild variant="secondary">
                  <Link href="/mock/writing">Back to Writing mocks</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href={`/mock/writing/attempt/${encodeURIComponent(attemptId)}`}>
                    Go back to attempt
                  </Link>
                </Button>
              </div>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  const overall = evaluation ? bandFmt(evaluation.overallBand) : '—';

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
              overallBandLabel={overall}
              submittedAt={attempt.submittedAt}
              status={attempt.status}
              hasEvaluation={Boolean(evaluation)}
            />

            {evaluation ? (
              <>
                <WritingTaskBreakdown
                  task1Band={bandFmt(evaluation.task1Band)}
                  task2Band={bandFmt(evaluation.task2Band)}
                  verdictTask1={evaluation.shortVerdictTask1 ?? ''}
                  verdictTask2={evaluation.shortVerdictTask2 ?? ''}
                />

                <WritingCriteriaGrid
                  criteriaBands={{
                    TR: bandFmt(evaluation.criteria.TR),
                    CC: bandFmt(evaluation.criteria.CC),
                    LR: bandFmt(evaluation.criteria.LR),
                    GRA: bandFmt(evaluation.criteria.GRA),
                  }}
                  criteriaNotes={{
                    TR: evaluation.criteriaNotes.TR ?? [],
                    CC: evaluation.criteriaNotes.CC ?? [],
                    LR: evaluation.criteriaNotes.LR ?? [],
                    GRA: evaluation.criteriaNotes.GRA ?? [],
                  }}
                />

                <WritingWarnings warnings={evaluation.warnings ?? []} answers={answers} />
                <WritingNextSteps nextSteps={evaluation.nextSteps ?? []} />
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
