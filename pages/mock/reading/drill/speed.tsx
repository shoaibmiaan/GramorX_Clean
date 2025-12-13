// pages/mock/reading/drill/speed.tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';

import { getServerClient } from '@/lib/supabaseServer';
import type { ReadingPassage, ReadingQuestion, ReadingTest } from '@/lib/reading/types';
import { hasAtLeast, type PlanTier } from '@/lib/plans';
import withPlan from '@/lib/withPlan';

import { ReadingExamShell } from '@/components/reading/ReadingExamShell';
import { speedTrainingLevels } from '@/data/reading/speedTrainingConfigs';
import { UpgradeGate } from '@/components/payments/UpgradeGate';

// ---------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------

type PageProps = {
  test: ReadingTest | null;
  passages: ReadingPassage[];
  questions: ReadingQuestion[];
  error?: string;
  tier: PlanTier;
};

// ---------------------------------------------------------------------
// HELPERS (defensive: we don’t assume exact config shape)
// ---------------------------------------------------------------------

function getDefaultSpeedConfig() {
  const first = Array.isArray(speedTrainingLevels) ? speedTrainingLevels[0] : null;

  const minutes =
    (first && (first.minutes ?? first.durationMinutes ?? first.timeMinutes)) ?? 8;

  const questionCount =
    (first && (first.questions ?? first.questionCount ?? first.totalQuestions)) ?? 10;

  return {
    minutes: Number(minutes) || 8,
    questionCount: Number(questionCount) || 10,
  };
}

const coerceExamType = (raw: any) => {
  // your shell normalizer likes 'gt' | 'ac' (from your shared code)
  if (raw === 'gt' || raw === 'General Training') return 'gt';
  return 'ac';
};

// ---------------------------------------------------------------------

