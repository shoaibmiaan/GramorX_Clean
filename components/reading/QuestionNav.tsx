import * as React from 'react';
import { Button } from '@/components/design-system/Button';
import { cn } from '@/lib/utils';

export const QuestionNav = ({
  questions,
  answers,
  flags,
  currentQuestionId,
  onJump,
  statusFilter,
  typeFilter,
  setStatusFilter,
  setTypeFilter,
}) => {
  return (
    <div className="bg-white border-b px-4 py-3 space-y-3">
      {/* Filters */}
      <div className="flex items-center gap-2 text-xs">
        <Button
          size="xs"
          variant={statusFilter === 'all' ? 'primary' : 'outline'}
          onClick={() => setStatusFilter('all')}
        >
          All
        </Button>
        <Button
          size="xs"
          variant={statusFilter === 'unanswered' ? 'primary' : 'outline'}
          onClick={() => setStatusFilter('unanswered')}
        >
          Unanswered
        </Button>
        <Button
          size="xs"
          variant={statusFilter === 'flagged' ? 'primary' : 'outline'}
          onClick={() => setStatusFilter('flagged')}
        >
          Flagged
        </Button>
      </div>

      {/* Dots */}
      <div className="flex gap-2 flex-wrap">
        {questions.map((q) => {
          const isCurrent = q.id === currentQuestionId;
          const isFlagged = flags[q.id];
          const isAns = !!answers[q.id] && answers[q.id] !== null;

          return (
            <div
              key={q.id}
              onClick={() => onJump(q.id)}
              className={cn(
                'w-3 h-3 rounded-full cursor-pointer transition',
                isCurrent && 'bg-primary scale-125',
                !isCurrent && isFlagged && 'bg-warning',
                !isCurrent && !isFlagged && isAns && 'bg-success',
                !isCurrent && !isFlagged && !isAns && 'bg-muted',
              )}
            />
          );
        })}
      </div>
    </div>
  );
};
