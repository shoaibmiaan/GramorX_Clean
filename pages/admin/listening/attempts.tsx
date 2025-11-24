// pages/admin/listening/attempts.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

type AdminListeningAttempt = {
  id: string;
  userId: string;
  testTitle: string;
  testSlug: string;
  mode: 'practice' | 'mock';
  status: string;
  bandScore: number | null;
  rawScore: number | null;
  totalQuestions: number | null;
  createdAt: string;
};

type Props = {
  attempts: AdminListeningAttempt[];
};

const AdminListeningAttemptsPage: NextPage<Props> = ({ attempts }) => {
  const [modeFilter, setModeFilter] = React.useState<'all' | 'practice' | 'mock'>('all');

  const filtered = attempts.filter((a) => {
    if (modeFilter === 'all') return true;
    return a.mode === modeFilter;
  });

  return (
    <>
      <Head>
        <title>Admin • Listening Attempts • GramorX</title>
        <meta
          name="description"
          content="View IELTS Listening attempts (practice and mock) for monitoring module health."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="xs">
                <Link href="/admin/listening">
                  <Icon name="ArrowLeft" size={12} />
                  <span>Back to overview</span>
                </Link>
              </Button>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                <Icon name="ListChecks" size={12} />
                <span>Listening attempts</span>
              </span>
            </div>

            <select
              value={modeFilter}
              onChange={(e) =>
                setModeFilter(e.target.value as 'all' | 'practice' | 'mock')
              }
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary sm:text-sm"
            >
              <option value="all">All modes</option>
              <option value="practice">Practice only</option>
              <option value="mock">Mock only</option>
            </select>
          </div>

          <section className="mb-4">
            <Card className="border-border bg-card/60 p-4">
              <p className="text-sm font-semibold text-foreground sm:text-base">
                Attempts log
              </p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Use this mainly for debugging and health monitoring. For serious analytics, prefer
                the dedicated analytics dashboards.
              </p>
            </Card>
          </section>

          <section>
            <Card className="border-border bg-card/60 p-0">
              <div className="border-b border-border px-4 py-3">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {filtered.length} attempt{filtered.length === 1 ? '' : 's'} shown
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs text-muted-foreground sm:text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide">
                      <th className="px-4 py-2 font-medium">When</th>
                      <th className="px-4 py-2 font-medium">User</th>
                      <th className="px-4 py-2 font-medium">Test</th>
                      <th className="px-4 py-2 font-medium">Mode</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Score</th>
                      <th className="px-4 py-2 font-medium">Band</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td
                          className="px-4 py-3 text-xs text-muted-foreground sm:text-sm"
                          colSpan={7}
                        >
                          No attempts yet for this filter.
                        </td>
                      </tr>
                    ) : (
                      filtered.map((attempt) => {
                        const created = new Date(attempt.createdAt);
                        const createdLabel = created.toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        const scoreLabel =
                          attempt.rawScore != null && attempt.totalQuestions != null
                            ? `${attempt.rawScore}/${attempt.totalQuestions}`
                            : '—';

                        return (
                          <tr
                            key={attempt.id}
                            className="border-b border-border/60 last:border-b-0"
                          >
                            <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                              {createdLabel}
                            </td>
                            <td className="px-4 py-2 align-middle text-[11px] text-muted-foreground sm:text-xs">
                              {attempt.userId.slice(0, 8)}…
                            </td>
                            <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                              {attempt.testTitle}{' '}
                              <span className="text-[11px] text-muted-foreground">
                                ({attempt.testSlug})
                              </span>
                            </td>
                            <td className="px-4 py-2 align-middle">
                              <span
                                className={[
                                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                                  attempt.mode === 'mock'
                                    ? 'bg-danger/10 text-danger'
                                    : 'bg-success/10 text-success',
                                ].join(' ')}
                              >
                                <Icon
                                  name={
                                    attempt.mode === 'mock'
                                      ? 'Shield'
                                      : 'FlaskConical'
                                  }
                                  size={11}
                                />
                                <span>{attempt.mode}</span>
                              </span>
                            </td>
                            <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                              {attempt.status}
                            </td>
                            <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                              {scoreLabel}
                            </td>
                            <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                              {attempt.bandScore != null
                                ? attempt.bandScore.toFixed(1)
                                : '—'}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </Container>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent('/admin/listening/attempts')}`,
        permanent: false,
      },
    };
  }

  const { data: rows } = await supabase
    .from('attempts_listening')
    .select(
      'id, user_id, mode, status, raw_score, band_score, total_questions, created_at, listening_tests(title, slug)',
    )
    .order('created_at', { ascending: false })
    .limit(200);

  const attempts: AdminListeningAttempt[] =
    rows?.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      testTitle: row.listening_tests?.title ?? 'Unknown test',
      testSlug: row.listening_tests?.slug ?? 'unknown',
      mode: row.mode,
      status: row.status,
      bandScore: row.band_score,
      rawScore: row.raw_score,
      totalQuestions: row.total_questions,
      createdAt: row.created_at,
    })) ?? [];

  return {
    props: {
      attempts,
    },
  };
};

export default AdminListeningAttemptsPage;
