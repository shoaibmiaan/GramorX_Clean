import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { ModulePerformanceSummary } from '@/lib/analytics/mockTypes';

const moduleLabel: Record<string, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
};

export function ModuleComparisonChart({ data }: { data: ModulePerformanceSummary[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No attempts to compare yet.</p>;
  }

  const chartData = data.map((module) => ({
    name: moduleLabel[module.module] ?? module.module,
    avgBand: module.avgBand ?? 0,
    attempts: module.attempts,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis dataKey="name" stroke="var(--chart-axis)" tickLine={false} />
          <YAxis domain={[0, 9]} stroke="var(--chart-axis)" tickLine={false} />
          <Tooltip
            formatter={(value: number, _name, props) => [value.toFixed(1), `${props.payload.attempts} attempts`]}
            contentStyle={{
              background: 'var(--chart-tooltip-bg)',
              borderRadius: 12,
              border: '1px solid var(--chart-tooltip-border)',
              color: 'var(--chart-tooltip-fg)',
            }}
          />
          <Bar dataKey="avgBand" fill="var(--chart-reading)" radius={[12, 12, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
