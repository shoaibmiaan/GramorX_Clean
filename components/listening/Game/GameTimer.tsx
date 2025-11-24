// components/listening/Game/GameTimer.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type Props = {
  elapsedSeconds: number;
  targetTimeSeconds: number;
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins <= 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

const GameTimer: React.FC<Props> = ({ elapsedSeconds, targetTimeSeconds }) => {
  const remaining =
    targetTimeSeconds > 0 ? Math.max(targetTimeSeconds - elapsedSeconds, 0) : 0;

  return (
    <Card className="flex items-center justify-between gap-3 border-border bg-card/60 px-3 py-2 sm:px-4 sm:py-3">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
          <Icon name="Timer" size={14} className="text-primary" />
        </div>
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Time
          </p>
          <p className="text-xs font-semibold text-foreground sm:text-sm">
            {formatTime(elapsedSeconds)} elapsed · {formatTime(remaining)} left
          </p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Stay fast, but don&apos;t throw accuracy.
      </p>
    </Card>
  );
};

export default GameTimer;
