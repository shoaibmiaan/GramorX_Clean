// components/writing/result/WritingImprovementsTable.tsx
import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import type { ImprovementRow } from '@/lib/writing/types';

type Props = {
  rows: ImprovementRow[];
};

export const WritingImprovementsTable: React.FC<Props> = ({ rows }) => {
  if (!rows.length) return null;

  return (
    <Card className="rounded-ds-2xl border border-border/70 bg-card/70 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sentence fixes</p>
          <p className="text-base font-semibold text-foreground">Before → After (max 5)</p>
        </div>
        <Badge variant="neutral" size="sm">
          Focused edits
        </Badge>
      </div>

      <div className="mt-4 space-y-3">
        {rows.slice(0, 5).map((row, idx) => (
          <div
            key={`${idx}-${row.before.slice(0, 12)}`}
            className="rounded-ds-xl border border-border bg-muted/30 px-3 py-2"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge size="xs" variant={row.taskNumber === 2 ? 'accent' : 'neutral'}>
                Task {row.taskNumber}
              </Badge>
              {row.criteria ? <Badge size="xs" variant="neutral">{row.criteria}</Badge> : null}
            </div>
            <div className="mt-1 grid gap-2 md:grid-cols-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Before</p>
                <p className="text-sm text-foreground">{row.before}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">After</p>
                <p className="text-sm text-foreground">{row.after}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default WritingImprovementsTable;
