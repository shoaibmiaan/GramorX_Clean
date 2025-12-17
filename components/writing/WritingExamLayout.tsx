// components/writing/WritingExamShell.tsx
import * as React from 'react';
import { useRouter } from 'next/router';
import clsx from 'clsx';

import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { Alert } from '@/components/design-system/Alert';
import TextareaAutosize from '@/components/design-system/TextareaAutosize';

type ExamType = 'Academic' | 'General Training';

export type WritingTaskConfig = {
  id: string;
  label: 'Task 1' | 'Task 2';
  heading: string;
  body: string;
  recommendedMinutes: number;
  minWords: number;
};

export type WritingExamShellSubmitPayload = {
  autoSubmitted: boolean;
  answers: {
    taskId: string;
    label: 'Task 1' | 'Task 2';
    text: string;
    wordCount: number;
  }[];
};

type SubmitMode = 'enabled' | 'disabled';
type ModalId = 'strict' | 'timeWarning' | 'confirmSubmit' | 'exitWarning' | null;

type Props = {
  attemptId: string;
  startedAt: string; // ISO from server
  durationSeconds: number;

  testTitle: string;
  examType: ExamType;
  tasks: WritingTaskConfig[];

  initialDrafts?: Record<string, { text: string }>;

  submitMode?: SubmitMode;
  isSubmitting?: boolean;

  onSubmit: (payload: WritingExamShellSubmitPayload) => Promise<void> | void;
  onExit: () => void;
};

const countWords = (text: string): number => {
  const cleaned = text.replace(/\u00A0/g, ' ').trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
};

const formatSeconds = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  const hh = Math.floor(safe / 3600);
  const mm = Math.floor((safe % 3600) / 60);
  const ss = safe % 60;
  if (hh > 0) return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
};

