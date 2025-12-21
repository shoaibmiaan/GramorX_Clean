import * as React from 'react';
import Head from 'next/head';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { Icon } from '@/components/design-system/Icon';

type AttemptStatus = 'created' | 'in_progress' | 'submitted' | 'evaluated';

type TaskPrompt = {
  taskNumber: 1 | 2;
  title?: string | null;
  instruction?: string | null;
  prompt?: string | null; // full question text
  wordLimit?: number | null;
};

type GetAttemptOk = {
  ok: true;
  attempt: {
    id: string;
    mode: 'academic' | 'general';
    status: AttemptStatus;
    startedAt: string;
    submittedAt: string | null;
    evaluatedAt: string | null;
    durationSeconds: number;
    remainingSeconds: number | null;
  };
  answers: Array<{
    taskNumber: 1 | 2;
    answerText: string;
    wordCount: number;
    lastSavedAt: string;
  }>;
  tasks?: TaskPrompt[];
};

type GetAttemptResp =
  | GetAttemptOk
  | { ok: false; error: string; details?: unknown };

type AutosaveResp =
  | { ok: true; savedAt: string; wordCount: number }
  | { ok: false; error: string; details?: unknown };

type SubmitResp =
  | { ok: true; status?: 'submitted' | 'evaluated'; attemptId?: string }
  | { ok: false; error: string; details?: unknown };

