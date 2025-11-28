import * as React from 'react';
import Head from 'next/head';
import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';
import { readingPracticeList } from '@/data/reading';
import { readingBandFromRaw } from '@/lib/reading/band';

type ReadingAttemptRow = {
  id: string;
  paper_id: string | null;
  submitted_at: string | null;
  answers: Record<string, unknown> | null;
  score: number | null;
  total: number | null;
  duration_sec: number | null;
};

type ReadingTestRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: string;
  total_questions: number;
  duration_seconds: number;
};

type LeaderboardRow = {
  rank: number | null;
  reading_band: number | null;
  total_xp: number | null;
};

type PassageBreakdown = {
  passageId: string;
  passageLabel: string;
  correct: number;
  total: number;
};

type TypeBreakdown = {
  type: string;
  correct: number;
  total: number;
};

type ReadingResultBreakdown = {
  totalQuestions: number;
  answeredQuestions: number;
  correctQuestions: number;
  accuracyPercent: number;
  timeTakenSeconds: number | null;
  passageBreakdown: PassageBreakdown[];
  typeBreakdown: TypeBreakdown[];
};

type ReadingResultPageProps = {
  slug: string;
  attemptId: string;
  testTitle: string;
  difficulty: string;
  durationSeconds: number;
  bandScore: number | null;
  rawScore: number | null;
  breakdown: ReadingResultBreakdown;
  leaderboard: LeaderboardRow | null;
  previousAttempt: { id: string; submittedAt: string | null } | null;
};

type ParsedScore = {
  band: number | null;
  correct: number;
  total: number;
  durationSec: number;
  answers: Record<string, { value?: string }>;
};

const formatMinutes = (seconds: number | null | undefined): string => {
  if (!seconds || seconds <= 0) return '—';
  const mins = Math.round(seconds / 60);
  return `${mins} min${mins === 1 ? '' : 's'}`;
};

