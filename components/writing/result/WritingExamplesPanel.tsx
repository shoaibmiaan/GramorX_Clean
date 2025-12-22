// components/writing/result/WritingExamplesPanel.tsx
import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import type { BandScore } from '@/lib/writing/types';

type Props = {
  band: BandScore;
  task: 'task1' | 'task2';
  content: string;
};

const parseLines = (md: string) =>
  md
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

export const WritingExamplesPanel: React.FC<Props> = ({ band, task, content }) => {
  if (!content) return null;
  const lines = parseLines(content);
  if (!lines.length) return null;

  return (
    <Card className="rounded-ds-2xl border border-border/60 bg-card/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Examples • {task === 'task2' ? 'Task 2' : 'Task 1'}
          </p>
          <p className="text-base font-semibold text-foreground">Band-focused snippets</p>
        </div>
        <Badge variant="accent" size="sm">
          Target {band.toFixed(1)}
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

export default WritingExamplesPanel;
