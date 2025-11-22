// components/listening/Practice/PracticeAnswerInput.tsx
import * as React from 'react';

import type { ListeningQuestion, ListeningAttemptAnswer } from '@/lib/listening/types';
import { Input } from '@/components/design-system/Input';
import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type Props = {
  question: ListeningQuestion;
  answer?: ListeningAttemptAnswer;
  onChangeAnswer: (questionId: string, value: string | string[]) => void;
};

const PracticeAnswerInput: React.FC<Props> = ({ question, answer, onChangeAnswer }) => {
  const isMultiChoice =
    question.type === 'multiple_choice_single' ||
    question.type === 'multiple_choice_multiple';

  const currentValue = React.useMemo(() => {
    if (!answer) return '';
    if (Array.isArray(answer.value)) return answer.value;
    return answer.value;
  }, [answer]);

  if (isMultiChoice && question.options && question.options.length > 0) {
    const isMulti =
      question.type === 'multiple_choice_multiple';

    const selectedValues = Array.isArray(currentValue)
      ? currentValue
      : currentValue
      ? [currentValue]
      : [];

    const toggleValue = (value: string) => {
      if (isMulti) {
        if (selectedValues.includes(value)) {
          onChangeAnswer(
            question.id,
            selectedValues.filter((v) => v !== value),
          );
        } else {
          onChangeAnswer(question.id, [...selectedValues, value]);
        }
      } else {
        onChangeAnswer(question.id, value);
      }
    };

    return (
      <div className="space-y-2">
        {question.options.map((opt) => {
          const checked = selectedValues.includes(opt.value);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleValue(opt.value)}
              className={[
                'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs sm:text-sm',
                checked
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/60',
              ].join(' ')}
            >
              <span className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-[11px] font-semibold text-muted-foreground">
                  {opt.label}
                </span>
                <span>{opt.value}</span>
              </span>
              {checked && (
                <Icon name="Check" size={14} className="text-primary" />
              )}
            </button>
          );
        })}
        {isMulti && (
          <p className="text-[11px] text-muted-foreground">
            You can select more than one option.
          </p>
        )}
      </div>
    );
  }

  // Default: short answer / completion (single value)
  const textValue =
    typeof currentValue === 'string'
      ? currentValue
      : Array.isArray(currentValue)
      ? currentValue.join(', ')
      : '';

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-muted-foreground">
        Your answer
      </label>
      <Input
        value={textValue}
        onChange={(e) => onChangeAnswer(question.id, e.target.value)}
        placeholder="Type your answer here…"
      />
      <Card className="border-dashed border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
        <p className="flex items-start gap-1.5">
          <Icon name="Info" size={11} className="mt-0.5" />
          <span>
            Spelling matters in IELTS Listening. Write what you hear, not what you
            think it should be.
          </span>
        </p>
      </Card>
    </div>
  );
};

export default PracticeAnswerInput;
