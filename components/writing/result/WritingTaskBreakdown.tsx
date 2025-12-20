// components/writing/result/WritingTaskBreakdown.tsx
import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

type Props = {
  task1Band: string;
  task2Band: string;
  verdictTask1: string;
  verdictTask2: string;
};

export const WritingTaskBreakdown: React.FC<Props> = ({
  task1Band,
  task2Band,
  verdictTask1,
  verdictTask2,
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="rounded-ds-2xl border border-border bg-card/70 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Task 1
            </p>
            <p className="mt-1 text-2xl font-slab text-foreground">{task1Band}</p>
          </div>
          <Badge variant="neutral" size="sm">
            Lower weight
          </Badge>
        </div>

        <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
          <Icon name="ClipboardCheck" size={16} className="mt-0.5" />
          <p>{verdictTask1 || 'Verdict not provided.'}</p>
        </div>
      </Card>

      <Card className="rounded-ds-2xl border border-border bg-card/80 p-5 ring-1 ring-accent/40">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Task 2
            </p>
            <p className="mt-1 text-3xl font-slab text-foreground">{task2Band}</p>
          </div>
          <Badge variant="accent" size="sm">
            Higher weight
          </Badge>
        </div>

        <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
          <Icon name="Sparkles" size={16} className="mt-0.5" />
          <p>{verdictTask2 || 'Verdict not provided.'}</p>
        </div>

        <div className="mt-3 text-xs text-muted-foreground">
          Task 2 impacts your overall score more. Fix this first.
        </div>
      </Card>
    </div>
  );
};
