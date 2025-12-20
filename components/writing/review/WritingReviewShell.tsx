// components/writing/review/WritingReviewShell.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';

import { WritingPromptPanel } from '@/components/writing/review/WritingPromptPanel';
import { WritingResponsePanel } from '@/components/writing/review/WritingResponsePanel';
import { WritingFeedbackPanel } from '@/components/writing/review/WritingFeedbackPanel';

type TaskLabel = 'Task 1' | 'Task 2';
type WritingCriteriaKey = 'TR' | 'CC' | 'LR' | 'GRA';

export type PromptTask = {
  taskNumber: 1 | 2;
  label: TaskLabel;
  prompt: string;
  minWords: number;
};

export type AnswerTask = {
  taskNumber: 1 | 2;
  label: TaskLabel;
  text: string;
  wordCount: number;
};

export type WritingEvaluation = {
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
  prompts: PromptTask[];
  answers: AnswerTask[];
  evaluation: WritingEvaluation | null;
};

export const WritingReviewShell: React.FC<Props> = ({ prompts, answers, evaluation }) => {
  const [active, setActive] = React.useState<1 | 2>(2);

  const prompt = prompts.find((p) => p.taskNumber === active) ?? prompts[0] ?? null;
  const answer = answers.find((a) => a.taskNumber === active) ?? answers[0] ?? null;

  const t1Words = answers.find((a) => a.taskNumber === 1)?.wordCount ?? 0;
  const t2Words = answers.find((a) => a.taskNumber === 2)?.wordCount ?? 0;

  return (
    <div className="space-y-4">
      <Card className="rounded-ds-2xl border border-border bg-card/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActive(1)}
              className={[
                'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition',
                active === 1
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted',
              ].join(' ')}
            >
              <span className="font-semibold">Task 1</span>
              <span className="text-[11px]">Words: {t1Words}</span>
            </button>

            <button
              type="button"
              onClick={() => setActive(2)}
              className={[
                'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition',
                active === 2
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-muted/60 text-muted-foreground hover:bg-muted',
              ].join(' ')}
            >
              <span className="font-semibold">Task 2</span>
              <Badge size="xs" variant="accent">
                Higher weight
              </Badge>
              <span className="text-[11px]">Words: {t2Words}</span>
            </button>
          </div>

          <div className="text-[11px] text-muted-foreground">
            Review mode: prompts + your answers (read-only).
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <WritingPromptPanel prompt={prompt?.prompt ?? ''} minWords={prompt?.minWords ?? 0} taskNumber={active} />
        <WritingResponsePanel text={answer?.text ?? ''} wordCount={answer?.wordCount ?? 0} taskNumber={active} />
      </div>

      <WritingFeedbackPanel
        activeTask={active}
        evaluation={evaluation}
        answers={answers}
        prompts={prompts}
      />
    </div>
  );
};

export default WritingReviewShell;
