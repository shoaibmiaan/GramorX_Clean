// components/writing/review/WritingFeedbackPanel.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

type WritingCriteriaKey = 'TR' | 'CC' | 'LR' | 'GRA';
type TaskLabel = 'Task 1' | 'Task 2';

type PromptTask = {
  taskNumber: 1 | 2;
  label: TaskLabel;
  prompt: string;
  minWords: number;
};

type AnswerTask = {
  taskNumber: 1 | 2;
  label: TaskLabel;
  text: string;
  wordCount: number;
};

type WritingEvaluation = {
  overallBand: number;
  task1Band: number;
  task2Band: number;
  criteria: Record<WritingCriteriaKey, number>;
  criteriaNotes: Partial<Record<WritingCriteriaKey, string[]>>;
  shortVerdictTask1?: string;
  shortVerdictTask2?: string;
  taskNotes?: Partial<Record<'task1' | 'task2', string[]>>;
  warnings?: string[];
  nextSteps?: string[];
};

type Props = {
  activeTask: 1 | 2;
  evaluation: WritingEvaluation | null;
  answers: AnswerTask[];
  prompts: PromptTask[];
};

const bandFmt = (n: number | null | undefined) => {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  const fixed = Math.round(n * 2) / 2;
  return fixed % 1 === 0 ? `${fixed.toFixed(0)}.0` : `${fixed.toFixed(1)}`;
};

export const WritingFeedbackPanel: React.FC<Props> = ({ activeTask, evaluation, answers, prompts }) => {
  if (!evaluation) {
    return (
      <Card className="rounded-ds-2xl border border-border bg-card/70 p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted">
            <Icon name="LoaderCircle" size={18} />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Evaluation pending</p>
            <p className="text-sm text-muted-foreground">
              This review page won’t rerun AI. It will show feedback once stored.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const taskBand = activeTask === 2 ? evaluation.task2Band : evaluation.task1Band;
  const taskVerdict = activeTask === 2 ? evaluation.shortVerdictTask2 : evaluation.shortVerdictTask1;

  const taskNotesKey = activeTask === 2 ? 'task2' : 'task1';
  const taskNotes = evaluation.taskNotes?.[taskNotesKey] ?? [];

  const ans = answers.find((a) => a.taskNumber === activeTask);
  const pr = prompts.find((p) => p.taskNumber === activeTask);

  const wc = ans?.wordCount ?? 0;
  const min = pr?.minWords ?? (activeTask === 2 ? 250 : 150);
  const underMin = wc > 0 && wc < min;

  const warnings = [...(underMin ? [`Task ${activeTask} is under minimum word count (${min}).`] : []), ...(evaluation.warnings ?? [])]
    .filter((x) => x && x.trim().length > 0)
    .slice(0, 6);

  const criteriaOrder: WritingCriteriaKey[] = ['TR', 'CC', 'LR', 'GRA'];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <Card className="rounded-ds-2xl border border-border bg-card/70 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Feedback • Task {activeTask}
            </p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              Task band: {bandFmt(taskBand)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {taskVerdict?.trim() ? taskVerdict : 'No task verdict provided.'}
            </p>
          </div>

          <Badge size="sm" variant={activeTask === 2 ? 'accent' : 'neutral'}>
            {activeTask === 2 ? 'Higher weight' : 'Lower weight'}
          </Badge>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {criteriaOrder.map((k) => {
            const band = evaluation.criteria[k];
            const notes = (evaluation.criteriaNotes?.[k] ?? []).slice(0, 3);

            return (
              <div key={k} className="rounded-ds-xl border border-border bg-muted/40 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      {k}
                    </p>
                    <p className="text-sm font-semibold text-foreground">Band {bandFmt(band)}</p>
                  </div>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-card">
                    <Icon name="ClipboardCheck" size={16} />
                  </span>
                </div>

                <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                  {(notes.length ? notes : ['No notes provided.']).map((n) => (
                    <li key={n} className="flex items-start gap-2">
                      <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-border" />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {taskNotes.length ? (
          <div className="mt-4 rounded-ds-xl border border-border bg-muted/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Task-specific notes
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {taskNotes.slice(0, 4).map((n) => (
                <li key={n} className="flex items-start gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-border" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      <div className="space-y-4">
        {warnings.length ? (
          <Card className="rounded-ds-2xl border border-accent/40 bg-accent/10 p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-card">
                <Icon name="AlertCircle" size={18} />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Warnings</p>
                <p className="text-xs text-muted-foreground">Fix these first.</p>
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-foreground">
              {warnings.map((w) => (
                <li key={w} className="flex items-start gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-foreground/60" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <Card className="rounded-ds-2xl border border-border bg-card/70 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <Icon name="ListChecks" size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Next steps</p>
              <p className="text-xs text-muted-foreground">Max 4. Keep it brutal and actionable.</p>
            </div>
          </div>

          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {(evaluation.nextSteps?.length ? evaluation.nextSteps : ['No next steps provided.'])
              .slice(0, 4)
              .map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-border" />
                  <span>{s}</span>
                </li>
              ))}
          </ul>
        </Card>
      </div>
    </div>
  );
};
