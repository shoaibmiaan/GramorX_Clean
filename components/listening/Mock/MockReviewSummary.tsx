// components/listening/Mock/MockReviewSummary.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type Props = {
  bandScore: number;
  rawScore: number;
  maxScore: number;
  totalQuestions: number;
  accuracy: number; // 0–1
  timeSpentSeconds: number;
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins <= 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

const MockReviewSummary: React.FC<Props> = ({
  bandScore,
  rawScore,
  maxScore,
  totalQuestions,
  accuracy,
  timeSpentSeconds,
}) => {
  const accuracyPercent = Math.round(accuracy * 100);

  return (
    <Card className="border-border bg-card/60 p-4 sm:p-5">
      <div className="grid gap-4 md:grid-cols-4">
        {/* Band */}
        <div className="flex items-start gap-3 md:col-span-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Icon name="Headphones" size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Estimated Listening band
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
              {bandScore.toFixed(1)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              One mock isn&apos;t destiny. Watch how this moves over multiple mocks.
            </p>
          </div>
        </div>

        {/* Raw score */}
        <div className="flex flex-col justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Raw score
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {rawScore}/{maxScore}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {totalQuestions} questions. Every 1 mark is expensive; treat each mistake like a bug in
            your system.
          </p>
        </div>

        {/* Accuracy */}
        <div className="flex flex-col justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Accuracy
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {accuracyPercent}%
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Under ~80% you&apos;re leaking too many marks. Find which question types are killing
            this number.
          </p>
        </div>

        {/* Time */}
        <div className="flex flex-col justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Time used
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {formatTime(timeSpentSeconds)}
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            If you panicked and rushed the last section, that&apos;s a timing system problem, not
            an intelligence problem.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default MockReviewSummary;
