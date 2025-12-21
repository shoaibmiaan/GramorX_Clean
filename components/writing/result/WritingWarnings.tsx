// components/writing/result/WritingWarnings.tsx
import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';
import type { WarningItem, WritingAnswer } from '@/lib/writing/types';

type Props = {
  warnings: WarningItem[];
  answers: WritingAnswer[];
};

export const WritingWarnings: React.FC<Props> = ({ warnings, answers }) => {
  const task1 = answers.find((a) => a.taskNumber === 1);
  const task2 = answers.find((a) => a.taskNumber === 2);

  const autoWarnings: WarningItem[] = [];

  if (task1 && task1.wordCount > 0 && task1.wordCount < 150) {
    autoWarnings.push({
      type: 'task1_under_length',
      message: 'Task 1 is under 150 words (word count penalty risk).',
      taskNumber: 1,
      severity: 'medium',
    });
  }
  if (task2 && task2.wordCount > 0 && task2.wordCount < 250) {
    autoWarnings.push({
      type: 'task2_under_length',
      message: 'Task 2 is under 250 words (word count penalty risk).',
      taskNumber: 2,
      severity: 'high',
    });
  }

  const normalize = (item: WarningItem): WarningItem => {
    if (typeof item === 'string') {
      return { type: item, message: item };
    }
    return { ...item, message: item.message || String(item.type) };
  };

  const all = [...autoWarnings, ...(warnings ?? [])]
    .filter((x) => Boolean(x))
    .map(normalize)
    .filter((x) => x.message.trim().length > 0);

  if (!all.length) return null;

  return (
    <Card className="rounded-ds-2xl border border-accent/40 bg-accent/10 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-card">
            <Icon name="AlertCircle" size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Warnings</p>
            <p className="text-xs text-muted-foreground">
              These issues can drag your band down fast.
            </p>
          </div>
        </div>
        <Badge variant="accent" size="sm">
          Fix first
        </Badge>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-foreground">
        {all.slice(0, 6).map((w) => (
          <li key={`${w.type}-${w.message}`} className="flex items-start gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-foreground/60" />
            <span>
              {w.taskNumber ? (
                <Badge size="xs" variant={w.taskNumber === 2 ? 'accent' : 'neutral'} className="mr-2">
                  Task {w.taskNumber}
                </Badge>
              ) : null}
              {w.message}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
};
