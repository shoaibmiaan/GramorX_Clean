// components/writing/WritingExamShell.tsx
import * as React from 'react';
import clsx from 'clsx';

import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { Alert } from '@/components/design-system/Alert';
import TextareaAutosize from '@/components/design-system/TextareaAutosize';
import { useExamTimer } from '@/lib/hooks/useExamTimer';

type ExamType = 'Academic' | 'General Training';

export type WritingTaskConfig = {
  id: string;
  label: 'Task 1' | 'Task 2';
  heading: string;
  body: string;
  recommendedMinutes: number | null;
  minWords: number | null;
};

export type WritingExamShellSubmitPayload = {
  answers: {
    taskId: string;
    label: 'Task 1' | 'Task 2';
    text: string;
    wordCount: number;
  }[];
};

type Props = {
  testTitle: string;
  examType: ExamType;
  durationMinutes: number;
  tasks: WritingTaskConfig[];
  initialDrafts?: Record<
    string,
    {
      text: string;
    }
  >;
  onSubmit: (payload: WritingExamShellSubmitPayload) => Promise<void> | void;
  isSubmitting?: boolean;
};

const countWords = (text: string): number => {
  if (!text) return 0;
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
};

const formatSeconds = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  const min = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${min.toString().padStart(2, '0')}:${sec
    .toString()
    .padStart(2, '0')}`;
};

export const WritingExamShell: React.FC<Props> = ({
  testTitle,
  examType,
  durationMinutes,
  tasks,
  initialDrafts,
  onSubmit,
  isSubmitting = false,
}) => {
  const [activeTaskId, setActiveTaskId] = React.useState<string>(
    tasks[0]?.id ?? '',
  );

  const [drafts, setDrafts] = React.useState<
    Record<
      string,
      {
        text: string;
      }
    >
  >(() => {
    const base: Record<string, { text: string }> = {};
    tasks.forEach((t) => {
      base[t.id] = {
        text: initialDrafts?.[t.id]?.text ?? '',
      };
    });
    return base;
  });

  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const { secondsRemaining, isExpired, underTimeWarning } = useExamTimer({
    totalSeconds: (durationMinutes || 60) * 60,
  });

  const activeTask =
    tasks.find((t) => t.id === activeTaskId) ?? tasks[0] ?? null;
  const activeText = activeTask ? drafts[activeTask.id]?.text ?? '' : '';
  const wordCount = countWords(activeText);
  const minWords = activeTask?.minWords ?? null;
  const belowMinWords =
    typeof minWords === 'number' && wordCount > 0 && wordCount < minWords;

  const formattedRemaining = formatSeconds(secondsRemaining);

  const handleChangeTaskText = (taskId: string, value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [taskId]: {
        text: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!tasks.length) return;

    const hasEmptyTask = tasks.some((t) => !drafts[t.id]?.text?.trim());

    if (hasEmptyTask) {
      setSubmitError(
        'You must attempt both Task 1 and Task 2 before finishing the test.',
      );
      return;
    }

    setSubmitError(null);

    const answers: WritingExamShellSubmitPayload['answers'] = tasks.map((t) => {
      const raw = drafts[t.id]?.text ?? '';
      const trimmed = raw.trim();
      return {
        taskId: t.id,
        label: t.label,
        text: trimmed,
        wordCount: countWords(trimmed),
      };
    });

    await onSubmit({ answers });
  };

  return (
    <div className="flex min-h-screen flex-col bg-lightBg">
      {/* EXAM HEADER */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-[2px] font-medium uppercase tracking-[0.16em]">
                IELTS {examType} • Writing
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-small font-semibold text-foreground">
                {testTitle}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                Time remaining
              </span>
              <Badge
                variant={
                  isExpired
                    ? 'destructive'
                    : underTimeWarning
                    ? 'accent'
                    : 'neutral'
                }
                size="sm"
              >
                {formattedRemaining}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Total time: {durationMinutes} minutes
            </p>
          </div>
        </div>
      </header>

      {/* EXAM BODY */}
      <main className="flex-1">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-4">
          {/* Time alerts */}
          {isExpired && (
            <Alert tone="destructive" className="text-caption">
              Time is over. Your answers will be submitted automatically.
            </Alert>
          )}

          {underTimeWarning && !isExpired && (
            <Alert tone="info" className="text-caption">
              Last few minutes. Make sure both Task 1 and Task 2 have complete answers.
            </Alert>
          )}

          {/* Task selector chips */}
          <div className="flex flex-wrap items-center gap-2">
            {tasks.map((task) => {
              const text = drafts[task.id]?.text ?? '';
              const wc = countWords(text);
              const belowMin =
                typeof task.minWords === 'number' && wc < task.minWords;

              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setActiveTaskId(task.id)}
                  className={clsx(
                    'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-caption transition',
                    activeTaskId === task.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted',
                  )}
                >
                  <span className="font-semibold">{task.label}</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span className="text-[11px]">
                    {wc} words
                    {belowMin && typeof task.minWords === 'number'
                      ? ` / ${task.minWords}+`
                      : ''}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Two-pane exam layout */}
          <div className="grid gap-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
            {/* LEFT: PROMPT PANE */}
            <section className="flex flex-col rounded-ds-xl border border-border bg-card">
              <header className="border-b border-border px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {activeTask?.label}
                </p>
                {typeof activeTask?.recommendedMinutes === 'number' && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Recommended time:{' '}
                    <span className="font-medium">
                      {activeTask.recommendedMinutes} minutes
                    </span>
                  </p>
                )}
                {typeof minWords === 'number' && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Minimum words:{' '}
                    <span className="font-medium">{minWords} words</span>
                  </p>
                )}
              </header>

              <div className="scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted/70 flex-1 overflow-auto px-4 py-3 text-small leading-relaxed text-muted-foreground">
                {activeTask?.heading && (
                  <p className="mb-2 font-medium text-foreground">
                    {activeTask.heading}
                  </p>
                )}
                {activeTask?.body
                  ?.split('\n')
                  .filter(Boolean)
                  .map((line) => (
                    <p key={line} className="mb-2 last:mb-0">
                      {line}
                    </p>
                  ))}
              </div>
            </section>

            {/* RIGHT: ANSWER PANE */}
            <section className="flex min-h-[420px] flex-col rounded-ds-xl border border-border bg-card">
              <header className="border-b border-border px-4 pt-3">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Answer area
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Type your answer exactly as you would in the official exam. Do not
                      copy-paste from outside sources.
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-0.5 text-[11px] text-muted-foreground">
                    <span>
                      Current task:{' '}
                      <span
                        className={clsx(
                          'font-semibold',
                          belowMinWords
                            ? 'text-destructive'
                            : 'text-foreground',
                        )}
                      >
                        {wordCount}
                      </span>
                      {typeof minWords === 'number' && (
                        <span> / {minWords}+ recommended</span>
                      )}
                    </span>
                    {belowMinWords && (
                      <span className="rounded-full bg-destructive/10 px-2 py-[1px] text-[10px] text-destructive">
                        Below minimum word count
                      </span>
                    )}
                  </div>
                </div>
              </header>

              <div className="flex-1 px-4 py-3">
                <TextareaAutosize
                  minRows={12}
                  maxRows={18}
                  className="w-full resize-none rounded-ds-md border border-border bg-background px-3 py-2 text-small leading-relaxed shadow-sm"
                  value={activeText}
                  onChange={(e) =>
                    activeTask &&
                    handleChangeTaskText(activeTask.id, e.target.value)
                  }
                />
              </div>

              <footer className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>
                    Answers are auto-saved frequently while you type, similar to the real
                    computer-based test.
                  </span>
                </div>
                <span>
                  {examType} Writing • {activeTask?.label}
                </span>
              </footer>
            </section>
          </div>

          {/* SUBMIT ERRORS */}
          {submitError && (
            <Alert tone="destructive" className="text-caption">
              {submitError}
            </Alert>
          )}
        </div>
      </main>

      {/* EXAM FOOTER */}
      <footer className="border-t border-border bg-card/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="text-[11px] text-muted-foreground">
            Make sure you have answered <span className="font-semibold">both</span> tasks
            before finishing the test.
          </div>
          <div className="flex items-center gap-2">
            {isExpired && (
              <span className="text-[11px] text-muted-foreground">
                Time over. Finish to send your final answers.
              </span>
            )}
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting…' : 'Finish Writing test'}
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
};
