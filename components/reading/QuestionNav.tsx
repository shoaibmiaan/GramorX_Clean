import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { cn } from '@/lib/utils';

export type FilterStatus = 'all' | 'unanswered' | 'flagged';

type QuestionNavProps = {
  questions: { id: string }[];
  activeQuestionId: string | null;
  onJump: (id: string) => void;

  answeredMap: Record<string, boolean>;
  flaggedMap?: Record<string, boolean>;

  filterStatus: FilterStatus;
  onFilterStatusChange: (status: FilterStatus) => void;
};

const FILTERS: { id: FilterStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unanswered', label: 'Unanswered' },
  { id: 'flagged', label: 'Flagged' },
];

export const QuestionNav: React.FC<QuestionNavProps> = ({
  questions,
  activeQuestionId,
  onJump,
  answeredMap,
  flaggedMap = {},
  filterStatus,
  onFilterStatusChange,
}) => {
  const totalQuestions = Math.max(0, questions.length);
  const activeIndex = Math.max(
    0,
    questions.findIndex((q) => q.id === activeQuestionId),
  );
  const currentQuestionNumber = totalQuestions > 0 ? activeIndex + 1 : 0;

  const answeredCount = React.useMemo(
    () =>
      Array.from({ length: totalQuestions }).reduce((acc, _, i) => {
        const q = questions[i];
        if (!q) return acc;
        return answeredMap[q.id] ? acc + 1 : acc;
      }, 0),
    [answeredMap, questions, totalQuestions],
  );

  const flaggedCount = React.useMemo(
    () =>
      Array.from({ length: totalQuestions }).reduce((acc, _, i) => {
        const q = questions[i];
        if (!q) return acc;
        return flaggedMap[q.id] ? acc + 1 : acc;
      }, 0),
    [flaggedMap, questions, totalQuestions],
  );

  const isVisibleUnderFilter = (qId: string): boolean => {
    if (filterStatus === 'all') return true;
    const isAnswered = !!answeredMap[qId];
    const isFlagged = !!flaggedMap[qId];

    if (filterStatus === 'unanswered') return !isAnswered;
    if (filterStatus === 'flagged') return isFlagged;

    return true;
  };

  const handleClickQuestion = (idx: number) => {
    if (idx < 0 || idx >= totalQuestions) return;
    const q = questions[idx];
    if (!q) return;
    onJump(q.id);
  };

  return (
    <Card
      className={cn(
        'w-full border border-border/70 bg-card/95',
        'flex flex-col gap-2 px-4 py-3',
      )}
    >
      {/* Top row: Question X of Y + filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[12px] text-muted-foreground">
          {totalQuestions > 0 ? (
            <>
              Question{' '}
              <span className="font-semibold text-foreground">
                {currentQuestionNumber}
              </span>{' '}
              of {totalQuestions}
              <span className="ml-2 text-[11px]">
                • Answered {answeredCount}/{totalQuestions}
              </span>
              {flaggedCount > 0 ? (
                <span className="ml-2 text-[11px] text-amber-600 dark:text-amber-400">
                  • Flagged {flaggedCount}
                </span>
              ) : null}
            </>
          ) : (
            <span>No questions loaded</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {FILTERS.map((f) => (
            <Button
              key={f.id}
              type="button"
              size="xs"
              variant={filterStatus === f.id ? 'secondary' : 'ghost'}
              className={cn(
                'h-7 px-3 text-[11px] font-medium rounded-full',
                filterStatus === f.id &&
                  'bg-primary/10 text-primary dark:text-primary-foreground',
              )}
              onClick={() => onFilterStatusChange(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Bottom row: IELTS-style dots */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap gap-1.5">
          {Array.from({ length: totalQuestions }).map((_, idx) => {
            const q = questions[idx];
            if (!q) return null;
            if (!isVisibleUnderFilter(q.id)) return null;

            const qNum = idx + 1;
            const isCurrent = q.id === activeQuestionId;
            const isAnswered = !!answeredMap[q.id];
            const isFlagged = !!flaggedMap[q.id];

            return (
              <button
                key={qNum}
                type="button"
                title={`Question ${qNum}${
                  isFlagged ? ' (flagged)' : isAnswered ? ' (answered)' : ''
                }`}
                onClick={() => handleClickQuestion(idx)}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium',
                  'transition-colors focus:outline-none focus:ring-1 focus:ring-primary',
                  'border border-border/60 bg-muted text-muted-foreground',
                  isAnswered &&
                    'bg-emerald-500/20 border-emerald-500 text-emerald-700',
                  isFlagged &&
                    'bg-amber-500/20 border-amber-500 text-amber-700',
                  isCurrent &&
                    'bg-primary text-primary-foreground border-primary shadow-sm',
                )}
              >
                {qNum}
              </button>
            );
          })}
        </div>

        {/* Legend (IELTS-style) */}
        <div className="flex flex-col gap-1 text-[10px] text-muted-foreground md:flex-row md:items-center md:gap-3">
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full border border-border/70 bg-muted" />
            <span>Not answered</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-amber-500/80" />
            <span>Flagged</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-primary" />
            <span>Current</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default QuestionNav;
