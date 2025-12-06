import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { BandTrajectoryPoint } from '@/lib/analytics/mockTypes';

const formatDateLabel = (date: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(date));

export function BandProgressChart({ data }: { data: BandTrajectoryPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No attempts in this range yet.</p>;
  }

  const chartData = data.map((point) => ({
    label: formatDateLabel(point.date),
    band: point.bandScore,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="label" stroke="var(--chart-axis)" tickLine={false} />
          <YAxis domain={[0, 9]} stroke="var(--chart-axis)" tickLine={false} />
          <Tooltip
            contentStyle={{
              background: 'var(--chart-tooltip-bg)',
              borderRadius: 12,
              border: '1px solid var(--chart-tooltip-border)',
              color: 'var(--chart-tooltip-fg)',
            }}
          />
          <Line type="monotone" dataKey="band" stroke="var(--chart-writing)" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
