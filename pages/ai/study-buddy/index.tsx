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
import { Badge } from '@/components/design-system/Badge';
import { GradientText } from '@/components/design-system/GradientText';
import { Input } from '@/components/design-system/Input';
import { Select } from '@/components/design-system/Select';
import { ProgressBar } from '@/components/design-system/ProgressBar';
import { useToast } from '@/components/design-system/Toaster';

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

const SKILL_OPTIONS: Array<SessionItem['skill']> = ['Reading', 'Listening', 'Writing', 'Speaking'];

const PRESETS: Array<{ name: string; minutes: number; description: string; items: SessionItem[] }> = [
  {
    name: 'Balanced warm-up',
    minutes: 30,
    description: 'A quick circuit to activate every skill.',
    items: [
      { skill: 'Listening', minutes: 8 },
      { skill: 'Reading', minutes: 8 },
      { skill: 'Writing', minutes: 8 },
      { skill: 'Speaking', minutes: 6 },
    ],
  },
  {
    name: 'Writing focus',
    minutes: 45,
    description: 'Deep writing practice with a reflection break.',
    items: [
      { skill: 'Writing', minutes: 25 },
      { skill: 'Reading', minutes: 10 },
      { skill: 'Speaking', minutes: 10 },
    ],
  },
  {
    name: 'Speaking drills',
    minutes: 20,
    description: 'Short, high-energy speaking reps and feedback time.',
    items: [
      { skill: 'Speaking', minutes: 12 },
      { skill: 'Listening', minutes: 8 },
    ],
  },
];

const DEFAULT_ITEM: SessionItem = { skill: 'Reading', minutes: 10 };

