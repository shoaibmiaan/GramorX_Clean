import * as React from 'react';
import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Icon } from '@/components/design-system/Icon';

import type { ListeningQuestion as ListeningQuestionModel } from '@/lib/listening/types';

type AnswerValue = string | string[] | null;

// Extend the core model with a couple of legacy fields so older callers don’t explode
type ListeningQuestion = ListeningQuestionModel & {
  questionNo?: number | null;
  text?: string | null;
};

type ListeningQuestionItemProps = {
  question: ListeningQuestion;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
};

export const ListeningQuestionItem: React.FC<ListeningQuestionItemProps> = ({
  question,
  value,
  onChange,
}) => {
  const parsedOptions = React.useMemo(() => {
    const raw = question.options as unknown;
    if (!raw) return [] as { label: string; value: string }[];

    if (Array.isArray(raw)) {
      return (raw as any[]).map((opt, idx) => {
        if (typeof opt === 'string') return { label: opt, value: opt };
        if (typeof opt === 'object' && opt !== null) {
          return {
            label: (opt as any).label ?? (opt as any).text ?? `Option ${idx + 1}`,
            value: (opt as any).value ?? (opt as any).key ?? String(idx),
          };
        }
        return { label: String(opt), value: String(opt) };
      });
    }

    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return (parsed as any[]).map((opt, idx) =>
            typeof opt === 'string'
              ? { label: opt, value: opt }
              : {
                  label:
                    (opt as any).label ?? (opt as any).text ?? `Option ${idx + 1}`,
                  value: (opt as any).value ?? (opt as any).key ?? String(idx),
                },
          );
        }
      } catch (err) {
        console.error('Failed to parse listening options JSON', err, raw);
      }
    }

    return [] as { label: string; value: string }[];
  }, [question.options]);

  const rawType = (question.type ?? question.questionType ?? 'mcq').toLowerCase();
  const isMcq =
    rawType === 'mcq' ||
    rawType === 'multiple_choice' ||
    rawType === 'matching' ||
    (parsedOptions.length > 0 && rawType.includes('choice'));

  const handleMcqChange = (val: string) => {
    onChange(val);
  };

  const handleShortTextChange: React.ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    onChange(event.target.value);
  };

  const typeLabel = React.useMemo(() => {
    if (isMcq) return 'Multiple choice';
    if (rawType.includes('sentence')) return 'Sentence completion';
    if (rawType.includes('table')) return 'Table completion';
    if (rawType.includes('form')) return 'Form completion';
    return 'Short answer';
  }, [isMcq, rawType]);

  const questionNo =
    question.questionNo ??
    (question as any).questionNo ??
    question.questionNumber ??
    question.qno ??
    (question as any).question_no ??
    0;

  const promptText =
    (question as any).text ??
    question.questionText ??
    question.question_text ??
    question.prompt ??
    '';

  return (
    <Card className="border-none bg-background/90 p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge tone="neutral" size="xs">
              Q{questionNo}
            </Badge>
            <Badge tone="info" size="xs">
              {typeLabel}
            </Badge>
          </div>
          <p className="text-sm font-medium leading-relaxed">{promptText}</p>
        </div>
      </div>

      {isMcq && parsedOptions.length > 0 ? (
        <div className="mt-3 space-y-2">
          {parsedOptions.map((opt, idx) => {
            const selected = value === opt.value;
            const optionLabel = String.fromCharCode(65 + idx);

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleMcqChange(opt.value)}
                className={[
                  'flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-all',
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:bg-muted',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div
                  className={[
                    'flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {optionLabel}
                </div>
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mt-3 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Write your answer exactly as you heard it.
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none ring-0 focus:border-primary focus:ring-1 focus:ring-primary"
              value={typeof value === 'string' ? value : ''}
              onChange={handleShortTextChange}
              autoComplete="off"
            />
            <Button
              tone="neutral"
              variant="ghost"
              size="icon-sm"
              type="button"
              onClick={() => onChange('')}
            >
              <Icon name="eraser" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
