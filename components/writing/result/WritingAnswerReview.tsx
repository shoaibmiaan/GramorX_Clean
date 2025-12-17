// components/writing/result/WritingAnswerReview.tsx
import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

type TaskLabel = 'Task 1' | 'Task 2';

export type WritingAnswer = {
  taskNumber: 1 | 2;
  label: TaskLabel;
  text: string;
  wordCount: number;
};

type Props = {
  answers: WritingAnswer[];
};

const minWordsForTask = (taskNumber: 1 | 2) => (taskNumber === 2 ? 250 : 150);

const isUnderMin = (taskNumber: 1 | 2, wc: number) => wc > 0 && wc < minWordsForTask(taskNumber);

export const WritingAnswerReview: React.FC<Props> = ({ answers }) => {
  const t1 = answers.find((a) => a.taskNumber === 1);
  const t2 = answers.find((a) => a.taskNumber === 2);

  const items = [t1, t2].filter(Boolean) as WritingAnswer[];

  if (!items.length) return null;

  return (
    <Card className="rounded-ds-2xl border border-border bg-card/70 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <Icon name="FileText" size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">Your answers</p>
          <p className="text-xs text-muted-foreground">
            Read-only review. Task 2 matters more — check it first.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {items.map((a) => {
          const under = isUnderMin(a.taskNumber, a.wordCount);
          const taskIs2 = a.taskNumber === 2;

          return (
            <details
              key={a.taskNumber}
              className={[
                'rounded-ds-xl border bg-card/80 p-4',
                taskIs2 ? 'border-accent/40 ring-1 ring-accent/30' : 'border-border',
              ].join(' ')}
              open={a.taskNumber === 2}
            >
              <summary className="cursor-pointer list-none">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{a.label}</span>
                      {taskIs2 ? (
                        <Badge variant="accent" size="sm">
                          Higher weight
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Lower weight
                        </Badge>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground">
                      Word count:{' '}
                      <span className={under ? 'font-semibold text-destructive' : 'font-semibold text-foreground'}>
                        {a.wordCount}
                      </span>{' '}
                      / min {minWordsForTask(a.taskNumber)}
                      {under ? <span className="ml-2 text-destructive">• Under-length risk</span> : null}
                    </div>
                  </div>

                  <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Icon name="ChevronDown" size={16} />
                  </span>
                </div>
              </summary>

              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {a.text?.trim() ? a.text : (
                  <span className="text-muted-foreground">No answer saved.</span>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </Card>
  );
};

export default WritingAnswerReview;
