// components/listening/Mock/MockOverviewStats.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type Props = {
  lastBandScore: number | null;
  bestBandScore: number | null;
  totalMockAttempts: number;
  upcomingExamDate?: string | null;
};

const MockOverviewStats: React.FC<Props> = ({
  lastBandScore,
  bestBandScore,
  totalMockAttempts,
  upcomingExamDate,
}) => {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Card className="border-border bg-card/60 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Last mock band
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
              {lastBandScore != null ? lastBandScore.toFixed(1) : '—'}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Use every mock to test your exam habits, not your ego.
            </p>
          </div>
          <Icon name="Activity" size={20} className="text-primary" />
        </div>
      </Card>

      <Card className="border-border bg-card/60 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Best mock band
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
              {bestBandScore != null ? bestBandScore.toFixed(1) : '—'}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Stable scores matter more than one lucky spike.
            </p>
          </div>
          <Icon name="Star" size={20} className="text-primary" />
        </div>
      </Card>

      <Card className="border-border bg-card/60 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Mock attempts
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
              {totalMockAttempts}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Aim for at least 4–6 full mocks before your exam.
            </p>
          </div>
          <Icon name="ClipboardList" size={20} className="text-primary" />
        </div>
      </Card>

      {upcomingExamDate && (
        <Card className="sm:col-span-3 border-border bg-muted/40 px-3 py-2 sm:px-4 sm:py-3">
          <p className="flex items-center gap-2 text-[11px] text-muted-foreground sm:text-xs">
            <Icon name="Calendar" size={14} className="text-primary" />
            <span>
              Upcoming exam date:&nbsp;
              <span className="font-medium text-foreground">{upcomingExamDate}</span>. Use these mocks
              to simulate the exact pressure you&apos;ll feel that day.
            </span>
          </p>
        </Card>
      )}
    </div>
  );
};

export default MockOverviewStats;
