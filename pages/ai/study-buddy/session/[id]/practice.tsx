// pages/ai/study-buddy/session/[id]/practice.tsx
import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getServerClient } from '@/lib/supabaseServer';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Container } from '@/components/design-system/Container';
import { Alert } from '@/components/design-system/Alert';

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
  const supabase = getServerClient(ctx.req, ctx.res);

  const { data: session } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle<StudySession>();

  return { props: { id, initial: session ?? null } };
};

const seconds = (m: number) => Math.max(0, Math.floor(m * 60));

const PracticePage: NextPage<Props> = ({ id, initial }) => {
  const [session, setSession] = useState<StudySession | null>(initial);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(
    initial?.items?.length ? seconds(initial.items[0].minutes) : null,
  );
  const [running, setRunning] = useState(false);
  const tic = useRef<number | null>(null);

  const currentItem = useMemo(() => (session ? session.items[currentIndex] ?? null : null), [session, currentIndex]);

  useEffect(() => {
    return () => {
      if (tic.current) window.clearInterval(tic.current);
    };
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
      setSession(s);
      setCurrentIndex(0);
      setRemaining(s.items?.length ? seconds(s.items[0].minutes) : null);
      setRunning(true);
    } catch (e: any) {
      setError(e?.message ?? 'start_failed');
    }
  }, [id]);

  // simple timer
  useEffect(() => {
    if (!running || remaining == null) return;
    tic.current = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev == null) return null;
        if (prev <= 1) {
          if (tic.current) window.clearInterval(tic.current);
          setRunning(false);
          const next = currentIndex + 1;
          if (session && next < session.items.length) {
            setCurrentIndex(next);
            setRemaining(seconds(session.items[next].minutes));
            setRunning(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (tic.current) window.clearInterval(tic.current);
    };
  }, [running, remaining, currentIndex, session]);

  const fmt = (s: number | null) => {
    if (s == null) return '--:--';
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${ss}`;
    };

  return (
    <>
      <Head><title>Practice — Study Buddy</title></Head>
      <Container className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Practice Session</h1>
            <div className="text-sm text-muted-foreground">ID: {id}</div>
          </div>
          <Link href="/ai/study-buddy" className="underline">← Back</Link>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {!session ? (
          <Card className="p-6">
            <p className="mb-4">Session not found or not accessible.</p>
            <Button onClick={markStarted}>Try Start Anyway</Button>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="p-4 md:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Current task</div>
                  <div className="mt-2 text-lg font-medium">
                    {currentItem ? currentItem.skill : 'No tasks'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Remaining</div>
                  <div className="mt-1 text-3xl font-mono">{fmt(remaining)}</div>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                {session.state === 'pending' ? (
                  <Button onClick={markStarted}>Start session</Button>
                ) : (
                  <>
                    <Button onClick={() => setRunning((r) => !r)}>{running ? 'Pause' : 'Resume'}</Button>
                    <Button onClick={() => {
                      // quick skip
                      if (!session) return;
                      const next = currentIndex + 1;
                      if (next < session.items.length) {
                        setCurrentIndex(next);
                        setRemaining(seconds(session.items[next].minutes));
                        setRunning(true);
                      } else {
                        setRunning(false);
                        setRemaining(null);
                      }
                    }}>Skip</Button>
                  </>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Session details</div>
              <ul className="mt-3 list-disc pl-5 space-y-1 text-sm">
                {session.items.map((it, i) => (
                  <li key={`${it.skill}-${i}`} className={i === currentIndex ? 'font-semibold' : ''}>
                    {i + 1}. {it.skill} — {it.minutes} min {i === currentIndex ? '(current)' : ''}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        )}
      </Container>
    </>
  );
};

export default PracticePage;
