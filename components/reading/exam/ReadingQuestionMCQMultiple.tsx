import * as React from 'react';
import type { RendererProps } from './QuestionRenderer';

const ReadingQuestionMCQMultiple: React.FC<RendererProps> = ({ question, value, setAnswer, mode }) => {
  const opts = question.options ?? [];
  const current = Array.isArray(value) ? value : [];

  if (mode === 'review') {
    return <div className="text-sm text-foreground">{current.join(', ') || '—'}</div>;
  }

  const toggle = (token: string) => {
    const exists = current.includes(token);
    const next = exists ? current.filter((t) => t !== token) : [...current, token];
    setAnswer(next);
  };

  if (!opts.length) {
    return (
      <input
        type="text"
        value={current.join(', ')}
        onChange={(e) => setAnswer(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
        className="w-full rounded-md border border-lightBorder bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-dark dark:border-white/10"
      />
    );
  }

  return (
    <div className="space-y-2">
      {opts.map((opt, idx) => {
        const letter = String.fromCharCode('A'.charCodeAt(0) + idx);
        const picked = current.includes(letter) || current.includes(opt);
        return (
          <label
            key={opt}
            className="flex items-center gap-3 rounded-md border border-lightBorder bg-background px-3 py-2 text-xs dark:bg-dark dark:border-white/10"
          >
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={picked}
              onChange={() => toggle(letter)}
            />
            <span className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full border border-lightBorder text-[11px] font-semibold dark:border-white/10">
                {letter}
              </span>
              <span>{opt}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
};

export default ReadingQuestionMCQMultiple;
