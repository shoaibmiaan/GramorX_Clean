// components/writing/result/WritingResultSummary.tsx
import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

type Props = {
  overallBandLabel: string; // already formatted
  submittedAt: string | null;
  status: string;
  hasEvaluation: boolean;
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
};

export const WritingResultSummary: React.FC<Props> = ({
  overallBandLabel,
  submittedAt,
  status,
  hasEvaluation,
}) => {
  return (
    <Card className="rounded-ds-2xl border border-border bg-card/70 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={hasEvaluation ? 'success' : 'neutral'} size="sm">
              {hasEvaluation ? 'Evaluated' : 'Pending'}
            </Badge>
            <Badge variant="neutral" size="sm">
              Status: {status || '—'}
            </Badge>
            {submittedAt ? (
              <Badge variant="neutral" size="sm">
                Submitted: {formatDateTime(submittedAt)}
              </Badge>
            ) : null}
          </div>

          <p className="text-caption font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Training band
          </p>
          <p className="text-display font-slab leading-none text-foreground">
            {overallBandLabel}
          </p>
          <p className="text-caption text-muted-foreground">
            Slightly stricter than IELTS. Real exam is typically within ±0.5.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-ds-xl border border-border bg-muted/40 px-4 py-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-card">
            <Icon name="Target" size={18} />
          </span>
          <div>
            <p className="text-small font-semibold text-foreground">Read this like an examiner</p>
            <p className="text-caption text-muted-foreground">
              Fix the biggest losses first. Task 2 matters more.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
