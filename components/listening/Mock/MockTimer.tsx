// components/listening/Mock/MockTimer.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type Props = {
  timeLeftSeconds: number;
  totalSeconds: number;
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins <= 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

const MockTimer: React.FC<Props> = ({ timeLeftSeconds, totalSeconds }) => {
  const used = totalSeconds - timeLeftSeconds;
  const lowTime = timeLeftSeconds <= 60 * 5; // last 5 minutes

  return (
    <Card className="flex items-center justify-between gap-3 border-border bg-card/80 px-3 py-2 sm:px-4 sm:py-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
          <Icon name="Timer" size={14} className="text-primary" />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Exam timer
          </p>
          <p
            className={[
              'text-xs font-semibold sm:text-sm',
              lowTime ? 'text-danger' : 'text-foreground',
            ].join(' ')}
          >
            {formatTime(timeLeftSeconds)} left · {formatTime(used)} used
          </p>
        </div>
      </div>
      {lowTime && (
        <p className="text-[11px] font-medium text-danger">
          Last 5 minutes. In the real test, you can&apos;t extend this.
        </p>
      )}
    </Card>
  );
};

export default MockTimer;
