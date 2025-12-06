import * as React from 'react';

type ModuleStat = {
  module: string;   // e.g. "Listening", "Reading"
  band: number;     // e.g. 6.5
  attempts?: number;
};

type ModuleComparisonChartProps = {
  data?: ModuleStat[];
};

export const ModuleComparisonChart: React.FC<ModuleComparisonChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-elevated px-4 py-6 text-sm text-muted-foreground">
        No module comparison data yet.
      </div>
    );
  }

  // temporary placeholder – just render rows, real chart can come later
  return (
    <div className="rounded-lg border border-border bg-elevated px-4 py-6">
      <div className="mb-3 text-sm font-medium text-foreground">
        Module comparison (placeholder chart)
      </div>
      <div className="space-y-2 text-sm text-muted-foreground">
        {data.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between rounded-md bg-muted px-3 py-2"
          >
            <span>{item.module}</span>
            <div className="flex items-center gap-3">
              <span className="font-semibold">Band {item.band}</span>
              {item.attempts != null && (
                <span className="text-xs text-muted-foreground">
                  {item.attempts} attempts
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleComparisonChart;