function wordCount(text: string) {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

function formatTimeLeft(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  if (hh > 0) return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  return `${pad(mm)}:${pad(ss)}`;
}

function formatSavedAt(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function getTaskFromList(tasks: TaskPrompt[] | undefined, n: 1 | 2) {
  return (tasks ?? []).find((t) => t.taskNumber === n) ?? null;
}

const WritingAttemptPage: NextPage = () => {
  const router = useRouter();
  const attemptId =
    typeof router.query.attemptId === 'string' ? router.query.attemptId : null;

  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const [status, setStatus] = React.useState<AttemptStatus>('created');
  const [mode, setMode] = React.useState<'academic' | 'general'>('academic');
  const [startedAt, setStartedAt] = React.useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = React.useState<number>(3600);

  // ✅ IELTS starts from Task 1
  const [activeTask, setActiveTask] = React.useState<1 | 2>(1);

  const [task1, setTask1] = React.useState<TaskPrompt | null>(null);
  const [task2, setTask2] = React.useState<TaskPrompt | null>(null);

  const [t1, setT1] = React.useState('');
  const [t2, setT2] = React.useState('');
  const [t1SavedAt, setT1SavedAt] = React.useState<string | null>(null);
  const [t2SavedAt, setT2SavedAt] = React.useState<string | null>(null);

  const [savingTask, setSavingTask] = React.useState<null | 1 | 2>(null);

  const [submitOpen, setSubmitOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const [now, setNow] = React.useState(Date.now());
  const isLocked = status === 'submitted' || status === 'evaluated';

  // Tick clock
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const timeLeftSeconds = React.useMemo(() => {
    if (!startedAt) return durationSeconds;
    const startMs = new Date(startedAt).getTime();
    const elapsed = Math.floor((now - startMs) / 1000);
    return Math.max(0, durationSeconds - elapsed);
  }, [startedAt, durationSeconds, now]);

  const timeIsUp = timeLeftSeconds <= 0;

  // Fetch attempt + answers (+ tasks if API returns)
  React.useEffect(() => {
    if (!attemptId) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch(
          `/api/writing/get-attempt?attemptId=${encodeURIComponent(attemptId)}`
        );
        const json = (await r.json()) as GetAttemptResp;

        if (!json.ok) throw new Error(json.error);
        if (cancelled) return;

        setStatus(json.attempt.status);
        setMode(json.attempt.mode);
        setStartedAt(json.attempt.startedAt);
        setDurationSeconds(json.attempt.durationSeconds);

        const a1 = json.answers.find((x) => x.taskNumber === 1);
        const a2 = json.answers.find((x) => x.taskNumber === 2);

        setT1(a1?.answerText ?? '');
        setT2(a2?.answerText ?? '');
        setT1SavedAt(a1?.lastSavedAt ?? null);
        setT2SavedAt(a2?.lastSavedAt ?? null);

        const t1p = getTaskFromList(json.tasks, 1);
        const t2p = getTaskFromList(json.tasks, 2);
        setTask1(t1p);
        setTask2(t2p);

        setActiveTask(1);
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [attemptId]);

  // Leave page warning (only while editable)
  React.useEffect(() => {
    if (isLocked) return;
    const onBeforeUnload = (ev: BeforeUnloadEvent) => {
      ev.preventDefault();
      ev.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isLocked]);

  // Debounced autosave (per task)
  const saveTimer = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, []);

  const scheduleSave = React.useCallback(
    (task: 1 | 2, nextText: string) => {
      if (!attemptId) return;
      if (isLocked) return;

      if (saveTimer.current) window.clearTimeout(saveTimer.current);

      saveTimer.current = window.setTimeout(async () => {
        setSavingTask(task);
        setErr(null);

        try {
          const r = await fetch('/api/writing/autosave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              attemptId,
              taskNumber: task,
              answerText: nextText,
            }),
          });

          const json = (await r.json()) as AutosaveResp;
          if (!json.ok) throw new Error(json.error);

          if (task === 1) setT1SavedAt(json.savedAt);
          if (task === 2) setT2SavedAt(json.savedAt);

          setStatus((s) => (s === 'created' ? 'in_progress' : s));
        } catch (e) {
          setErr((e as Error).message);
        } finally {
          setSavingTask(null);
        }
      }, 550);
    },
    [attemptId, isLocked]
  );

  const onChangeActive = (v: string) => {
    if (activeTask === 1) {
      setT1(v);
      scheduleSave(1, v);
    } else {
      setT2(v);
      scheduleSave(2, v);
    }
  };

  // ✅ FIX: submit function properly defined + redirect after success
  const submit = async () => {
    if (!attemptId) return;

    setSubmitting(true);
    setErr(null);

    try {
      const r = await fetch('/api/writing/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId }),
      });

      const json = (await r.json()) as SubmitResp;
      if (!json.ok) throw new Error(json.error);

      // lock UI immediately
      setStatus('submitted');
      setSubmitOpen(false);

      // ✅ GO RESULT PAGE (no more stuck here)
      await router.replace(`/mock/writing/result/${attemptId}`);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const headerStatusLabel =
    status === 'created'
      ? 'Not started'
      : status === 'in_progress'
      ? 'In progress'
      : status === 'submitted'
      ? 'Submitted · Evaluating…'
      : 'Evaluated';

  const activeText = activeTask === 1 ? t1 : t2;
  const activeWords = wordCount(activeText);

  const activeSavedAt = activeTask === 1 ? t1SavedAt : t2SavedAt;
  const activeIsSaving = savingTask === activeTask;

  const submitDisabled = isLocked || submitting || timeIsUp;

  const activePrompt = activeTask === 1 ? task1 : task2;
  const wordHint =
    activeTask === 1
      ? (activePrompt?.wordLimit ?? 150)
      : (activePrompt?.wordLimit ?? 250);

  return (
    <>
      <Head>
        <title>Writing Exam Room · GramorX</title>
      </Head>

      <main className="min-h-[100dvh] bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-[220px] flex-col gap-1">
              <div className="flex items-center gap-2 text-caption text-muted-foreground">
                <Link href="/mock/writing" className="hover:text-foreground">
                  Writing mocks
                </Link>
                <span>/</span>
                <span className="text-foreground">Writing</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-small font-semibold">IELTS Writing</span>
                <Badge tone="neutral" size="xs">
                  {mode === 'academic' ? 'Academic' : 'General'}
                </Badge>
                <Badge tone={isLocked ? 'info' : 'success'} size="xs">
                  {headerStatusLabel}
                </Badge>

                {timeLeftSeconds <= 300 ? (
                  <Badge tone="warning" size="xs">
                    <Icon name="AlertTriangle" size={14} className="mr-1" />
                    &lt; 5 min
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-ds-xl border border-border/60 bg-card px-3 py-2">
                <Icon name="Timer" size={16} />
                <span className="text-small font-semibold">
                  {formatTimeLeft(timeLeftSeconds)}
                </span>
              </div>

              <div className="hidden items-center gap-2 text-caption text-muted-foreground md:flex">
                {activeIsSaving ? (
                  <>
                    <Icon name="Loader2" size={14} className="animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : (
                  <>
                    <Icon name="CheckCircle2" size={14} />
                    <span>Saved {formatSavedAt(activeSavedAt)}</span>
                  </>
                )}
              </div>

              <Button
                size="sm"
                variant="primary"
                disabled={submitDisabled}
                onClick={() => setSubmitOpen(true)}
              >
                <Icon name="Send" size={16} className="mr-1" />
                Submit
              </Button>
            </div>
          </div>

          <div className="border-t border-border/60 bg-background/85">
            <div className="mx-auto flex w-full max-w-[1200px] items-center gap-2 px-4 py-2">
              <Button
                size="sm"
                variant={activeTask === 1 ? 'primary' : 'secondary'}
                onClick={() => setActiveTask(1)}
                disabled={loading}
              >
                Task 1
              </Button>
              <Button
                size="sm"
                variant={activeTask === 2 ? 'primary' : 'secondary'}
                onClick={() => setActiveTask(2)}
                disabled={loading}
              >
                Task 2
              </Button>

              <div className="ml-auto flex items-center gap-2">
                <Badge tone="neutral" size="xs">
                  {activeWords} words
                </Badge>
                {timeIsUp ? (
                  <Badge tone="warning" size="xs">
                    Time is up
                  </Badge>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto w-full max-w-[1200px] px-4 py-4">
          {loading ? (
            <div className="rounded-ds-2xl border border-border/60 bg-card p-4 text-small text-muted-foreground">
              Loading attempt…
            </div>
          ) : err ? (
            <div className="rounded-ds-2xl border border-border/60 bg-card p-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <Icon name="AlertTriangle" />
                </span>
                <div className="min-w-0">
                  <p className="text-small font-semibold">Something went wrong</p>
                  <p className="mt-1 text-caption text-muted-foreground break-words">
                    {err}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => router.reload()}>
                      Retry
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link href="/mock/writing">Back</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="rounded-ds-2xl border border-border/60 bg-card">
                <div className="border-b border-border/60 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-small font-semibold">
                        {activeTask === 1 ? 'Writing Task 1' : 'Writing Task 2'}
                      </p>
                      <p className="mt-0.5 text-caption text-muted-foreground">
                        {mode === 'academic'
                          ? 'Read the task carefully and plan before you write.'
                          : 'Make sure you cover all bullet points and keep the tone correct.'}
                      </p>
                    </div>
                    <Badge tone="neutral" size="xs">
                      {wordHint}+ words
                    </Badge>
                  </div>
                </div>

                <div className="max-h-[calc(100dvh-220px)] overflow-auto px-4 py-4">
                  {activePrompt?.instruction ? (
                    <p className="text-caption font-medium text-muted-foreground">
                      {activePrompt.instruction}
                    </p>
                  ) : null}

                  {activePrompt?.prompt ? (
                    <div className="mt-3 whitespace-pre-wrap text-small leading-6">
                      {activePrompt.prompt}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-ds-xl border border-border/60 bg-muted/20 p-3 text-caption text-muted-foreground">
                      Prompt is not available yet.
                      <br />
                      Your API must return <span className="font-medium text-foreground">tasks</span> with{' '}
                      <span className="font-medium text-foreground">prompt</span> for Task 1/2 in{' '}
                      <span className="font-medium text-foreground">/api/writing/get-attempt</span>.
                    </div>
                  )}

                  {activePrompt?.wordLimit ? (
                    <p className="mt-4 text-caption text-muted-foreground">
                      Minimum word count:{' '}
                      <span className="font-medium text-foreground">{activePrompt.wordLimit}</span>
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-ds-2xl border border-border/60 bg-card">
                <div className="border-b border-border/60 px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Icon name="PenTool" size={16} />
                      </span>
                      <div>
                        <p className="text-small font-semibold">Answer sheet</p>
                        <p className="text-caption text-muted-foreground">
                          {isLocked ? 'Locked after submission' : 'Write your answer below.'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-caption text-muted-foreground">Word count</p>
                      <p className="text-small font-semibold">{activeWords}</p>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-4">
                  <textarea
                    value={activeText}
                    onChange={(e) => onChangeActive(e.target.value)}
                    disabled={isLocked || timeIsUp}
                    rows={20}
                    className="w-full resize-none rounded-ds-xl border border-border/60 bg-background px-3 py-3 text-small outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder={activeTask === 1 ? 'Write your Task 1 response…' : 'Write your Task 2 essay…'}
                  />

                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      {activeTask === 1 ? 'Task 1 recommended: 150+ words' : 'Task 2 recommended: 250+ words'}
                    </span>
                    <span className="flex items-center gap-2">
                      {activeIsSaving ? (
                        <>
                          <Icon name="Loader2" size={14} className="animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <Icon name="CheckCircle2" size={14} />
                          Saved {formatSavedAt(activeSavedAt)}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {submitOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-ds-2xl border border-border/60 bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-small font-semibold">Submit your writing?</p>
                  <p className="mt-1 text-caption text-muted-foreground">
                    After submission, your answers are locked. No edits.
                  </p>
                </div>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setSubmitOpen(false)}
                  disabled={submitting}
                >
                  <Icon name="X" size={16} />
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-caption">
                <div className="rounded-ds-xl border border-border/60 bg-background p-3">
                  <p className="text-[11px] text-muted-foreground">Task 1 words</p>
                  <p className="text-small font-semibold">{wordCount(t1)}</p>
                </div>
                <div className="rounded-ds-xl border border-border/60 bg-background p-3">
                  <p className="text-[11px] text-muted-foreground">Task 2 words</p>
                  <p className="text-small font-semibold">{wordCount(t2)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSubmitOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={submit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Icon name="Loader2" size={16} className="mr-1 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      <Icon name="Send" size={16} className="mr-1" />
                      Submit now
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </>
  );
};

export default WritingAttemptPage;
