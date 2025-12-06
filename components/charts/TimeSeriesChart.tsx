import * as React from 'react';

type TimePoint = {
  label: string;   // e.g. "Test 1", "Test 2", date, etc.
  value: number;   // e.g. attempts, avg band, etc.
};

type TimeSeriesChartProps = {
  title?: string;
  metricLabel?: string;
  data?: TimePoint[];
};

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
  title = 'Activity over time',
  metricLabel = 'Value',
  data,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-elevated px-4 py-6 text-sm text-muted-foreground">
        No time-series data available yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-elevated px-4 py-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{metricLabel}</div>
      </div>

      <ul className="space-y-1 text-sm text-muted-foreground">
        {data.map((point, idx) => (
          <li
            key={idx}
            className="flex items-center justify-between rounded-md bg-muted px-3 py-2"
          >
            <span>{point.label}</span>
            <span className="font-semibold">{point.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TimeSeriesChart;
