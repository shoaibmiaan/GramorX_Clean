// components/listening/Analytics/TimeManagementChart.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type TimeRow = {
  attemptId: string;
  label: string; // e.g. "Mock #2" or date
  timeSpentSeconds: number;
  targetSeconds: number;
};

type Props = {
  rows: TimeRow[];
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins <= 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

const TimeManagementChart: React.FC<Props> = ({ rows }) => {
  if (!rows.length) {
    return (
      <Card className="border-border bg-card/60 p-4 text-xs text-muted-foreground sm:text-sm">
        No time data yet. Once you complete a few listening tests, we&apos;ll show how your timing
        behaves.
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/60 p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon name="Clock" size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Time management
          </h2>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Real exam timing is fixed. You adapt or you lose marks.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs text-muted-foreground sm:text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide">
              <th className="px-4 py-2 font-medium">Attempt</th>
              <th className="px-4 py-2 font-medium">Time used</th>
              <th className="px-4 py-2 font-medium">Target time</th>
              <th className="px-4 py-2 font-medium">Gap</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const gap = row.timeSpentSeconds - row.targetSeconds;
              const gapLabel = `${gap > 0 ? '+' : ''}${formatTime(Math.abs(gap))}`;
              const isOver = gap > 0;

              return (
                <tr
                  key={row.attemptId}
                  className="border-b border-border/60 last:border-b-0"
                >
                  <td className="px-4 py-2 align-middle text-xs font-medium text-foreground sm:text-sm">
                    {row.label}
                  </td>
                  <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                    {formatTime(row.timeSpentSeconds)}
                  </td>
                  <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                    {formatTime(row.targetSeconds)}
                  </td>
                  <td className="px-4 py-2 align-middle">
                    <span
                      className={[
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        isOver
                          ? 'bg-danger/10 text-danger'
                          : 'bg-success/10 text-success',
                      ].join(' ')}
                    >
                      <Icon
                        name={isOver ? 'AlertTriangle' : 'CheckCircle'}
                        size={11}
                      />
                      <span>{gapLabel}</span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default TimeManagementChart;
