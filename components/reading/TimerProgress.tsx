import * as React from 'react';
import { ProgressBar } from '@/components/design-system/ProgressBar';

type TimerProgressProps = {
  /** Total questions (for display only) */
  total?: number;
  /** How many answered (optional – shell can wire later) */
  answered?: number;
  /** Total duration (seconds). Default 60 min. */
  durationSeconds?: number;
  /** Initial elapsed seconds if resuming from checkpoint */
  initialElapsedSec?: number;
};

const TimerProgress: React.FC<TimerProgressProps> = ({
  total = 40,
  answered,
  durationSeconds = 3600,
  initialElapsedSec = 0,
}) => {
  const [sec, setSec] = React.useState(initialElapsedSec);

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const clampedDuration = durationSeconds > 0 ? durationSeconds : 3600;
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  const pct = Math.min(100, Math.round((sec / clampedDuration) * 100));

  return (
    <div className="sticky top-0 z-10 mb-2">
      <ProgressBar value={pct} />
      <div className="mt-1 text-[11px] text-muted-foreground flex items-center justify-between">
        <span>
          Time: {mins}:{String(rem).padStart(2, '0')}
        </span>
        {answered != null && (
          <span>
            Answered: {answered}/{total}
          </span>
        )}
      </div>
    </div>
  );
};

export default TimerProgress;
