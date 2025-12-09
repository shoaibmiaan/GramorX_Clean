import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import { Icon } from '@/components/design-system/Icon';

export type SidebarMetric = {
  label: string;
  value: React.ReactNode;
};

export const SidebarMetrics: React.FC<{
  title?: string;
  metrics: SidebarMetric[];
  lastAttempt?: string | null;
}> = ({ title = 'Metrics', metrics, lastAttempt }) => {
  return (
    <Card className="p-4 rounded-ds-2xl bg-card/80 border border-border/60 shadow-sm text-xs space-y-2">
      <p className="text-[11px] uppercase font-semibold tracking-wide text-muted-foreground">
        {title}
      </p>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex justify-between text-xs">
            <span className="text-muted-foreground">{metric.label}</span>
            <span className="font-semibold">{metric.value}</span>
          </div>
        ))}
      </div>

      {lastAttempt && (
        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
          <Icon name="Clock" className="h-3.5 w-3.5" />
          <span>
            Last attempt: {new Date(lastAttempt).toLocaleDateString()}
          </span>
        </p>
      )}
    </Card>
  );
};
