// components/listening/Practice/PracticeResultSummary.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

type Props = {
  bandScore: number;
  rawScore: number;
  maxScore: number;
  totalQuestions: number;
  accuracy: number; // 0–1
  timeSpentSeconds: number;
};

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins <= 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

const PracticeResultSummary: React.FC<Props> = ({
  bandScore,
  rawScore,
  maxScore,
  totalQuestions,
  accuracy,
  timeSpentSeconds,
}) => {
  const accuracyPercent = Math.round(accuracy * 100);

  return (
    <div className="space-y-4">
      <Card className="flex flex-col gap-3 border-border bg-card/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Practice result
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
            Band {bandScore.toFixed(1)}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            This is an estimate based on your raw score. Use it to track trends,
            not to panic on one attempt.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" className="flex items-center gap-1">
            <Icon name="Sparkles" size={14} />
            <span>Listening grind completed</span>
          </Badge>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border bg-card/60 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Raw score
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {rawScore}/{maxScore}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {totalQuestions} questions attempted
              </p>
            </div>
            <Icon name="ClipboardCheck" size={20} className="text-primary" />
          </div>
        </Card>

        <Card className="border-border bg-card/60 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Accuracy
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {accuracyPercent}%
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Focus on the question types you miss repeatedly.
              </p>
            </div>
            <Icon name="Target" size={20} className="text-primary" />
          </div>
        </Card>

        <Card className="border-border bg-card/60 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Time spent
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {formatTime(timeSpentSeconds)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Practise speed, but never at the cost of accuracy.
              </p>
            </div>
            <Icon name="Clock" size={20} className="text-primary" />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PracticeResultSummary;
