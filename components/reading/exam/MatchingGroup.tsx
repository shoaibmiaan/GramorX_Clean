import * as React from 'react';
import type { AnswerValue } from './QuestionRenderer';

export type MatchingGroupProps = {
  prompt?: string | null;
  options: string[];
  children: React.ReactNode;
};

export const MatchingGroup: React.FC<MatchingGroupProps> = ({ prompt, options, children }) => {
  return (
    <div className="space-y-3 rounded-md border border-lightBorder bg-background/70 p-3 dark:bg-dark/70 dark:border-white/10">
      {prompt ? <p className="text-xs text-muted-foreground">{prompt}</p> : null}
      <div className="flex flex-wrap gap-2 text-xs text-foreground">
        {options.map((opt) => (
          <span
            key={opt}
            className="rounded-full border border-dashed border-lightBorder px-2 py-1 dark:border-white/20"
          >
            {opt}
          </span>
        ))}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
};

export const useMatchingOptionState = (
  questionId: string,
  answers?: Record<string, AnswerValue>,
): Record<string, boolean> => {
  if (!answers) return {};
  const used: Record<string, boolean> = {};
  Object.entries(answers).forEach(([qid, val]) => {
    if (qid === questionId) return;
    if (typeof val === 'string') used[val] = true;
    else if (val && typeof val === 'object' && !Array.isArray(val)) {
      Object.values(val).forEach((v) => {
        if (typeof v === 'string') used[v] = true;
      });
    }
  });
  return used;
};
