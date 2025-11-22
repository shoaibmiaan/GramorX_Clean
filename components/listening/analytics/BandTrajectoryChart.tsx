// components/listening/Analytics/BandTrajectoryChart.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type BandPoint = {
  attemptId: string;
  label: string; // e.g. "Mock #3" or date
  bandScore: number | null;
  mode: 'practice' | 'mock';
};

type Props = {
  points: BandPoint[];
};

const BandTrajectoryChart: React.FC<Props> = ({ points }) => {
  if (!points.length) {
    return (
      <Card className="border-border bg-card/60 p-4 text-xs text-muted-foreground sm:text-sm">
        No listening attempts yet. Do at least 2–3 attempts before worrying about your band graph.
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/60 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="LineChart" size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Band trajectory
          </h2>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Watch the trend, not each single score.
        </p>
      </div>

      <div className="space-y-2 text-xs text-muted-foreground sm:text-sm">
        {points.map((p, index) => (
          <div
            key={p.attemptId}
            className="flex items-center justify-between rounded-md border border-border/60 bg-background px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {points.length - index}
              </span>
              <div>
                <p className="text-xs font-medium text-foreground sm:text-sm">
                  {p.label}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {p.mode === 'mock' ? 'Full mock' : 'Practice / partial'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-foreground sm:text-sm">
                {p.bandScore != null ? `Band ${p.bandScore.toFixed(1)}` : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default BandTrajectoryChart;
