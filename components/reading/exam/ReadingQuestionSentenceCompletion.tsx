import * as React from 'react';
import type { RendererProps } from './QuestionRenderer';

const ReadingQuestionSentenceCompletion: React.FC<RendererProps> = ({ question, value, setAnswer, mode }) => {
  const current = typeof value === 'string' ? value : '';

  if (mode === 'review') {
    return <div className="text-sm text-foreground">{current || '—'}</div>;
  }

  const maxWords = question.maxWords;
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const next = e.target.value;
    if (maxWords && next.trim()) {
      const words = next.trim().split(/\s+/);
      if (words.length > maxWords) return;
    }
    setAnswer(next);
  };

  return (
    <div className="space-y-1">
      <input
        type="text"
        value={current}
        onChange={handleChange}
        className="w-full rounded-md border border-lightBorder bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-dark dark:border-white/10"
        placeholder={maxWords ? `No more than ${maxWords} words` : 'Type your answer'}
      />
      {maxWords ? (
        <p className="text-[11px] text-muted-foreground">Word limit: {maxWords}</p>
      ) : null}
    </div>
  );
};

export default ReadingQuestionSentenceCompletion;
