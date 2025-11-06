// pages/ai/study-buddy/session/[id]/practice.tsx
import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getServerClient } from '@/lib/supabaseServer';

import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Container } from '@/components/design-system/Container';
import { Alert } from '@/components/design-system/Alert';
import { Badge } from '@/components/design-system/Badge';
import { ProgressBar } from '@/components/design-system/ProgressBar';
import { useToast } from '@/components/design-system/Toaster';

type SessionItem = { skill: string; minutes: number };
type StudySession = {
  id: string;
  user_id: string;
  items: SessionItem[];
  state: 'pending' | 'started' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string | null;
};

type Props = { id: string; initial: StudySession | null };

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const id = String(ctx.query.id || '');
  if (!id) return { notFound: true };

  const supabase = getServerClient(ctx.req, ctx.res);
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) {
    // Surface auth issues explicitly so we can diagnose quickly
    throw userErr;
  }

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(ctx.resolvedUrl ?? `/ai/study-buddy/session/${id}`)}`,
        permanent: false,
      },
    };
  }

  const { data: session, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle<StudySession>();

  if (error) {
    console.error('[study-buddy/practice] load error', error);
    return { notFound: true };
  }

  return { props: { id, initial: session ?? null } };
};

const seconds = (m: number) => Math.max(0, Math.floor(m * 60));

const PracticePage: NextPage<Props> = ({ id, initial }) => {
  const toast = useToast();
  const [session, setSession] = useState<StudySession | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(
    initial?.items?.length ? seconds(initial.items[0].minutes) : null,
  );
  const [running, setRunning] = useState(initial?.state === 'started');
  const [completing, setCompleting] = useState(false);

  const items = session?.items ?? [];
  const totalBlocks = items.length;
  const currentItem = useMemo(() => (session ? session.items[currentIndex] ?? null : null), [session, currentIndex]);
  const nextItem = useMemo(
    () => (session && currentIndex + 1 < session.items.length ? session.items[currentIndex + 1] : null),
    [session, currentIndex],
  );
  const progress = totalBlocks > 0 ? Math.round((currentIndex / totalBlocks) * 100) : 0;
  const isCompleted = session?.state === 'completed';

  const updateFromSession = useCallback((s: StudySession | null) => {
    setSession(s);
    setCurrentIndex(0);
    setRemaining(s?.items?.length ? seconds(s.items[0].minutes) : null);
    setRunning(s?.state === 'started');
  }, []);

  const markStarted = useCallback(async () => {
    setError(null);
    try {
      const resp = await fetch(`/api/study-buddy/sessions/${encodeURIComponent(id)}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body?.error || 'start_failed');
      const s: StudySession = body.session ?? body;
      updateFromSession(s);
      setRunning(true);
      toast.success('Session started', 'We’ll guide you block by block.');
    } catch (e: any) {
      const message = e?.message ?? 'start_failed';
      setError(message);
      toast.error('Could not start', typeof message === 'string' ? message : undefined);
    }
  }, [id, toast, updateFromSession]);

  const completeSession = useCallback(async () => {
    if (!session || session.state === 'completed') return;
    try {
      setCompleting(true);
      const resp = await fetch(`/api/study-buddy/sessions/${encodeURIComponent(id)}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body?.error || 'complete_failed');
      const s: StudySession = body.session ?? body;
      setSession(s);
      toast.success('Session logged', 'Great work – streak protected.');
    } catch (e: any) {
      const message = e?.message ?? 'complete_failed';
      setError(message);
      toast.error('Could not mark complete', typeof message === 'string' ? message : undefined);
    } finally {
      setCompleting(false);
    }
  }, [id, session, toast]);

  const advanceToNext = useCallback(() => {
    if (!session) return;
    const next = currentIndex + 1;
    if (next < session.items.length) {
      setCurrentIndex(next);
      setRemaining(seconds(session.items[next].minutes));
      setRunning(true);
    } else {
      setCurrentIndex(session.items.length);
      setRunning(false);
      setRemaining(0);
      void completeSession();
    }
  }, [completeSession, currentIndex, session]);

  useEffect(() => {
    if (!running || remaining == null) return;
    const timer = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev == null) return prev;
        if (prev <= 1) {
          window.clearInterval(timer);
          advanceToNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      window.clearInterval(timer);
    };
  }, [advanceToNext, running, remaining]);

  const fmt = useCallback((s: number | null) => {
    if (s == null) return '--:--';
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${ss}`;
  }, []);

  return (
    <>
      <Head><title>Practice — Study Buddy</title></Head>
      <Container className="py-10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge variant="info">Guided practice</Badge>
            <h1 className="mt-3 text-3xl font-semibold">Focus session</h1>
            <p className="text-sm text-muted-foreground">Session ID: {id}</p>
          </div>
          <Link href="/ai/study-buddy" className="text-sm text-primary underline">
            ← Back to builder
          </Link>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {!session ? (
          <Card className="p-6 text-sm">
            <p className="mb-4 text-muted-foreground">
              Session not found or no longer accessible. Try creating a new Study Buddy session from the builder.
            </p>
            <Button onClick={markStarted}>Attempt reload</Button>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Card className="relative overflow-hidden border-none bg-gradient-to-r from-vibrantPurple/90 via-electricBlue/80 to-sapphire/80 text-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.18),_transparent_55%)]" />
              <div className="relative flex flex-col gap-6 p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-wide text-white/80">Current block</p>
                    <h2 className="mt-2 text-3xl font-semibold">
                      {currentItem ? currentItem.skill : 'All done!'}
                    </h2>
                    <p className="text-sm text-white/70">
                      {currentItem
                        ? `Stay focused for ${currentItem.minutes} minutes.`
                        : 'Review your notes or celebrate a streak-safe day.'}
                    </p>
                    <div className="mt-3">
                      <Badge
                        variant={isCompleted ? 'success' : session?.state === 'started' ? 'info' : 'neutral'}
                        className="bg-white/10 text-white"
                      >
                        {isCompleted ? 'Completed' : session?.state === 'started' ? 'In progress' : 'Ready'}
                      </Badge>
                    </div>
                  </div>
                  <div className="rounded-ds-2xl border border-white/20 bg-white/10 px-6 py-4 text-center">
                    <p className="text-xs uppercase tracking-wide text-white/70">Time remaining</p>
                    <p className="mt-2 font-mono text-3xl font-semibold">{fmt(remaining)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                  <div className="rounded-ds-xl border border-white/20 bg-white/10 px-4 py-2">
                    Block {Math.min(currentIndex + 1, totalBlocks)} / {totalBlocks || '—'}
                  </div>
                  {nextItem && (
                    <div className="rounded-ds-xl border border-white/20 bg-white/10 px-4 py-2">
                      Next: <span className="font-semibold text-white">{nextItem.skill}</span>
                    </div>
                  )}
                  <div className="rounded-ds-xl border border-white/20 bg-white/10 px-4 py-2">
                    Planned total: {items.reduce((sum, it) => sum + it.minutes, 0)} min
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {session.state === 'pending' ? (
                    <Button size="lg" onClick={markStarted} className="bg-white text-dark hover:bg-white/90">
                      Start guided session
                    </Button>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        onClick={() => setRunning((r) => !r)}
                        className="bg-white text-dark hover:bg-white/90"
                        disabled={isCompleted}
                      >
                        {isCompleted ? 'Session complete' : running ? 'Pause' : 'Resume'}
                      </Button>
                      <Button
                        size="lg"
                        variant="ghost"
                        className="border border-white/30 bg-white/10 text-white hover:bg-white/20"
                        onClick={advanceToNext}
                        disabled={isCompleted}
                      >
                        Skip block
                      </Button>
                      <Button
                        size="lg"
                        variant="ghost"
                        className="border border-white/30 bg-white/10 text-white hover:bg-white/20"
                        onClick={() => {
                          setRunning(false);
                          setCurrentIndex(items.length);
                          setRemaining(0);
                          void completeSession();
                        }}
                        loading={completing}
                        loadingText="Logging…"
                        disabled={isCompleted}
                      >
                        Mark complete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Progress</h2>
                  <span className="text-sm text-muted-foreground">{progress}% complete</span>
                </div>
                <ProgressBar value={progress} className="mt-3" />

                <div className="mt-6 space-y-3 text-sm">
                  {items.length === 0 ? (
                    <p className="text-muted-foreground">No blocks scheduled for this session.</p>
                  ) : (
                    items.map((it, i) => (
                      <div
                        key={`${it.skill}-${i}`}
                        className={`flex items-center justify-between rounded-ds-xl border px-4 py-3 ${
                          i === currentIndex
                            ? 'border-primary/50 bg-primary/5 text-primary'
                            : 'border-border bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <div>
                          <p className="text-xs uppercase tracking-wide">Block {i + 1}</p>
                          <p className="text-base font-semibold">{it.skill}</p>
                        </div>
                        <span className="text-sm font-medium text-foreground">{it.minutes} min</span>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="p-6 text-sm text-muted-foreground">
                <h2 className="text-lg font-semibold text-foreground">Session tips</h2>
                <ul className="mt-3 list-disc space-y-2 pl-5">
                  <li>Jot quick wins after each block to reinforce progress.</li>
                  <li>Tap “Skip” if the block feels complete — we’ll keep your rhythm.</li>
                  <li>Finish strong by marking complete to protect your study streak.</li>
                </ul>
              </Card>
            </div>
          </div>
        )}
      </Container>
    </>
  );
};

export default PracticePage;