const SpeedDrillPage: NextPage<PageProps> = ({ test, passages, questions, error, tier }) => {
  const upgradeLabel = 'Upgrade for Focused Practice';
  const showSmartMode = hasAtLeast(tier, 'basic') && !hasAtLeast(tier, 'elite');

  if (error) {
    return (
      <>
        <Head>
          <title>Speed Training · Reading Drill</title>
        </Head>

        <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 pb-20">
          <Container className="py-10 max-w-4xl">
            <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-ds-xl bg-danger/15 text-danger">
                  <Icon name="TriangleAlert" size={18} />
                </div>
                <div className="space-y-2">
                  <h1 className="font-slab text-h3 text-foreground">Couldn’t load Speed Drill</h1>
                  <p className="text-sm text-muted-foreground">{error}</p>
                  <Button asChild variant="secondary" className="rounded-ds-2xl">
                    <Link href="/mock/reading">
                      <Icon name="ChevronLeft" className="h-4 w-4 mr-1" />
                      Back to Reading
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </Container>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Speed Training · Reading Drill</title>
      </Head>

      <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
        {/* Keep the nice header cards in a container */}
        <Container className="py-6 space-y-4">
          {/* Header */}
          <Card className="flex items-center justify-between gap-4 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="neutral" size="sm">
                  Speed drill
                </Badge>
                <Badge variant="info" size="sm">
                  Timed
                </Badge>
              </div>

              <h1 className="text-lg font-semibold">Reading Speed Training</h1>
              <p className="text-sm text-muted-foreground">
                Train your reading pace under strict time pressure.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {showSmartMode && (
                <Button href="/pricing" size="sm" variant="secondary">
                  <Icon name="sparkles" className="mr-1 h-4 w-4" />
                  Upgrade to Smart Mode
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link href="/mock/reading">
                  <Icon name="ChevronLeft" className="h-4 w-4 mr-1" />
                  Back to Reading
                </Link>
              </Button>
            </div>
          </Card>

          <UpgradeGate
            required="basic"
            tier={tier}
            variant="overlay"
            title="Speed drills"
            description="Upgrade to unlock focused practice drills with timing controls."
            ctaLabel={upgradeLabel}
            ctaFullWidth
          >
            {/* Speed level info */}
            <Card className="p-4 flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-ds-xl bg-primary/10 text-primary">
                <Icon name="Clock" className="h-5 w-5" />
              </div>

              <div>
                <div className="text-sm font-medium">Speed Mode</div>
                <p className="text-xs text-muted-foreground">
                  Shorter time · fewer questions · no distractions
                </p>
              </div>
            </Card>
          </UpgradeGate>
        </Container>

        {/* IMPORTANT: Exam shell should be full-bleed; don’t wrap it in Container padding */}
        <section className="px-0">
          <UpgradeGate
            required="basic"
            tier={tier}
            variant="overlay"
            title="Start speed drill"
            description="Unlock Reading drills to practise with timers and adaptive question sets."
            ctaLabel={upgradeLabel}
            ctaFullWidth
          >
            <ReadingExamShell
              test={test}
              passages={passages}
              questions={questions}
              mode="speed"
              speedLevels={speedTrainingLevels}
            />
          </UpgradeGate>
        </section>
      </main>
    </>
  );
};

// ---------------------------------------------------------------------
// SSR (FIXED)
// ---------------------------------------------------------------------

export const getServerSideProps: GetServerSideProps<PageProps> = withPlan('free', async (ctx, planCtx) => {
  const cfg = getDefaultSpeedConfig();

  try {
    const supabase = getServerClient(ctx.req, ctx.res);

    // Auth
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        redirect: {
          destination: '/login?next=/mock/reading/drill/speed',
          permanent: false,
        },
      } as const;
    }

    // Prefer a dedicated speed test if you have one; fallback to latest active
    const { data: speedTestRow, error: speedTestErr } = await supabase
      .from('reading_tests')
      .select('id, slug, title, description, exam_type, difficulty, tags')
      .eq('mode', 'speed')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (speedTestErr) throw speedTestErr;

    const { data: baseTestRow, error: baseTestErr } = !speedTestRow
      ? await supabase
          .from('reading_tests')
          .select('id, slug, title, description, exam_type, difficulty, tags')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : ({ data: null, error: null } as any);

    if (baseTestErr) throw baseTestErr;

    const chosenTestRow = speedTestRow ?? baseTestRow;
    if (!chosenTestRow) throw new Error('No active Reading test found for drill mode.');

    // Load passages for that test only
    const { data: passagesRows, error: passagesErr } = await supabase
      .from('reading_passages')
      .select('*')
      .eq('test_id', chosenTestRow.id)
      .order('passage_order', { ascending: true });

    if (passagesErr) throw passagesErr;

    const allPassages = (passagesRows ?? []) as any[];
    const chosenPassage = allPassages[0];
    if (!chosenPassage) throw new Error('No passages found for the selected Reading test.');

    // Load questions for that test only
    const { data: questionsRows, error: questionsErr } = await supabase
      .from('reading_questions')
      .select('*')
      .eq('test_id', chosenTestRow.id)
      .order('question_order', { ascending: true });

    if (questionsErr) throw questionsErr;

    const allQuestions = (questionsRows ?? []) as any[];

    // Filter by passage (handles passage_id vs passageId)
    const passageQuestions = allQuestions.filter(
      (q) => (q.passage_id ?? q.passageId) === chosenPassage.id,
    );

    // Slice to drill size
    const drillQuestions = passageQuestions.slice(0, cfg.questionCount);

    // IMPORTANT: map to what ReadingExamShell expects (camel-ish)
    // Your ReadingExamShell normalizeTest reads: id, title, examType, durationSeconds
    const drillTest: ReadingTest = {
      id: chosenTestRow.id,
      title: 'Reading Speed Training',
      examType: coerceExamType(chosenTestRow.exam_type),
      durationSeconds: cfg.minutes * 60,

      // keep extras for other UI bits (safe)
      ...(chosenTestRow as any),
      description: 'Speed Drill',
      totalPassages: 1,
      totalQuestions: drillQuestions.length,
    } as any;

    return {
      props: {
        test: drillTest,
        passages: [chosenPassage] as any,
        questions: drillQuestions as any,
        tier: planCtx.tier,
      },
    } as const;
  } catch (err: any) {
    return {
      props: {
        test: {
          id: null,
          title: 'Reading Speed Training',
          examType: 'ac',
          durationSeconds: cfg.minutes * 60,
          totalPassages: 1,
          totalQuestions: 0,
        } as any,
        passages: [],
        questions: [],
        error: err?.message ?? 'Failed to load speed drill.',
        tier: planCtx.tier,
      },
    } as const;
  }
});

export default SpeedDrillPage;
