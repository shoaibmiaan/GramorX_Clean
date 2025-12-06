import * as React from 'react';

import { cn } from '@/lib/utils';

const formatTime = (totalSeconds: number) => {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (clamped % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export type ExamTimerProps = {
  durationSeconds: number;
  isRunning?: boolean;
  onExpire?: () => void;
  onTick?: (remainingSeconds: number) => void;
  className?: string;
};

export const ExamTimer: React.FC<ExamTimerProps> = ({
  durationSeconds,
  isRunning = true,
  onExpire,
  onTick,
  className,
}) => {
  const [remaining, setRemaining] = React.useState(durationSeconds);
  const hasExpired = remaining <= 0;

  React.useEffect(() => {
    setRemaining(durationSeconds);
  }, [durationSeconds]);

  React.useEffect(() => {
    if (!isRunning || hasExpired) return;

    const timer = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning, hasExpired]);

  React.useEffect(() => {
    if (onTick) {
      onTick(remaining);
    }
  }, [onTick, remaining]);

  React.useEffect(() => {
    if (hasExpired && onExpire) {
      onExpire();
    }
  }, [hasExpired, onExpire]);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-border/70',
        hasExpired ? 'text-destructive' : 'text-foreground',
        className
      )}
      aria-live="polite"
      aria-label={`Time remaining: ${formatTime(remaining)}`}
    >
      <span className={cn('h-2 w-2 rounded-full', hasExpired ? 'bg-destructive' : 'bg-success')} aria-hidden />
      <span className={hasExpired ? 'animate-pulse' : undefined}>{formatTime(remaining)}</span>
    </div>
  );
};

export default ExamTimer;
