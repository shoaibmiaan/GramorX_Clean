// components/writing/WritingTimer.tsx
// Countdown indicator for the writing exam room.

import React from 'react';
import clsx from 'clsx';

export type WritingTimerProps = {
  seconds: number;
  totalSeconds: number;
};

const formatTime = (total: number) => {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const WritingTimer: React.FC<WritingTimerProps> = ({ seconds, totalSeconds }) => {
  const percent = Math.max(0, Math.min(1, seconds / totalSeconds));
  const variant = percent <= 0.1 ? 'critical' : percent <= 0.25 ? 'warning' : 'default';
  return (
    <div
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-small transition-colors',
        variant === 'default' && 'border-border text-muted-foreground',
        variant === 'warning' && 'border-warning bg-warning/10 text-warning',
        variant === 'critical' && 'border-danger bg-danger/10 text-danger',
      )}
      aria-live="polite"
    >
      <span className="font-semibold tracking-wider">{formatTime(seconds)}</span>
      <span className="hidden text-caption uppercase sm:inline">remaining</span>
    </div>
  );
};

export default WritingTimer;
