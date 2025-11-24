// components/listening/Game/GameChallengeHUD.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type Props = {
  elapsedSeconds: number;
  targetTimeSeconds: number;
  answeredCount: number;
  totalQuestions: number;
  streakDays: number;
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins <= 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

const GameChallengeHUD: React.FC<Props> = ({
  elapsedSeconds,
  targetTimeSeconds,
  answeredCount,
  totalQuestions,
  streakDays,
}) => {
  const remainingSeconds =
    targetTimeSeconds > 0 ? Math.max(targetTimeSeconds - elapsedSeconds, 0) : 0;

  const progress =
    totalQuestions > 0 ? Math.min(answeredCount / totalQuestions, 1) : 0;

  const progressPercent = Math.round(progress * 100);

  return (
    <Card className="mb-4 flex flex-col gap-3 border-border bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Icon name="Timer" size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Time
            </p>
            <p className="text-sm font-semibold text-foreground">
              {formatTime(elapsedSeconds)} elapsed · {formatTime(remainingSeconds)} left
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <Icon name="ListChecks" size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Progress
            </p>
            <p className="text-sm font-semibold text-foreground">
              {answeredCount}/{totalQuestions} ({progressPercent}%)
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-start gap-2 sm:items-end">
        <div className="w-full max-w-xs rounded-full bg-muted">
          <div
            className="h-1.5 rounded-full bg-primary transition-[width]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
            <Icon name="Flame" size={11} />
            <span>{streakDays} day{streakDays !== 1 ? 's' : ''} streak</span>
          </span>
          <span>Keep combo alive — don&apos;t rush, don&apos;t sleep.</span>
        </div>
      </div>
    </Card>
  );
};

export default GameChallengeHUD;
