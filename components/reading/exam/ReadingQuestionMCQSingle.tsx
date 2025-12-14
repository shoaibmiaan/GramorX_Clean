import * as React from 'react';
import type { RendererProps } from './QuestionRenderer';

const ReadingQuestionMCQSingle: React.FC<RendererProps> = ({ question, value, setAnswer, mode }) => {
  const opts = question.options ?? [];
  const current = typeof value === 'string' ? value : '';

  if (mode === 'review') {
    return <div className="text-sm text-foreground">{current || '—'}</div>;
  }

  if (!opts.length) {
    return (
      <input
        type="text"
        value={current}
        onChange={(e) => setAnswer(e.target.value)}
        className="w-full rounded-md border border-lightBorder bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-dark dark:border-white/10"
      />
    );
  }

  return (
    <div className="space-y-2">
      {opts.map((opt, idx) => {
        const letter = String.fromCharCode('A'.charCodeAt(0) + idx);
        const picked = current === letter || current === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => setAnswer(picked ? '' : letter)}
            className={[
              'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition',
              picked
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-lightBorder bg-background hover:border-primary/60 dark:bg-dark dark:border-white/10',
            ].join(' ')}
          >
            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-lightBorder text-[11px] font-semibold dark:border-white/10">
                {letter}
              </span>
              <span className="text-foreground">{opt}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ReadingQuestionMCQSingle;
