// components/exam/ExamFooter.tsx
import * as React from 'react';

import { Button } from '@/components/design-system/Button';
import { cn } from '@/lib/utils';

export type ExamFooterProps = {
  currentQuestion: number;
  totalQuestions: number;
  /** Primary action – usually "Submit attempt" */
  primaryLabel: string;
  onPrimaryClick?: () => void;
  primaryDisabled?: boolean;
  /** Optional secondary – e.g. "Previous question" */
  secondaryLabel?: string;
  onSecondaryClick?: () => void;
  className?: string;
};

export const ExamFooter: React.FC<ExamFooterProps> = ({
  currentQuestion,
  totalQuestions,
  primaryLabel,
  onPrimaryClick,
  primaryDisabled,
  secondaryLabel,
  onSecondaryClick,
  className,
}) => {
  return (
    <footer
      className={cn(
        'w-full border-t border-border/60 bg-background/95',
        'backdrop-blur supports-[backdrop-filter]:bg-background/80',
        'shadow-[0_-1px_0_0_rgba(15,23,42,0.08)]',
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        {/* LEFT: navigation buttons */}
        <div className="flex items-center gap-2">
          {secondaryLabel && onSecondaryClick ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 px-4 text-[12px] font-medium"
              onClick={onSecondaryClick}
            >
              {secondaryLabel}
            </Button>
          ) : null}

          <Button
            type="button"
            size="sm"
            variant="primary"
            className="h-9 px-4 text-[12px] font-semibold"
            onClick={onPrimaryClick}
            disabled={primaryDisabled || !onPrimaryClick}
          >
            {primaryLabel}
          </Button>
        </div>

        {/* RIGHT: question progress (IELTS-style "Question X of Y") */}
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
          <span>
            Question{' '}
            <span className="font-semibold text-foreground">
              {currentQuestion}
            </span>{' '}
            of {totalQuestions}
          </span>

          {/* Dots are handled in QuestionNav; this just mimics the info text */}
        </div>
      </div>
    </footer>
  );
};

export default ExamFooter;
