import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps, NextPage } from 'next';

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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
  statusCounts: Record<AttemptStatus, number>;
};

type ProgressPoint = {
  // keep as ISO for stable sorting + parsing
  startedAt: string;
  // recharts x label
  label: string;
  band: number;
};

type PageProps = {
  stats: WritingStats;
  recentAttempts: Array<{
    id: string;
    mode: 'academic' | 'general';
    status: AttemptStatus;
    startedAt: string;
  }>;
  progress: {
    points: ProgressPoint[];
    latestBand: number | null;
    bestBand: number | null;
  };
  error?: string;
};

type StartAttemptResp =
  | {
      ok: true;
      attemptId: string;
      mode: 'academic' | 'general';
      status: 'created';
      startedAt: string;
      durationSeconds: number;
    }
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

function formatFullDateTimeClient(iso: string): string {
  const d = new Date(iso);
  // client-local timezone + locale
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

function useBodyScrollLock(locked: boolean) {
  React.useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

type ModePickerProps = {
  open: boolean;
  starting: null | 'academic' | 'general';
  errorText: string | null;
  onClose: () => void;
  onPick: (mode: 'academic' | 'general') => void;
};

function ModePickerModal({ open, starting, errorText, onClose, onPick }: ModePickerProps) {
  const titleId = React.useId();
  const descId = React.useId();

  useBodyScrollLock(open);

  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const disabled = starting != null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !disabled) onClose();
      }}
    >
      <Card className="w-full max-w-lg p-5 space-y-4 rounded-ds-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p id={titleId} className="text-sm font-semibold">
              Choose your writing mode
            </p>
            <p id={descId} className="text-xs text-muted-foreground">
              Academic is chart/report + essay. General is letter + essay.
            </p>
          </div>

          <Button size="xs" variant="ghost" onClick={onClose} disabled={disabled} aria-label="Close">
            <Icon name="X" size={16} />
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Button size="sm" className="w-full" disabled={disabled} onClick={() => onPick('academic')}>
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

          <Button size="sm" variant="secondary" className="w-full" disabled={disabled} onClick={() => onPick('general')}>
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

        <div className="space-y-2">
          <div className="text-[11px] text-muted-foreground">Timer starts immediately after you pick a mode.</div>
          {errorText ? <p className="text-xs text-destructive">{errorText}</p> : null}
        </div>
      </Card>
    </div>
  );
}

