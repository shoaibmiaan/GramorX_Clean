// components/writing/result/ExaminerNotesCallout.tsx
import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Icon } from '@/components/design-system/Icon';

type Props = {
  task: 'task1' | 'task2';
  notes: string;
};

const pickTopLines = (notes: string, max = 5) =>
  notes
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, max);

export const ExaminerNotesCallout: React.FC<Props> = ({ task, notes }) => {
  const lines = pickTopLines(notes);
  if (!lines.length) return null;

  return (
    <Card className="rounded-ds-2xl border border-border/70 bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon name="ClipboardList" size={16} className="text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Examiner notes ({task})</p>
        </div>
        <Badge size="sm" variant="neutral">
          Quick traps
        </Badge>
      </div>

      <ul className="mt-3 space-y-2 text-sm text-foreground">
        {lines.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-border" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default ExaminerNotesCallout;
