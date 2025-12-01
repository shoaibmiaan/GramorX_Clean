// components/reading/history/ReadingHistoryTable.tsx
import * as React from 'react';
import Link from 'next/link';

import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import { cn } from '@/lib/utils';

export type ReadingHistoryRow = {
  attemptId: string;
  testSlug: string;
  testTitle: string;
  bandScore: number | null;
  rawScore: number | null;
  totalQuestions: number | null;
  createdAt: string;
};

type Props = {
  rows: ReadingHistoryRow[];
  className?: string;
};

export const ReadingHistoryTable: React.FC<Props> = ({ rows, className }) => {
  if (!rows.length) {
    return (
      <Card className={cn('p-6 text-center text-sm text-muted-foreground', className)}>
        No reading attempts yet. Start a strict mock and your history will appear here.
      </Card>
    );
  }

  return (
    <Card className={cn('p-0 overflow-hidden', className)}>
      <div className="min-w-full divide-y divide-border text-xs">
        <div className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)] gap-3 bg-surface-subtle px-4 py-3 font-medium text-muted-foreground uppercase tracking-[0.14em]">
          <div>Test</div>
          <div>Band</div>
          <div>Score</div>
          <div className="text-right">Actions</div>
        </div>
        {rows.map((row) => {
          const total = row.totalQuestions ?? 40;
          const raw = row.rawScore ?? 0;
          const band = row.bandScore ?? null;
          const accuracy = total > 0 ? Math.round((raw / total) * 100) : 0;

          let bandTone: 'good' | 'ok' | 'low' = 'ok';
          if (band != null) {
            if (band >= 7) bandTone = 'good';
            else if (band < 6) bandTone = 'low';
          }

          const bandBadgeClass =
            bandTone === 'good'
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/40'
              : bandTone === 'low'
              ? 'bg-destructive/10 text-destructive border-destructive/40'
              : 'bg-amber-500/10 text-amber-700 border-amber-500/40';

          return (
            <div
              key={row.attemptId}
              className="grid grid-cols-[minmax(0,2.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)_minmax(0,1fr)] gap-3 px-4 py-3 items-center border-t border-border/60"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {row.testTitle}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span>
                    Attempted on {new Date(row.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Badge
                  variant="outline"
                  className={cn('w-fit px-2 py-0.5 text-[11px]', bandBadgeClass)}
                >
                  {band != null ? `Band ${band.toFixed(1)}` : 'Band —'}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  Accuracy {accuracy}%{' '}
                </span>
              </div>

              <div className="flex flex-col text-[11px] text-muted-foreground">
                <span>
                  {raw}/{total} correct
                </span>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button asChild size="xs" variant="outline">
                  <Link href={`/mock/reading/result/${row.attemptId}`}>
                    <Icon name="file-text" className="h-3.5 w-3.5 mr-1" />
                    Result
                  </Link>
                </Button>
                <Button asChild size="xs" variant="ghost">
                  <Link href={`/mock/reading/review/${row.attemptId}`}>
                    <Icon name="eye" className="h-3.5 w-3.5 mr-1" />
                    Review
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default ReadingHistoryTable;
