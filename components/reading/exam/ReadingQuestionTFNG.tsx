import * as React from 'react';
import { Button } from '@/components/design-system/Button';
import type { RendererProps } from './QuestionRenderer';

const OPTIONS = ['True', 'False', 'Not Given'];

const ReadingQuestionTFNG: React.FC<RendererProps> = ({ value, setAnswer, mode }) => {
  if (mode === 'review') {
    return <div className="text-sm text-foreground">{value ?? '—'}</div>;
  }

  const current = typeof value === 'string' ? value : '';
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => {
        const picked = current === opt;
        return (
          <Button
            key={opt}
            type="button"
            size="sm"
            variant={picked ? 'primary' : 'outline'}
            className="rounded-full px-3 text-xs"
            onClick={() => setAnswer(picked ? '' : opt)}
          >
            {opt}
          </Button>
        );
      })}
    </div>
  );
};

export default ReadingQuestionTFNG;
