// pages/ai/study-buddy/index.tsx
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Container } from '@/components/design-system/Container';
import { Separator } from '@/components/design-system/Separator';
import { Alert } from '@/components/design-system/Alert';

type SessionItem = {
  skill: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | string;
  minutes: number;
};

type StudySession = {
  id: string;
  user_id: string;
  items: SessionItem[];
  state: 'pending' | 'started' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string | null;
};

type PageProps = {
  userId: string | null;
  latestSession: StudySession | null;
};

const ItemSchema = z.object({
  skill: z.string().min(2, 'Choose a skill'),
  minutes: z.number().int('Whole minutes only').min(1, 'Min 1').max(120, 'Max 120'),
});
const BuilderSchema = z.array(ItemSchema).min(1, 'Add at least one item').max(5, 'Max 5 items');

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { props: { userId: null, latestSession: null } };

  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1);

  const latestSession = (sessions?.[0] as StudySession | undefined) ?? null;
  return { props: { userId: user.id, latestSession } };
};

const StudyBuddyIndex: NextPage<PageProps> = ({ userId, latestSession: ssrLatest }) => {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser, []);

  // Builder state
  const [items, setItems] = useState<SessionItem[]>([{ skill: 'Reading', minutes: 10 }]);
  const [fieldErrors, setFieldErrors] = useState<
    Record<number, Partial<Record<keyof SessionItem, string>>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Latest session
  const [latestSession, setLatestSession] = useState<StudySession | null>(ssrLatest);

  // Sanity auth check (non-blocking)
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (userId) return;
      const { data } = await supabase.auth.getUser();
      if (!ignore && !data.user) {
        // Still render; redirect optional.
      }
    })();
    return () => {
      ignore = true;
    };
  }, [supabase, userId]);

  const totalMinutes = useMemo(
    () => items.reduce((sum, it) => sum + (Number.isFinite(it.minutes) ? it.minutes : 0), 0),
    [items],
  );

  // Builder ops
  const addItem = useCallback(() => {
    if (items.length >= 5) return;
    setItems((prev) => [...prev, { skill: 'Reading', minutes: 10 }]);
  }, [items.length]);

  const removeItem = useCallback((idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });
  }, []);

  const updateItem = useCallback((idx: number, patch: Partial<SessionItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }, []);

  const validate = useCallback(
    (draft: SessionItem[]) => {
      const parsed = BuilderSchema.safeParse(
        draft.map((d) => ({ ...d, minutes: Number(d.minutes) })),
      );
      if (parsed.success) {
        setFieldErrors({});
        setFormError(null);
        return true;
      }
      const fe: Record<number, Partial<Record<keyof SessionItem, string>>> = {};
      for (const issue of parsed.error.issues) {
        const idx = issue.path[0] as number | undefined;
        const key = issue.path[1] as keyof SessionItem | undefined;
        if (typeof idx === 'number' && key) fe[idx] = { ...(fe[idx] || {}), [key]: issue.message };
        else setFormError(issue.message);
      }
      setFieldErrors(fe);
      if (!formError) setFormError('Please fix the highlighted fields.');
      return false;
    },
    [formError],
  );

  // API: create session (server-side ownership re-check)
  const createSession = useCallback(async () => {
    setCreating(true);
    try {
      if (!validate(items)) return;

      const resp = await fetch('/api/study-buddy/sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          items: items.map((d) => ({ ...d, minutes: Number(d.minutes) })),
        }),
      });
      const body = await resp.json();
      if (!resp.ok) {
        setFormError(body?.error || 'Could not create session.');
        return;
      }
      setLatestSession(body.session as StudySession);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[study-buddy] create exception:', e);
      setFormError('Could not create session.');
    } finally {
      setCreating(false);
    }
  }, [items, validate]);

  // Create then route to newest /ai path
  const createAndStart = useCallback(async () => {
    await createSession();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('study_sessions')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const id = data?.id || latestSession?.id;
    if (id) await router.push(`/ai/study-buddy/session/${id}/practice`);
  }, [createSession, latestSession, router, supabase]);

  // Start existing session
  const startSession = useCallback(
    async (id: string) => {
      await router.push(`/ai/study-buddy/session/${id}/practice`);
    },
    [router],
  );

  return (
    <>
      <Head>
        <title>Study Buddy — GramorX</title>
      </Head>

      <Container className="py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Study Buddy</h1>
            <p className="text-muted-foreground mt-1">
              Build a focused set of 2–5 blocks and start practicing.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            Total:&nbsp;<span className="font-medium">{totalMinutes}</span>&nbsp;min
          </div>
        </div>

        <Card className="mt-6 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Session Builder</h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={addItem} disabled={items.length >= 5}>
                Add Item
              </Button>
              <Button onClick={createSession} disabled={creating}>
                {creating ? 'Creating…' : 'Save'}
              </Button>
              <Button onClick={createAndStart} disabled={creating}>
                {creating ? 'Creating…' : 'Create & Start'}
              </Button>
            </div>
          </div>

          <Separator className="my-4" />

          {formError && <Alert variant="danger">{formError}</Alert>}

          <div className="space-y-4">
            {items.map((it, idx) => {
              const e = fieldErrors[idx] || {};
              return (
                <Card key={idx} className="p-3">
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-sm mb-1">Skill</label>
                      <select
                        className="w-full rounded-md border px-3 py-2"
                        value={it.skill}
                        onChange={(ev) => updateItem(idx, { skill: ev.target.value })}
                      >
                        <option>Reading</option>
                        <option>Listening</option>
                        <option>Writing</option>
                        <option>Speaking</option>
                      </select>
                      {e.skill && <div className="mt-1 text-xs text-red-600">{e.skill}</div>}
                    </div>

                    <div className="col-span-8 md:col-span-4">
                      <label className="block text-sm mb-1">Minutes</label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        className="w-full rounded-md border px-3 py-2"
                        value={it.minutes}
                        onChange={(ev) =>
                          updateItem(idx, { minutes: Number(ev.target.value || 0) })
                        }
                      />
                      {e.minutes && <div className="mt-1 text-xs text-red-600">{e.minutes}</div>}
                    </div>

                    <div className="col-span-4 md:col-span-2 flex items-end">
                      <Button variant="ghost" onClick={() => removeItem(idx)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground mt-3">
            Tip: 2–5 focused blocks work best.
          </p>
        </Card>

        <Card className="mt-8 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Latest Session</h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => router.reload()}>
                Refresh
              </Button>
              {latestSession ? (
                <Button onClick={() => startSession(latestSession.id)}>Start</Button>
              ) : (
                <Button disabled>Start</Button>
              )}
            </div>
          </div>

          <Separator className="my-4" />

          {!latestSession ? (
            <p className="text-sm text-muted-foreground">
              No session yet. Create one above to get started.
            </p>
          ) : (
            <div>
              <div className="text-xs text-muted-foreground">
                ID:&nbsp;<code>{latestSession.id}</code>
              </div>

              <div className="grid md:grid-cols-3 gap-3 mt-4">
                {latestSession.items.map((it, i) => (
                  <Card key={`${it.skill}-${i}`} className="p-3">
                    <div className="font-medium">{it.skill}</div>
                    <div className="text-sm text-muted-foreground">
                      Focused block • {it.minutes} min
                    </div>
                  </Card>
                ))}
              </div>

              <div className="mt-5 text-sm">
                Want to adjust? <Link href="#" className="underline">Edit (soon)</Link>
              </div>
            </div>
          )}
        </Card>
      </Container>
    </>
  );
};

export default StudyBuddyIndex;