const BackdropModal: React.FC<{
  title: string;
  open: boolean;
  children: React.ReactNode;
}> = ({ title, open, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-ds-2xl border border-border bg-card p-5 shadow-xl">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
};

export const WritingExamShell: React.FC<Props> = ({
  attemptId,
  startedAt,
  durationSeconds,

  testTitle,
  examType,
  tasks,
  initialDrafts,

  submitMode = 'enabled',
  isSubmitting = false,

  onSubmit,
  onExit,
}) => {
  const router = useRouter();

  const [activeTaskId, setActiveTaskId] = React.useState<string>(tasks[0]?.id ?? '');
  const [drafts, setDrafts] = React.useState<Record<string, { text: string }>>(() => {
    const base: Record<string, { text: string }> = {};
    for (const t of tasks) {
      base[t.id] = { text: initialDrafts?.[t.id]?.text ?? '' };
    }
    return base;
  });

  const [modal, setModal] = React.useState<ModalId>(null);
  const [hasShownTimeWarning, setHasShownTimeWarning] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const [locked, setLocked] = React.useState(false);

  const startedAtMs = React.useMemo(() => {
    const ms = Date.parse(startedAt);
    return Number.isFinite(ms) ? ms : Date.now();
  }, [startedAt]);

  const [nowMs, setNowMs] = React.useState(() => Date.now());

  const hasSubmittedRef = React.useRef(false);
  const allowNavigationRef = React.useRef(false);

  const dirty = React.useMemo(
    () => tasks.some((t) => (drafts[t.id]?.text ?? '').trim().length > 0),
    [drafts, tasks],
  );

  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? tasks[0] ?? null;
  const activeText = activeTask ? drafts[activeTask.id]?.text ?? '' : '';

  const elapsedSec = Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
  const remainingSec = Math.max(0, Math.floor(durationSeconds - elapsedSec));

  const isExpired = remainingSec <= 0;
  const underTimeWarning = remainingSec > 0 && remainingSec <= 5 * 60;

  const task1 = tasks.find((t) => t.label === 'Task 1') ?? tasks[0];
  const task2 = tasks.find((t) => t.label === 'Task 2') ?? tasks[1] ?? tasks[0];

  const wc1 = countWords(drafts[task1?.id ?? '']?.text ?? '');
  const wc2 = countWords(drafts[task2?.id ?? '']?.text ?? '');

  const belowMin1 = wc1 > 0 && wc1 < (task1?.minWords ?? 150);
  const belowMin2 = wc2 > 0 && wc2 < (task2?.minWords ?? 250);

  const hasEmptyTask = tasks.some((t) => !(drafts[t.id]?.text ?? '').trim());

  React.useEffect(() => {
    setModal('strict');
  }, []);

  React.useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  React.useEffect(() => {
    if (underTimeWarning && !hasShownTimeWarning && !locked && !hasSubmittedRef.current) {
      setModal('timeWarning');
    }
  }, [underTimeWarning, hasShownTimeWarning, locked]);

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (allowNavigationRef.current) return;
      if (!dirty) return;
      if (locked || hasSubmittedRef.current) return;

      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty, locked]);

  React.useEffect(() => {
    const onRouteChangeStart = (url: string) => {
      if (allowNavigationRef.current) return;
      if (!dirty) return;
      if (locked || hasSubmittedRef.current) return;

      if (url === router.asPath) return;

      setModal('exitWarning');
      router.events.emit('routeChangeError');
      throw new Error('Route change aborted by WritingExamShell (exit warning).');
    };

    router.events.on('routeChangeStart', onRouteChangeStart);
    return () => router.events.off('routeChangeStart', onRouteChangeStart);
  }, [router, dirty, locked]);

  const changeText = (taskId: string, value: string) => {
    setDrafts((prev) => ({ ...prev, [taskId]: { text: value } }));
  };

  const buildPayload = (autoSubmitted: boolean): WritingExamShellSubmitPayload => {
    return {
      autoSubmitted,
      answers: tasks.map((t) => {
        const raw = drafts[t.id]?.text ?? '';
        const trimmed = raw.trim();
        return {
          taskId: t.id,
          label: t.label,
          text: trimmed,
          wordCount: countWords(trimmed),
        };
      }),
    };
  };

  const doSubmitOnce = async (autoSubmitted: boolean) => {
    if (submitMode === 'disabled') return;
    if (isSubmitting) return;
    if (locked) return;
    if (hasSubmittedRef.current) return;

    // For auto-submit at 0, we still require both tasks attempted. If not, we submit anyway? IELTS would submit whatever is typed.
    // Day 19 strict rule: submit whatever exists, but keep server validation strict if you want.
    // Here we allow auto-submit even if one task is empty, but manual submit still blocks.
    if (!autoSubmitted && hasEmptyTask) {
      setSubmitError('You must attempt both Task 1 and Task 2 before finishing the test.');
      return;
    }

    hasSubmittedRef.current = true;
    setLocked(true);
    setSubmitError(null);

    try {
      await onSubmit(buildPayload(autoSubmitted));
      allowNavigationRef.current = true;
    } catch (e) {
      // If submit fails, unlock so user can retry
      hasSubmittedRef.current = false;
      setLocked(false);
      setSubmitError(e instanceof Error ? e.message : 'Failed to submit');
    }
  };

  // ✅ Auto-submit at time=0 (ONLY ONCE)
  React.useEffect(() => {
    if (!isExpired) return;
    if (locked) return;
    if (hasSubmittedRef.current) return;

    void doSubmitOnce(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isExpired]);

  const requestExit = () => {
    if (locked || hasSubmittedRef.current) {
      allowNavigationRef.current = true;
      onExit();
      return;
    }
    setModal('exitWarning');
  };

  const confirmExit = () => {
    allowNavigationRef.current = true;
    setModal(null);
    onExit();
  };

  const cancelExit = () => setModal(null);

  const openConfirmSubmit = () => {
    setSubmitError(null);
    setModal('confirmSubmit');
  };

  const confirmSubmit = async () => {
    setModal(null);
    await doSubmitOnce(false);
  };

  const acceptStrict = () => setModal(null);
  const dismissTimeWarning = () => {
    setHasShownTimeWarning(true);
    setModal(null);
  };

  const timeLabel = formatSeconds(remainingSec);

  return (
    <div className="flex min-h-screen flex-col bg-lightBg">
      <BackdropModal title="Exam rules" open={modal === 'strict'}>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            You are in <span className="font-semibold text-foreground">IELTS-style strict mode</span>.
            Leaving the page can invalidate your attempt.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={acceptStrict}>
              I understand
            </Button>
          </div>
        </div>
      </BackdropModal>

      <BackdropModal title="Time warning" open={modal === 'timeWarning'}>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Only <span className="font-semibold text-foreground">5 minutes</span> remaining.
            Finalize both tasks.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={dismissTimeWarning}>
              Continue
            </Button>
          </div>
        </div>
      </BackdropModal>

      <BackdropModal title="Confirm finish" open={modal === 'confirmSubmit'}>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="rounded-ds-xl border border-border bg-muted/40 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-foreground">Task 1</div>
              <div className={clsx('text-xs', belowMin1 ? 'text-destructive' : 'text-muted-foreground')}>
                Words: {wc1} / min {task1?.minWords ?? 150}
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-xs font-semibold text-foreground">Task 2</div>
              <div className={clsx('text-xs', belowMin2 ? 'text-destructive' : 'text-muted-foreground')}>
                Words: {wc2} / min {task2?.minWords ?? 250}
              </div>
            </div>
          </div>

          {hasEmptyTask ? (
            <Alert tone="destructive" className="text-xs">
              You must attempt both tasks before finishing.
            </Alert>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModal(null)}>
              Go back
            </Button>
            <Button
              variant="primary"
              onClick={() => void confirmSubmit()}
              disabled={isSubmitting || submitMode === 'disabled' || hasEmptyTask || locked}
            >
              Submit now
            </Button>
          </div>
        </div>
      </BackdropModal>

      <BackdropModal title="Exit exam?" open={modal === 'exitWarning'}>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>If you exit now, you may lose time and your attempt might not be counted.</p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={cancelExit}>
              Stay
            </Button>
            <Button variant="primary" onClick={confirmExit}>
              Exit anyway
            </Button>
          </div>
        </div>
      </BackdropModal>

      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-[2px] font-medium uppercase tracking-[0.16em]">
                IELTS {examType} • Writing
              </span>
              <span className="rounded-full bg-muted px-2 py-[2px] font-medium">
                Attempt: {attemptId.slice(0, 8)}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground">{testTitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end gap-1">
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Time remaining
              </span>
              <Badge
                variant={isExpired ? 'destructive' : underTimeWarning ? 'accent' : 'neutral'}
                size="sm"
              >
                {timeLabel}
              </Badge>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-2 text-[11px]"
              onClick={requestExit}
              disabled={isSubmitting}
            >
              Exit mock
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-4">
          {submitError ? (
            <Alert tone="destructive" className="text-xs">
              {submitError}
            </Alert>
          ) : null}

          {locked ? (
            <Alert tone="info" className="text-xs">
              Attempt is locked. Your answers are now read-only.
            </Alert>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {tasks.map((task) => {
              const text = drafts[task.id]?.text ?? '';
              const wc = countWords(text);
              const belowMin = wc > 0 && wc < task.minWords;

              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setActiveTaskId(task.id)}
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition',
                    activeTaskId === task.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted',
                  )}
                >
                  <span className="font-semibold">{task.label}</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span className={clsx('text-[11px]', belowMin ? 'text-destructive' : 'text-muted-foreground')}>
                    {wc} words{belowMin ? ` / ${task.minWords}+` : ''}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
            <section className="flex min-h-[360px] flex-col rounded-ds-xl border border-border bg-card">
              <header className="border-b border-border px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {activeTask?.label ?? 'Task'}
                </p>
                {activeTask ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Recommended time: <span className="font-medium">{activeTask.recommendedMinutes} minutes</span>
                    {' • '}
                    Minimum words: <span className="font-medium">{activeTask.minWords} words</span>
                  </p>
                ) : null}
              </header>

              <div className="flex-1 overflow-auto px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                {(activeTask?.body ?? '')
                  .split('\n')
                  .filter((x) => x.length > 0)
                  .map((line) => (
                    <p key={line} className="mb-2 last:mb-0">
                      {line}
                    </p>
                  ))}
              </div>
            </section>

            <section className="flex min-h-[420px] flex-col rounded-ds-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Answer area
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {locked ? 'Read-only' : 'Type your answer like the official exam.'}
                    </span>
                  </div>

                  <div className="text-right text-[11px] text-muted-foreground">
                    <div>
                      Task 1:{' '}
                      <span className={clsx('font-medium', belowMin1 ? 'text-destructive' : 'text-foreground')}>
                        {wc1}
                      </span>{' '}
                      / {task1?.minWords ?? 150}
                    </div>
                    <div>
                      Task 2:{' '}
                      <span className={clsx('font-medium', belowMin2 ? 'text-destructive' : 'text-foreground')}>
                        {wc2}
                      </span>{' '}
                      / {task2?.minWords ?? 250}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 px-4 py-3">
                <TextareaAutosize
                  value={activeText}
                  onChange={(e) => {
                    if (!activeTask) return;
                    if (locked) return;
                    changeText(activeTask.id, e.target.value);
                  }}
                  minRows={12}
                  readOnly={locked}
                  className="w-full resize-none rounded-ds-xl border border-border bg-input px-3 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Start typing here…"
                  spellCheck={false}
                />
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    Words: <span className="font-medium text-foreground">{countWords(activeText)}</span>
                    {activeTask ? ` / min ${activeTask.minWords}` : ''}
                  </span>
                  <span>Auto-submit at 00:00</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="text-[11px] text-muted-foreground">
            {locked ? 'Submitted.' : 'Finish requires confirmation. Timeout triggers auto-submit.'}
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={openConfirmSubmit}
            disabled={isSubmitting || submitMode === 'disabled' || locked}
          >
            {locked ? 'Locked' : isSubmitting ? 'Submitting…' : 'Finish Writing test'}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default WritingExamShell;