const formatPercent = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toFixed(0)}%`;
};

const ReadingResultPage: NextPage<ReadingResultPageProps> = ({
  slug,
  attemptId,
  testTitle,
  difficulty,
  durationSeconds,
  bandScore,
  rawScore,
  breakdown,
  leaderboard,
  previousAttempt,
}) => {
  const router = useRouter();
  const durationLabel = formatMinutes(breakdown.timeTakenSeconds ?? durationSeconds);
  const accuracyLabel = formatPercent(breakdown.accuracyPercent);

  const bandLabel = bandScore == null ? '—' : bandScore.toFixed(1);

  const verdict =
    bandScore == null
      ? 'We could not compute a band score for this attempt.'
      : bandScore < 5
      ? 'Your current Reading level is below the typical university-entry band. Focus on question types with low accuracy first.'
      : bandScore < 6.5
      ? 'You are on track for Band 5.0–6.0. Tightening accuracy on one passage and improving pacing can push you higher.'
      : bandScore < 7.5
      ? 'Solid performance. Work on consistency across passages and avoid losing marks on easier question types.'
      : 'Excellent Reading performance. Stay sharp with timed mocks and mixed-difficulty sets.';

  return (
    <>
      <Head>
        <title>{`Reading Result • ${testTitle} • IELTS Mock`}</title>
        <meta
          name="description"
          content="Detailed IELTS Reading mock test result with band score, accuracy breakdown, and next actions."
        />
      </Head>

      <section className="py-16 bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
        <Container>
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-caption text-foreground/60">Reading mock result</p>
              <h1 className="text-h3 font-semibold tracking-tight">{testTitle}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-caption text-foreground/60">
                <Badge tone="info" size="sm">
                  <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                  {difficulty}
                </Badge>
                <span>•</span>
                <span>Approx. {formatMinutes(durationSeconds)} test time</span>
                <span>•</span>
                <span>Attempt ID: {attemptId}</span>
              </div>
            </div>
            {leaderboard ? (
              <Card className="flex items-center gap-3 px-4 py-3 shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon name="Trophy" className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="text-caption text-foreground/60">Global Reading rank</p>
                  <p className="text-small font-semibold">
                    {leaderboard.rank != null ? `#${leaderboard.rank}` : 'Not ranked yet'}
                  </p>
                  <p className="text-caption text-foreground/60">
                    Band {leaderboard.reading_band ?? '—'} • {leaderboard.total_xp ?? 0} XP
                  </p>
                </div>
              </Card>
            ) : null}
          </header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            {/* LEFT: score + breakdown */}
            <Card className="flex flex-col gap-6 p-6">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-caption text-foreground/60">Overall Reading band</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-semibold tracking-tight">{bandLabel}</span>
                    <span className="text-small text-foreground/60">/ 9.0</span>
                  </div>
                  <p className="mt-2 max-w-xl text-small text-foreground/70">{verdict}</p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <div>
                    <p className="text-caption text-foreground/60">Accuracy</p>
                    <p className="text-xl font-semibold">{accuracyLabel}</p>
                    <p className="text-caption text-foreground/60">
                      {breakdown.correctQuestions}/{breakdown.totalQuestions} correct
                    </p>
                  </div>
                  <div>
                    <p className="text-caption text-foreground/60">Time used</p>
                    <p className="text-small font-medium">{durationLabel}</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="border-dashed bg-background/80 p-4 shadow-none">
                  <p className="text-caption text-foreground/60">Total questions</p>
                  <p className="mt-1 text-2xl font-semibold">{breakdown.totalQuestions}</p>
                </Card>
                <Card className="border-dashed bg-background/80 p-4 shadow-none">
                  <p className="text-caption text-foreground/60">Answered</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {breakdown.answeredQuestions}/{breakdown.totalQuestions}
                  </p>
                </Card>
                <Card className="border-dashed bg-background/80 p-4 shadow-none">
                  <p className="text-caption text-foreground/60">Raw score</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {rawScore != null ? rawScore.toFixed(0) : '—'}
                  </p>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-background/80 p-4 shadow-none">
                  <p className="mb-2 text-small font-semibold text-foreground">By passage</p>
                  {breakdown.passageBreakdown.length === 0 ? (
                    <p className="text-caption text-foreground/60">
                      We couldn&apos;t compute a passage breakdown. This will appear once
                      question mapping is available.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-small">
                      {breakdown.passageBreakdown.map((item) => {
                        const pct =
                          item.total > 0
                            ? Math.round((item.correct / item.total) * 100)
                            : 0;
                        return (
                          <li
                            key={item.passageId}
                            className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/80 px-3 py-2"
                          >
                            <div>
                              <p className="font-medium">
                                {item.passageLabel || 'Passage'}
                              </p>
                              <p className="text-caption text-foreground/60">
                                {item.correct}/{item.total} correct
                              </p>
                            </div>
                            <span className="text-small font-semibold">
                              {pct}
                              <span className="text-caption text-foreground/60">%</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>

                <Card className="bg-background/80 p-4 shadow-none">
                  <p className="mb-2 text-small font-semibold text-foreground">By question type</p>
                  {breakdown.typeBreakdown.length === 0 ? (
                    <p className="text-caption text-foreground/60">
                      We couldn&apos;t compute a question-type breakdown. This will appear once
                      question metadata is available.
                    </p>
                  ) : (
                    <ul className="space-y-2 text-small">
                      {breakdown.typeBreakdown.map((item) => {
                        const pct =
                          item.total > 0
                            ? Math.round((item.correct / item.total) * 100)
                            : 0;
                        return (
                          <li
                            key={item.type}
                            className="flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/80 px-3 py-2"
                          >
                            <div>
                              <p className="font-medium">{formatQuestionTypeLabel(item.type)}</p>
                              <p className="text-caption text-foreground/60">
                                {item.correct}/{item.total} correct
                              </p>
                            </div>
                            <span className="text-small font-semibold">
                              {pct}
                              <span className="text-caption text-foreground/60">%</span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="primary"
                  className="rounded-full px-4"
                  onClick={() => {
                    void router.push(`/mock/reading/review/${encodeURIComponent(attemptId)}`);
                  }}
                >
                  Review questions
                </Button>
                {previousAttempt ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full px-4"
                    onClick={() => {
                      void router.push(`/mock/reading/review/${encodeURIComponent(previousAttempt.id)}`);
                    }}
                  >
                    Review previous attempt
                    <span className="ml-2 text-caption text-foreground/60">
                      {formatPreviousAttemptDate(previousAttempt.submittedAt)}
                    </span>
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full px-4"
                  onClick={() => {
                    void router.push(`/mock/reading/${encodeURIComponent(slug)}`);
                  }}
                >
                  Retake this test
                </Button>
                <Link
                  href="/mock/reading/history"
                  className="ml-auto text-small text-foreground/70 underline underline-offset-4"
                >
                  Back to Reading history
                </Link>
              </div>
            </Card>

            {/* RIGHT: AI feedback block (you’ll wire this later) */}
            <Card className="p-6">
              <h2 className="text-h5 font-semibold">AI feedback (coming next)</h2>
              <p className="mt-2 text-small text-foreground/70">
                Next, we&apos;ll plug this result into GramorX AI to give you:
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-small text-foreground/75">
                <li>Top weak question types and how to fix them.</li>
                <li>Passage-by-passage reading strategy tips.</li>
                <li>
                  A personalised 7-day Reading plan to move your band closer to your target.
                </li>
              </ul>
            </Card>
          </div>
        </Container>
      </section>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<ReadingResultPageProps> = async (ctx) => {
  const { req, res, params, query, resolvedUrl } = ctx;
  const slug = typeof params?.slug === 'string' ? params.slug : '';
  const attemptId = typeof query.attempt === 'string' ? query.attempt : '';

  if (!slug || !attemptId) {
    return { notFound: true };
  }

  const supabase = getServerClient(req, res);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(
          resolvedUrl ?? `/mock/reading/${slug}/result?attempt=${attemptId}`,
        )}`,
        permanent: false,
      },
    };
  }

  const { data: attempt, error: attemptError } = await supabase
    .from<ReadingAttemptRow>('attempts_reading')
    .select('id, paper_id, submitted_at, answers, score, total, duration_sec')
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (attemptError || !attempt) {
    return { notFound: true };
  }

  const score = parseScore(attempt);
  const paperSlug = attempt.paper_id ?? slug;

  const { data: test, error: testError } = await supabase
    .from<ReadingTestRow>('reading_tests')
    .select('id, slug, title, description, difficulty, total_questions, duration_seconds')
    .eq('slug', paperSlug)
    .maybeSingle();

  if (testError && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('[reading result] failed to load test', testError);
  }

  const metaFromList = readingPracticeList.find((item) => item.id === paperSlug);
  const testSlug = test?.slug ?? metaFromList?.slug ?? paperSlug;
  const testTitle = test?.title ?? metaFromList?.title ?? paperSlug;
  const totalQuestions = test?.total_questions ?? metaFromList?.totalQuestions ?? score.total;
  const durationSeconds = test?.duration_seconds ?? metaFromList?.durationSec ?? 60 * 60;
  const difficulty = test?.difficulty ?? 'Mixed';

  const { data: previousAttemptRow } = await supabase
    .from<Pick<ReadingAttemptRow, 'id' | 'submitted_at'>>('attempts_reading')
    .select('id, submitted_at')
    .eq('user_id', user.id)
    .eq('paper_id', paperSlug)
    .neq('id', attemptId)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: leaderboardRow } = await supabase
    .from<LeaderboardRow>('v_leaderboard_reading')
    .select('rank, reading_band, total_xp')
    .eq('user_id', user.id)
    .maybeSingle();

  const breakdown = buildBreakdownFromScore(score, totalQuestions, durationSeconds);

  return {
    props: {
      slug: testSlug,
      attemptId,
      testTitle,
      difficulty,
      durationSeconds,
      bandScore: score.band,
      rawScore: score.correct,
      breakdown,
      leaderboard: leaderboardRow ?? null,
      previousAttempt: previousAttemptRow
        ? { id: previousAttemptRow.id, submittedAt: previousAttemptRow.submitted_at }
        : null,
    },
  };
};

function parseScore(payload: any): ParsedScore {
  const source = payload?.score_json && typeof payload.score_json === 'object' ? payload.score_json : payload ?? {};
  const correct = Number(source?.correct ?? source?.score ?? payload?.score ?? 0);
  const total = Number(source?.total ?? source?.questions ?? payload?.total ?? 0);
  const durationSec = Number(
    source?.durationSec ?? source?.duration_sec ?? source?.duration ?? payload?.duration_sec ?? 0,
  );
  const bandRaw = typeof source?.band === 'number' ? source.band : source?.score_band ?? payload?.band ?? payload?.score_band;
  const band = typeof bandRaw === 'number' && Number.isFinite(bandRaw) ? bandRaw : readingBandFromRaw(correct, total);
  const answersSource =
    source?.answers && typeof source.answers === 'object'
      ? source.answers
      : payload?.answers && typeof payload.answers === 'object'
      ? payload.answers
      : {};
  const answers = answersSource as Record<string, { value?: string }>;

  return {
    band,
    correct: Number.isFinite(correct) ? correct : 0,
    total: Number.isFinite(total) ? total : 0,
    durationSec: Number.isFinite(durationSec) ? durationSec : 0,
    answers,
  };
}

function buildBreakdownFromScore(
  score: ParsedScore,
  totalQuestions: number,
  fallbackDurationSeconds: number,
): ReadingResultBreakdown {
  const answeredQuestions = Object.values(score.answers || {}).filter((a) => (a?.value ?? '').trim()).length;
  const correctQuestions = Number.isFinite(score.correct) ? Math.max(0, score.correct) : 0;
  const safeTotal = totalQuestions || score.total || 0;
  const accuracyPercent = safeTotal > 0 ? (correctQuestions / safeTotal) * 100 : 0;
  const timeTakenSeconds = score.durationSec || fallbackDurationSeconds || null;

  return {
    totalQuestions: safeTotal || 0,
    answeredQuestions,
    correctQuestions,
    accuracyPercent,
    timeTakenSeconds,
    passageBreakdown: [],
    typeBreakdown: [],
  };
}

function formatQuestionTypeLabel(key: string): string {
  const normalised = key.toLowerCase();
  if (normalised === 'tfng') return 'True / False / Not Given';
  if (normalised === 'yynn') return 'Yes / No / Not Given';
  if (normalised.includes('heading')) return 'Match headings';
  if (normalised.includes('match')) return 'Matching';
  if (normalised.includes('mcq')) return 'Multiple choice';
  if (normalised.includes('gap')) return 'Gap fill';
  return key;
}

function formatPreviousAttemptDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default ReadingResultPage;
