import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';

type AttemptStatus = 'created' | 'in_progress' | 'submitted' | 'evaluated';

type WritingAttemptRow = {
  id: string;
  mode: 'academic' | 'general';
  status: AttemptStatus;
  started_at: string;
  submitted_at: string | null;
  evaluated_at: string | null;
};

type WritingStats = {
  totalAttempts: number;
  lastAttemptAt: string | null;
};

type PageProps = {
  stats: WritingStats;
  recentAttempts: Array<{
    id: string;
    mode: 'academic' | 'general';
    status: AttemptStatus;
    dateLabel: string;
  }>;
  error?: string;
};

type StartAttemptResp =
  | { ok: true; attemptId: string; mode: 'academic' | 'general'; status: 'created'; startedAt: string; durationSeconds: number }
  | { ok: false; error: string; details?: unknown };

function formatRelativeDate(iso: string | null): string {
  if (!iso) return '—';
  const created = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays} days ago`;
  return created.toLocaleDateString();
}

const WritingMockIndexPage: NextPage<PageProps> = ({ stats, recentAttempts, error }) => {
  const [modeOpen, setModeOpen] = React.useState(false);
  const [starting, setStarting] = React.useState<null | 'academic' | 'general'>(null);
  const [startError, setStartError] = React.useState<string | null>(null);

  const startAttempt = async (mode: 'academic' | 'general') => {
    setStartError(null);
    setStarting(mode);
    try {
      const r = await fetch('/api/writing/start-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const json = (await r.json()) as StartAttemptResp;
      if (!json.ok) throw new Error(json.error);

      window.location.href = `/mock/writing/attempt/${encodeURIComponent(json.attemptId)}`;

    } catch (e) {
      setStartError((e as Error).message);
      setStarting(null);
    }
  };

  if (error) {
    return (
      <>
        <Head>
          <title>Error · Writing Mocks · GramorX</title>
        </Head>
        <Container className="py-12 max-w-3xl">
          <Card className="p-6 space-y-3 rounded-ds-2xl border border-border/60 bg-card/70">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <Icon name="AlertTriangle" />
            </div>
            <h1 className="text-h3 font-semibold">Unable to load Writing mocks</h1>
            <p className="text-small text-muted-foreground">{error}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild variant="primary" className="rounded-ds-xl">
                <Link href="/mock">Back to Mock hub</Link>
              </Button>
              <Button asChild variant="secondary" className="rounded-ds-xl">
                <Link href="/mock/writing">Retry</Link>
              </Button>
            </div>
          </Card>
        </Container>
      </>
    );
  }

  const lastAttemptLabel = formatRelativeDate(stats.lastAttemptAt);

  return (
    <>
      <Head>
        <title>IELTS Writing Mock Command Center · GramorX</title>
        <meta
          name="description"
          content="IELTS Writing mocks with Task 1 + Task 2, strict timing, autosave, and AI evaluation."
        />
      </Head>

      <main className="bg-lightBg dark:bg-dark/90">
        {/* TOP HERO */}
        <section className="border-b border-border/50 bg-card/70 backdrop-blur py-8">
          <Container>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-ds-full bg-primary/10 px-3 py-1 text-caption font-medium text-primary">
                  <Icon name="PenTool" size={14} />
                  <span>Writing Mock Command Center</span>
                </div>

                <h1 className="font-slab text-h2 leading-tight">
                  Writing mocks with strict timer + AI evaluation.
                </h1>

                <p className="text-small text-muted-foreground max-w-xl">
                  Attempt full writing mocks (Task 1 + Task 2) in a real exam flow:
                  autosave, no pause timer, submit lock, and evaluation queue.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Badge tone="success" size="sm">
                    <Icon name="Sparkles" size={14} className="mr-1" />
                    AI evaluation pipeline
                  </Badge>
                  <Badge tone="neutral" size="sm">
                    <Icon name="ShieldCheck" size={14} className="mr-1" />
                    Exam-room timing
                  </Badge>
                </div>
              </div>

              {/* Snapshot panel */}
              <Card className="w-full max-w-xs p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-caption font-medium text-muted-foreground uppercase tracking-wide">
                    Writing mock summary
                  </p>
                  <Icon name="TrendingUp" size={16} className="text-success" />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-caption">
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-muted-foreground">Total attempts</p>
                    <p className="font-medium">{stats.totalAttempts}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-muted-foreground">Last attempt</p>
                    <p className="font-medium">{lastAttemptLabel}</p>
                  </div>
                </div>

                <Button size="sm" className="w-full" onClick={() => setModeOpen(true)}>
                  <Icon name="PlayCircle" size={16} className="mr-1" />
                  Start a writing mock
                </Button>

                {startError ? (
                  <p className="text-caption text-destructive">{startError}</p>
                ) : null}
              </Card>
            </div>
          </Container>
        </section>

        {/* BODY */}
        <section className="py-10">
          <Container className="grid gap-8 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)]">
            {/* LEFT */}
            <div className="space-y-8">
              <Card className="p-5 md:p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1 max-w-md">
                  <div className="inline-flex items-center gap-2 text-caption text-muted-foreground">
                    <Icon name="LayoutDashboard" size={16} />
                    <span>Full writing mock</span>
                  </div>
                  <h2 className="text-h4 font-semibold">Task 1 + Task 2 · 60 minutes</h2>
                  <p className="text-caption text-muted-foreground">
                    Strict timer, autosave, and a locked submission. Choose Academic or General.
                  </p>
                </div>

                <div className="space-y-2 w-full max-w-xs">
                  <Button size="sm" className="w-full" onClick={() => setModeOpen(true)}>
                    <Icon name="PlayCircle" size={16} className="mr-1" />
                    Start a writing mock
                  </Button>
                  <Button size="sm" variant="ghost" className="w-full">
                    <Icon name="Sparkles" size={16} className="mr-1" />
                    Open AI Writing Lab
                  </Button>
                </div>
              </Card>

              <Card className="p-5 text-caption text-muted-foreground">
                Writing is now <span className="font-medium text-foreground">attempt-based</span> (like real exam sessions).
                Each attempt gets its own exam room, autosaves, and then queues evaluation after submission.
              </Card>
            </div>

            {/* RIGHT */}
            <div className="space-y-6">
              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-small font-semibold">Recent writing attempts</h2>
                </div>

                {recentAttempts.length === 0 ? (
                  <p className="text-caption text-muted-foreground">
                    No attempts yet. Start a mock to create your first exam session.
                  </p>
                ) : (
                  <div className="space-y-2 text-caption">
                    {recentAttempts.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between gap-2 rounded-ds-lg border border-border/60 px-3 py-2"
                      >
                        <div className="space-y-0.5">
                          <p className="font-medium">
                            {a.mode === 'academic' ? 'Academic' : 'General'} · Writing Mock
                          </p>
                          <p className="text-[11px] text-muted-foreground">{a.dateLabel}</p>
                        </div>

                        <div className="text-right space-y-0.5">
                          <Badge tone={a.status === 'evaluated' ? 'success' : a.status === 'submitted' ? 'info' : 'neutral'} size="xs">
                            {a.status}
                          </Badge>
                          <Button asChild size="xs" variant="ghost">
                            <Link href={`/mock/writing/attempt/${encodeURIComponent(a.id)}`}>
                              <Icon name="PlayCircle" size={12} className="mr-1" />
                              Open
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </Container>
        </section>

        {/* MODE PICKER MODAL */}
        {modeOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <Card className="w-full max-w-lg p-5 space-y-4 rounded-ds-2xl">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-small font-semibold">Choose your writing mode</p>
                  <p className="text-caption text-muted-foreground">
                    Academic is chart/report + essay. General is letter + essay.
                  </p>
                </div>
                <Button size="xs" variant="ghost" onClick={() => setModeOpen(false)} disabled={starting != null}>
                  <Icon name="X" size={16} />
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Button
                  size="sm"
                  className="w-full"
                  disabled={starting != null}
                  onClick={() => startAttempt('academic')}
                >
                  {starting === 'academic' ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-1 animate-spin" />
                      Starting…
                    </>
                  ) : (
                    <>
                      <Icon name="GraduationCap" size={16} className="mr-1" />
                      Academic
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full"
                  disabled={starting != null}
                  onClick={() => startAttempt('general')}
                >
                  {starting === 'general' ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-1 animate-spin" />
                      Starting…
                    </>
                  ) : (
                    <>
                      <Icon name="Mail" size={16} className="mr-1" />
                      General
                    </>
                  )}
                </Button>
              </div>

              <div className="text-[11px] text-muted-foreground">
                Timer starts immediately after you pick a mode.
              </div>
            </Card>
          </div>
        ) : null}
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  try {
    const supabase = getServerClient(ctx.req, ctx.res);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        redirect: {
          destination: `/auth/login?redirectTo=${encodeURIComponent(ctx.resolvedUrl || '/mock/writing')}`,
          permanent: false,
        },
      };
    }

    const { data: attempts, error } = await supabase
      .from('writing_attempts')
      .select('id, mode, status, started_at, submitted_at, evaluated_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    const rows = (attempts ?? []) as WritingAttemptRow[];

    const stats: WritingStats = {
      totalAttempts: rows.length,
      lastAttemptAt: rows[0]?.started_at ?? null,
    };

    const recentAttempts = rows.slice(0, 6).map((a) => ({
      id: a.id,
      mode: a.mode,
      status: a.status,
      dateLabel: formatRelativeDate(a.started_at),
    }));

    return { props: { stats, recentAttempts } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load Writing mocks.';
    return { props: { stats: { totalAttempts: 0, lastAttemptAt: null }, recentAttempts: [], error: message } };
  }
};

export default WritingMockIndexPage;
