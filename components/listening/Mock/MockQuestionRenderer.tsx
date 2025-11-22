// components/listening/Mock/MockQuestionRenderer.tsx
import * as React from 'react';

import type { ListeningQuestion, ListeningAttemptAnswer } from '@/lib/listening/types';
import MockQuestionFlag from '@/components/listening/Mock/MockQuestionFlag';
import { Card } from '@/components/design-system/Card';
import { Input } from '@/components/design-system/Input';
import Icon from '@/components/design-system/Icon';

type Props = {
  question: ListeningQuestion;
  answer?: ListeningAttemptAnswer;
  flagged: boolean;
  onChangeAnswer: (questionId: string, value: string | string[]) => void;
  onToggleFlag: () => void;
};

const MockQuestionRenderer: React.FC<Props> = ({
  question,
  answer,
  flagged,
  onChangeAnswer,
  onToggleFlag,
}) => {
  const isMultiChoice =
    question.type === 'multiple_choice_single' ||
    question.type === 'multiple_choice_multiple';

  const currentValue = React.useMemo(() => {
    if (!answer) return '';
    if (Array.isArray(answer.value)) return answer.value;
    return answer.value;
  }, [answer]);

  const renderChoice = () => {
    if (!isMultiChoice || !question.options || !question.options.length) {
      return null;
    }

    const isMulti = question.type === 'multiple_choice_multiple';
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
            In the real exam, this will clearly say when you can choose more than one option.
          </p>
        )}
      </div>
    );
  };

  const renderText = () => {
    if (isMultiChoice) return null;

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
          placeholder="Type exactly what you hear…"
        />
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Question {question.questionNumber} · Section {question.sectionNumber}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {question.prompt}
          </p>
          {question.context && (
            <p className="mt-1 text-xs text-muted-foreground">
              {question.context}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <p className="text-[11px] text-muted-foreground">
            {question.maxScore} mark{question.maxScore !== 1 ? 's' : ''}
          </p>
          <MockQuestionFlag flagged={flagged} onToggle={onToggleFlag} />
        </div>
      </div>

      {renderChoice()}
      {renderText()}

      <Card className="border-dashed border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
        <p className="flex items-start gap-1.5">
          <Icon name="Info" size={11} className="mt-0.5" />
          <span>
            This mock behaves like the real exam. No answer checking until the end. Focus on
            listening once and typing confidently.
          </span>
        </p>
      </Card>
    </div>
  );
};

export default MockQuestionRenderer;
