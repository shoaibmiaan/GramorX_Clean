import * as React from 'react';

type BandProgressPoint = {
  label: string; // e.g. "Test 1", "Test 2"
  band: number;  // e.g. 5.5, 6, 7
};

type BandProgressChartProps = {
  data?: BandProgressPoint[];
};

export const BandProgressChart: React.FC<BandProgressChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-elevated px-4 py-6 text-sm text-muted-foreground">
        No band progress data yet.
      </div>
    );
  }

  // temporary placeholder – just list points so UI doesn’t break
  return (
    <div className="rounded-lg border border-border bg-elevated px-4 py-6">
      <div className="mb-3 text-sm font-medium text-foreground">
        Band score trend (placeholder chart)
      </div>
      <ul className="space-y-1 text-sm text-muted-foreground">
        {data.map((point, idx) => (
          <li key={idx} className="flex items-center justify-between">
            <span>{point.label}</span>
            <span className="font-semibold">Band {point.band}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BandProgressChart;
