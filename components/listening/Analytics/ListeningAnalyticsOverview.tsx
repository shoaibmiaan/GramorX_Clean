// components/listening/Analytics/ListeningAnalyticsOverview.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type Props = {
  bandCurrent: number | null;
  bandTarget: number | null;
  bandBest: number | null;
  attemptsCount: number;
  mockAttemptsCount: number;
  avgAccuracy: number | null; // 0–1
};

const ListeningAnalyticsOverview: React.FC<Props> = ({
  bandCurrent,
  bandTarget,
  bandBest,
  attemptsCount,
  mockAttemptsCount,
  avgAccuracy,
}) => {
  const accuracyPercent =
    avgAccuracy != null ? Math.round(avgAccuracy * 100) : null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border bg-card/60 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Current listening band
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
              {bandCurrent != null ? bandCurrent.toFixed(1) : '—'}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Based on your latest full attempts.
            </p>
          </div>
          <Icon name="Headphones" size={20} className="text-primary" />
        </div>
      </Card>

      <Card className="border-border bg-card/60 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Target vs best
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
              {(bandBest ?? 0).toFixed(1)}{' '}
              {bandTarget != null && (
                <span className="text-xs font-normal text-muted-foreground">
                  / target {bandTarget.toFixed(1)}
                </span>
              )}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              You need consistency, not one lucky attempt.
            </p>
          </div>
          <Icon name="Target" size={20} className="text-primary" />
        </div>
      </Card>

      <Card className="border-border bg-card/60 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Total attempts
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
              {attemptsCount}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {mockAttemptsCount} full mocks included.
            </p>
          </div>
          <Icon name="ClipboardList" size={20} className="text-primary" />
        </div>
      </Card>

      <Card className="border-border bg-card/60 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Average accuracy
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
              {accuracyPercent != null ? `${accuracyPercent}%` : '—'}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Focus on question types that drag this down.
            </p>
          </div>
          <Icon name="Activity" size={20} className="text-primary" />
        </div>
      </Card>
    </div>
  );
};

export default ListeningAnalyticsOverview;
