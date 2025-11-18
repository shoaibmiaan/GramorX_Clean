import * as React from 'react';

import { cn } from '@/lib/utils';

export type TimerBarProps = {
  totalSeconds: number;
  remainingSeconds: number;
  className?: string;
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const TimerBar: React.FC<TimerBarProps> = ({ totalSeconds, remainingSeconds, className }) => {
  const safeTotal = Math.max(totalSeconds, 1);
  const ratio = Math.min(1, Math.max(0, remainingSeconds / safeTotal));

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Time remaining</span>
        <span className="font-mono text-sm text-foreground">{formatTime(Math.max(0, remainingSeconds))}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
};

export default TimerBar;
