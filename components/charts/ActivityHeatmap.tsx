import * as React from 'react';

type ActivityHeatmapCell = {
  label: string;        // e.g. "Mon", "Tue", "Test 1"
  intensity: number;    // 0–1 scale
};

type ActivityHeatmapProps = {
  title?: string;
  data?: ActivityHeatmapCell[];
};

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  title = 'Recent activity',
  data,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-elevated px-4 py-3 text-xs text-muted-foreground">
        No recent activity yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-elevated p-4">
      <div className="mb-3 text-sm font-medium text-foreground">{title}</div>
      <div className="grid grid-cols-7 gap-1 text-[10px] text-muted-foreground">
        {data.map((cell, idx) => {
          const level = Math.min(4, Math.max(0, Math.round(cell.intensity * 4)));
          const bg =
            level === 0
              ? 'bg-muted'
              : level === 1
              ? 'bg-emerald-900/40'
              : level === 2
              ? 'bg-emerald-800/70'
              : level === 3
              ? 'bg-emerald-700'
              : 'bg-emerald-600';

          return (
            <div
              key={idx}
              className={`flex aspect-square items-center justify-center rounded ${bg}`}
            >
              <span className="px-1 text-[9px] text-white/80">{cell.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityHeatmap;
