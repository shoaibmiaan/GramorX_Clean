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
  const total = questions.length;
  const currentIndex = questions.findIndex((q) => q.id === currentQuestionId);

  return (
    <div className="bg-slate-50 border-b px-4 py-3 space-y-3">
      <div className="flex items-center justify-between text-[11px] text-slate-600">
        <span className="font-semibold text-slate-800">
          Question {currentIndex + 1} of {total}
        </span>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span>Answered</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            <span>Review</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            <span>Current</span>
          </span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {questions.map((q) => {
          const isCurrent = q.id === currentQuestionId;
          const isFlagged = flags[q.id];
          const isAns = !!answers[q.id] && answers[q.id] !== null;

          return (
            <button
              type="button"
              key={q.id}
              onClick={() => onJump(q.id)}
              className={cn(
                'h-4 w-4 rounded-full border border-slate-200 transition focus:outline-none focus:ring-2 focus:ring-primary/50',
                isCurrent && 'bg-blue-500 border-blue-500 scale-110',
                !isCurrent && isFlagged && 'bg-amber-500 border-amber-500',
                !isCurrent && !isFlagged && isAns && 'bg-emerald-500 border-emerald-500',
                !isCurrent && !isFlagged && !isAns && 'bg-slate-200',
              )}
              aria-label={`Jump to question ${q.questionOrder}`}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-2 text-[11px] text-slate-600">
        <Button
          size="xs"
          variant={statusFilter === 'all' ? 'soft' : 'outline'}
          onClick={() => setStatusFilter('all')}
        >
          All
        </Button>
        <Button
          size="xs"
          variant={statusFilter === 'unanswered' ? 'soft' : 'outline'}
          onClick={() => setStatusFilter('unanswered')}
        >
          Unanswered
        </Button>
        <Button
          size="xs"
          variant={statusFilter === 'flagged' ? 'soft' : 'outline'}
          onClick={() => setStatusFilter('flagged')}
        >
          Marked
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-wide">Type</span>
          <Button
            size="xs"
            variant={typeFilter === 'all' ? 'soft' : 'outline'}
            onClick={() => setTypeFilter('all')}
          >
            All
          </Button>
          <Button
            size="xs"
            variant={typeFilter === 'mcq' ? 'soft' : 'outline'}
            onClick={() => setTypeFilter('mcq')}
          >
            MCQ
          </Button>
          <Button
            size="xs"
            variant={typeFilter === 'tfng' ? 'soft' : 'outline'}
            onClick={() => setTypeFilter('tfng')}
          >
            TFNG
          </Button>
          <Button
            size="xs"
            variant={typeFilter === 'yynn' ? 'soft' : 'outline'}
            onClick={() => setTypeFilter('yynn')}
          >
            Y/NG
          </Button>
          <Button
            size="xs"
            variant={typeFilter === 'gap' ? 'soft' : 'outline'}
            onClick={() => setTypeFilter('gap')}
          >
            Gap
          </Button>
          <Button
            size="xs"
            variant={typeFilter === 'match' ? 'soft' : 'outline'}
            onClick={() => setTypeFilter('match')}
          >
            Match
          </Button>
        </div>
      </div>
    </div>
  );
};
