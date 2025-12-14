import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { normalizeReadingQuestion } from '@/lib/reading/normalizeQuestion';
import type { ReadingQuestion } from '@/lib/reading/types';
import QuestionRenderer, { type AnswerValue } from './exam/QuestionRenderer';

type ReadingQuestionItemProps = {
  question: ReadingQuestion;
  value?: AnswerValue;
  onChange?: (val: AnswerValue) => void;
  answers?: Record<string, AnswerValue>;
  mode?: 'exam' | 'review';
  isFlagged?: boolean;
  onToggleFlag?: () => void;
};

export const ReadingQuestionItem: React.FC<ReadingQuestionItemProps> = ({
  question,
  value,
  onChange,
  answers,
  mode = 'exam',
  isFlagged = false,
  onToggleFlag,
}) => {
  const normalized = React.useMemo(() => normalizeReadingQuestion(question), [question]);

  return (
    <Card className="space-y-3 rounded-ds-xl border border-lightBorder bg-background/95 p-4 text-sm shadow-sm dark:bg-dark/90 dark:border-white/10">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-foreground">
            {question.questionOrder}
          </span>
          <div>
            <div className="font-semibold text-foreground leading-tight">{normalized.prompt}</div>
            {normalized.instructions && (
              <p className="mt-1 text-xs text-muted-foreground">{normalized.instructions}</p>
            )}
          </div>
        </div>

        {onToggleFlag && mode === 'exam' && (
          <Button
            size="xs"
            variant={isFlagged ? 'soft' : 'outline'}
            tone={isFlagged ? 'warning' : 'default'}
            onClick={onToggleFlag}
            aria-pressed={isFlagged}
            className="rounded-ds"
          >
            {isFlagged ? 'Marked for review' : 'Mark for review'}
          </Button>
        )}
      </div>

      <QuestionRenderer
        question={normalized}
        value={value ?? null}
        setAnswer={onChange ?? (() => {})}
        answers={answers}
        mode={mode}
      />
    </Card>
  );
};

export default ReadingQuestionItem;