const WritingMockIndexPage: NextPage<PageProps> = ({ stats, recentAttempts, progress, error }) => {
  const router = useRouter();

  const [modeOpen, setModeOpen] = React.useState(false);
  const [starting, setStarting] = React.useState<null | 'academic' | 'general'>(null);
  const [startError, setStartError] = React.useState<string | null>(null);

  const lastAttemptLabel = formatRelativeDate(stats.lastAttemptAt);

  const openModePicker = React.useCallback(() => {
    setStartError(null);
    setModeOpen(true);
  }, []);

  const closeModePicker = React.useCallback(() => {
    if (starting != null) return;
    setModeOpen(false);
  }, [starting]);

  const startAttempt = React.useCallback(
    async (mode: 'academic' | 'general') => {
      setStartError(null);
      setStarting(mode);

      try {
        const r = await fetch('/api/writing/start-attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode }),
        });

        const json = (await r.json()) as StartAttemptResp;

        if (!r.ok) {
          const msg = json && 'ok' in json && !json.ok ? json.error : 'Failed to start attempt';
          throw new Error(msg);
        }

        if (!json.ok) throw new Error(json.error);

        await router.push(`/mock/writing/attempt/${encodeURIComponent(json.attemptId)}`);
      } catch (e) {
        setStartError(e instanceof Error ? e.message : 'Failed to start attempt');
        setStarting(null);
      }
    },
    [router],
  );

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
            <h1 className="text-xl font-semibold">Unable to load Writing mocks</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
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

  const statusCounts = stats.statusCounts;
  const latestBand = progress.latestBand;
  const bestBand = progress.bestBand;

  return (
    <>
      <Head>
        <title>IELTS Writing Mock Command Center · GramorX</title>
        <meta name="description" content="IELTS Writing mocks with strict timing, autosave, and AI evaluation." />
      </Head>

      <main className="bg-lightBg dark:bg-dark/90">
        {/* TOP HERO */}
        <section className="border-b border-border/50 bg-card/70 backdrop-blur py-8">
          <Container>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-ds-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Icon name="PenTool" size={14} />
                  <span>Writing Mock Command Center</span>
                </div>

                <h1 className="font-slab text-h2 leading-tight">Writing mocks with strict timer + AI evaluation.</h1>

                <p className="text-sm text-muted-foreground max-w-xl">
                  Full exam flow: autosave, no pause timer, submission lock, and evaluation queue.
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
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Writing mock summary</p>
                  <Icon name="TrendingUp" size={16} className="text-success" />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-muted-foreground">Total attempts</p>
                    <p className="font-medium">{stats.totalAttempts}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-muted-foreground">Last attempt</p>
                    <p className="font-medium">{lastAttemptLabel}</p>
                  </div>
                </div>

                <Button size="sm" className="w-full" onClick={openModePicker} disabled={starting != null}>
                  <Icon name="PlayCircle" size={16} className="mr-1" />
                  Start a writing mock
                </Button>

                {startError ? <p className="text-xs text-destructive">{startError}</p> : null}
              </Card>
            </div>
          </Container>
        </section>

        {/* BODY */}
        <section className="py-10">
          <Container className="grid gap-8 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)]">
            {/* LEFT */}
            <div className="space-y-8">
              {/* KPI strip */}
              <Card className="p-5 md:p-6 space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon name="LayoutDashboard" size={16} />
                      <span>Performance snapshot</span>
                    </div>
                    <h2 className="text-lg font-semibold">Progress + pipeline status</h2>
                    <p className="text-xs text-muted-foreground">
                      Latest band, best band, and your evaluation pipeline breakdown.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral" size="sm">
                      Latest: <span className="ml-1 font-semibold">{latestBand ?? '—'}</span>
                    </Badge>
                    <Badge tone="success" size="sm">
                      Best: <span className="ml-1 font-semibold">{bestBand ?? '—'}</span>
                    </Badge>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                  <div className="rounded-ds-lg border border-border/60 p-3">
                    <p className="text-[11px] text-muted-foreground">Evaluated</p>
                    <p className="text-base font-semibold">{statusCounts.evaluated}</p>
                  </div>
                  <div className="rounded-ds-lg border border-border/60 p-3">
                    <p className="text-[11px] text-muted-foreground">Submitted</p>
                    <p className="text-base font-semibold">{statusCounts.submitted}</p>
                  </div>
                  <div className="rounded-ds-lg border border-border/60 p-3">
                    <p className="text-[11px] text-muted-foreground">In progress</p>
                    <p className="text-base font-semibold">{statusCounts.in_progress}</p>
                  </div>
                  <div className="rounded-ds-lg border border-border/60 p-3">
                    <p className="text-[11px] text-muted-foreground">Created</p>
                    <p className="text-base font-semibold">{statusCounts.created}</p>
                  </div>
                </div>
              </Card>

              {/* Progress chart */}
              <Card className="p-5 md:p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold">Band progress</h2>
                    <p className="text-xs text-muted-foreground">
                      This shows your band trend for evaluated mocks (latest on the right).
                    </p>
                  </div>

                  <Badge tone="neutral" size="sm">
                    {progress.points.length} points
                  </Badge>
                </div>

                {progress.points.length < 2 ? (
                  <div className="rounded-ds-xl border border-border/60 p-4 text-xs text-muted-foreground">
                    Not enough evaluated attempts yet. Complete 2+ mocks to see your progress trend here.
                  </div>
                ) : (
                  <div className="h-44 w-full text-primary">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progress.points}>
                        <CartesianGrid stroke="currentColor" opacity={0.08} />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 9]} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="band"
                          stroke="currentColor"
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="rounded-ds-xl" onClick={openModePicker} disabled={starting != null}>
                    <Icon name="PlayCircle" size={16} className="mr-1" />
                    Start a writing mock
                  </Button>

                  <Button asChild size="sm" variant="ghost" className="rounded-ds-xl">
                    <Link href="/writing">
                      <Icon name="Sparkles" size={16} className="mr-1" />
                      Open AI Writing Lab
                    </Link>
                  </Button>
                </div>
              </Card>

              {/* explainer */}
              <Card className="p-5 text-xs text-muted-foreground">
                Writing is <span className="font-medium text-foreground">attempt-based</span> (like real exam sessions).
                Each attempt gets its own exam room, autosaves, and queues evaluation after submission.
              </Card>
            </div>

            {/* RIGHT */}
            <div className="space-y-6">
              <Card className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold">Recent writing attempts</h2>
                </div>

                {recentAttempts.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No attempts yet. Start a mock to create your first session.</p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {recentAttempts.map((a) => {
                      const fullDate = formatFullDateTimeClient(a.startedAt);
                      const rel = formatRelativeDate(a.startedAt);

                      return (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-2 rounded-ds-lg border border-border/60 px-3 py-2"
                        >
                          <div className="space-y-0.5">
                            <p className="font-medium">{a.mode === 'academic' ? 'Academic' : 'General'} · Writing Mock</p>
                            <p className="text-[11px] text-muted-foreground">
                              {fullDate} <span className="mx-1">•</span> {rel}
                            </p>
                          </div>

                          <div className="text-right space-y-0.5">
                            <Badge
                              tone={a.status === 'evaluated' ? 'success' : a.status === 'submitted' ? 'info' : 'neutral'}
                              size="xs"
                            >
                              {a.status}
                            </Badge>

                            <Button asChild size="xs" variant="ghost">
                              <Link href={`/mock/writing/result/${encodeURIComponent(a.id)}`}>
                                <Icon name="PlayCircle" size={12} className="mr-1" />
                                Open
                              </Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </Container>
        </section>

        <ModePickerModal
          open={modeOpen}
          starting={starting}
          errorText={startError}
          onClose={closeModePicker}
          onPick={startAttempt}
        />
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  try {
    const supabase = getServerClient(ctx.req, ctx.res);

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr) throw authErr;

    if (!user) {
      const next = ctx.resolvedUrl || '/mock/writing';
      return {
        redirect: {
          destination: `/login/email?role=student&next=${encodeURIComponent(next)}`,
          permanent: false,
        },
      };
    }

    // ✅ Total attempts count (real)
    const { count: totalAttempts, error: countErr } = await supabase
      .from('writing_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countErr) throw countErr;

    // Latest attempt
    const { data: latest, error: latestErr } = await supabase
      .from('writing_attempts')
      .select('started_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestErr) throw latestErr;

    // Recent attempts (right panel)
    const { data: attempts, error: listErr } = await supabase
      .from('writing_attempts')
      .select('id, mode, status, started_at, submitted_at, evaluated_at')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(6);

    if (listErr) throw listErr;

    const recentRows = (attempts ?? []) as WritingAttemptRow[];

    // Status breakdown (cheap: use last 200 attempts)
    const { data: statusRows, error: statusErr } = await supabase
      .from('writing_attempts')
      .select('status')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(200);

    if (statusErr) throw statusErr;

    const statusCounts: Record<AttemptStatus, number> = {
      created: 0,
      in_progress: 0,
      submitted: 0,
      evaluated: 0,
    };

    for (const r of statusRows ?? []) {
      const s = String((r as any).status) as AttemptStatus;
      if (s in statusCounts) statusCounts[s] += 1;
    }

    // Progress chart: last 20 evaluated attempts
    const { data: evaluatedAttempts, error: evalAttemptErr } = await supabase
      .from('writing_attempts')
      .select('id, started_at')
      .eq('user_id', user.id)
      .not('evaluated_at', 'is', null)
      .order('started_at', { ascending: true })
      .limit(20);

    if (evalAttemptErr) throw evalAttemptErr;

    const evalAttemptRows = (evaluatedAttempts ?? []) as Array<{ id: string; started_at: string }>;
    const attemptIds = evalAttemptRows.map((a) => a.id);

    let points: ProgressPoint[] = [];
    let latestBand: number | null = null;
    let bestBand: number | null = null;

    if (attemptIds.length > 0) {
      const { data: evals, error: evalsErr } = await supabase
        .from('writing_evaluations')
        .select('attempt_id, overall_band')
        .in('attempt_id', attemptIds);

      if (evalsErr) throw evalsErr;

      const bandByAttempt = new Map<string, number>();
      for (const e of evals ?? []) {
        const aId = String((e as any).attempt_id);
        const raw = (e as any).overall_band;
        const n = typeof raw === 'number' ? raw : raw == null ? null : Number(raw);
        if (n != null && !Number.isNaN(n)) bandByAttempt.set(aId, n);
      }

      points = evalAttemptRows
        .map((a) => {
          const band = bandByAttempt.get(a.id);
          if (band == null) return null;
          const label = new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit' }).format(new Date(a.started_at));
          return { startedAt: a.started_at, label, band };
        })
        .filter(Boolean) as ProgressPoint[];

      if (points.length > 0) {
        latestBand = points[points.length - 1]?.band ?? null;
        bestBand = points.reduce((m, p) => Math.max(m, p.band), 0);
      }
    }

    const stats: WritingStats = {
      totalAttempts: totalAttempts ?? 0,
      lastAttemptAt: latest?.started_at ?? null,
      statusCounts,
    };

    const recentAttempts = recentRows.map((a) => ({
      id: a.id,
      mode: a.mode,
      status: a.status,
      startedAt: a.started_at,
    }));

    return {
      props: {
        stats,
        recentAttempts,
        progress: { points, latestBand, bestBand },
      },
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load Writing mocks.';
    return {
      props: {
        stats: { totalAttempts: 0, lastAttemptAt: null, statusCounts: { created: 0, in_progress: 0, submitted: 0, evaluated: 0 } },
        recentAttempts: [],
        progress: { points: [], latestBand: null, bestBand: null },
        error: message,
      },
    };
  }
};

export default WritingMockIndexPage;