const StudyBuddyIndex: NextPage<PageProps> = ({ userId, latestSession: ssrLatest }) => {
  const router = useRouter();
  const supabase = useMemo(() => supabaseBrowser, []);
  const toast = useToast();

  // Builder state
  const [items, setItems] = useState<SessionItem[]>([{ ...DEFAULT_ITEM }]);
  const [fieldErrors, setFieldErrors] = useState<
    Record<number, Partial<Record<keyof SessionItem, string>>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Latest session
  const [latestSession, setLatestSession] = useState<StudySession | null>(ssrLatest);
  const [refreshing, setRefreshing] = useState(false);

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

  const minutesBySkill = useMemo(() => {
    return items.reduce<Record<string, number>>((acc, item) => {
      const key = item.skill;
      acc[key] = (acc[key] ?? 0) + (Number.isFinite(item.minutes) ? item.minutes : 0);
      return acc;
    }, {});
  }, [items]);

  useEffect(() => {
    setLatestSession(ssrLatest);
  }, [ssrLatest]);

  // Builder ops
  const addItem = useCallback(() => {
    if (items.length >= 5) return;
    setItems((prev) => [...prev, { ...DEFAULT_ITEM }]);
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

  const applyPreset = useCallback((presetItems: SessionItem[]) => {
    setItems(presetItems.map((item) => ({ ...item })));
    setFieldErrors({});
    setFormError(null);
  }, []);

  const refreshLatest = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle<StudySession>();

    if (error) {
      toast.error('Could not refresh session', error.message);
    }

    setLatestSession(data ?? null);
    setRefreshing(false);
  }, [supabase, toast, userId]);

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
        toast.error('Session could not be created', body?.error || undefined);
        return;
      }
      const session = body.session as StudySession;
      setLatestSession(session);
      toast.success('Session ready', 'Your blocks are saved and ready to launch.');
      await refreshLatest();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('[study-buddy] create exception:', e);
      setFormError('Could not create session.');
      toast.error('Something went wrong', 'Please try again in a moment.');
    } finally {
      setCreating(false);
    }
  }, [items, refreshLatest, toast, userId, validate]);

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

      <Container className="py-10 space-y-10">
        <Card className="relative overflow-hidden border-none bg-gradient-to-r from-vibrantPurple/90 via-electricBlue/80 to-sapphire/80 text-white">
          <div className="absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute left-[-4rem] bottom-[-6rem] h-52 w-52 rounded-full bg-white/10 blur-3xl" />
          <div className="relative p-8 md:p-10">
            <Badge variant="subtle" className="border border-white/30 bg-white/10 text-white">
              Study rhythm coach
            </Badge>
            <h1 className="mt-4 text-3xl font-semibold md:text-4xl">
              Design a <GradientText className="font-semibold">laser-focused</GradientText> practice session
            </h1>
            <p className="mt-3 max-w-2xl text-base text-white/80 md:text-lg">
              Stack personalised micro-blocks for the skills you want to sharpen today. When you’re ready, launch a guided session with smart timers and streak protection.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/80">
              <div className="rounded-ds-xl border border-white/20 bg-white/10 px-4 py-2">
                Total planned time: <span className="font-semibold text-white">{totalMinutes}</span> min
              </div>
              <div className="rounded-ds-xl border border-white/20 bg-white/10 px-4 py-2">
                Blocks: <span className="font-semibold text-white">{items.length}</span> / 5
              </div>
              <Button variant="ghost" size="sm" onClick={addItem} className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                Add block
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={createAndStart} disabled={creating} size="lg" className="bg-white text-dark hover:bg-white/90">
                {creating ? 'Preparing…' : 'Create & launch'}
              </Button>
              <Button onClick={createSession} disabled={creating} variant="ghost" size="lg" className="border border-white/40 bg-white/10 text-white hover:bg-white/20">
                {creating ? 'Saving…' : 'Save for later'}
              </Button>
              <Link href="/study-plan" className="text-sm underline text-white/80 hover:text-white">
                View personalised plan →
              </Link>
            </div>
          </div>
        </Card>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="p-6 shadow-lg">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">Session builder</h2>
                <p className="text-muted-foreground">
                  Mix 2–5 focused blocks. We’ll automatically rotate skills during practice.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">{totalMinutes}</span> min total ·{' '}
                <span className="font-medium">{items.length}</span> blocks
              </div>
            </div>

            <Separator className="my-5" />

            {formError && <Alert variant="danger">{formError}</Alert>}

            <div className="flex flex-col gap-4">
              {items.map((it, idx) => {
                const e = fieldErrors[idx] || {};
                return (
                  <Card key={`${it.skill}-${idx}`} className="border border-border/60 bg-muted/40 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end">
                      <div className="md:w-1/2">
                        <Select
                          label="Skill focus"
                          value={it.skill}
                          onChange={(ev) => updateItem(idx, { skill: ev.target.value })}
                          error={e.skill ?? null}
                          options={SKILL_OPTIONS}
                          required
                        />
                      </div>
                      <div className="md:w-1/3">
                        <Input
                          label="Minutes"
                          type="number"
                          min={1}
                          max={120}
                          value={it.minutes}
                          onChange={(ev) => updateItem(idx, { minutes: Number(ev.target.value || 0) })}
                          error={e.minutes ?? null}
                          required
                        />
                      </div>
                      <div className="md:w-1/6">
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full"
                          onClick={() => removeItem(idx)}
                          disabled={items.length === 1}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="secondary" onClick={addItem} disabled={items.length >= 5}>
                Add another block
              </Button>
              <Button variant="ghost" onClick={() => applyPreset([DEFAULT_ITEM])}>
                Reset to default
              </Button>
            </div>

            <div className="mt-6 space-y-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Time allocation</p>
              <div className="space-y-2">
                {Object.entries(minutesBySkill).map(([skill, minutes]) => (
                  <div key={skill} className="flex items-center gap-3">
                    <span className="w-24 text-muted-foreground">{skill}</span>
                    <ProgressBar value={totalMinutes ? Math.round((minutes / totalMinutes) * 100) : 0} className="h-2 flex-1" />
                    <span className="w-12 text-right font-medium">{minutes}m</span>
                  </div>
                ))}
                {items.length === 0 && <p>No blocks yet. Add one to start planning.</p>}
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Latest session</h2>
                  <p className="text-sm text-muted-foreground">
                    Launch the most recent plan or refresh to pick up new changes.
                  </p>
                </div>
                <Button variant="secondary" size="sm" onClick={refreshLatest} disabled={refreshing}>
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </Button>
              </div>

              <Separator className="my-4" />

              {!latestSession ? (
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p>No saved sessions yet. Create a builder on the left to get started.</p>
                  <Button onClick={createSession} disabled={creating}>
                    {creating ? 'Saving…' : 'Save first session'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-ds-xl bg-muted/50 p-4 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Session ID</span>
                      <code className="font-mono text-foreground">{latestSession.id}</code>
                    </div>
                    <div className="mt-2 flex justify-between">
                      <span>Created</span>
                      <span>{new Date(latestSession.created_at).toLocaleString()}</span>
                    </div>
                    <div className="mt-1 flex justify-between">
                      <span>Status</span>
                      <span className="font-medium capitalize text-foreground">{latestSession.state}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {latestSession.items.map((it, index) => (
                      <Card key={`${it.skill}-${index}`} className="border border-border/50 bg-background p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm uppercase tracking-wide text-muted-foreground">Block {index + 1}</div>
                            <div className="text-lg font-semibold">{it.skill}</div>
                          </div>
                          <div className="rounded-ds-xl bg-muted px-3 py-1 text-sm font-medium">
                            {it.minutes} min
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Button size="lg" onClick={() => startSession(latestSession.id)}>
                    Open guided session
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-semibold">Quick presets</h2>
              <p className="text-sm text-muted-foreground">
                Jump in with a curated combo. You can fine-tune each block afterwards.
              </p>

              <div className="mt-4 space-y-3">
                {PRESETS.map((preset) => (
                  <Card key={preset.name} className="border border-border/60 bg-muted/40 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-base font-semibold">{preset.name}</h3>
                        <p className="text-sm text-muted-foreground">{preset.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-ds-lg bg-background px-3 py-1 text-sm font-medium">
                          {preset.minutes} min
                        </span>
                        <Button size="sm" onClick={() => applyPreset(preset.items)}>
                          Use preset
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </>
  );
};

export default StudyBuddyIndex;
