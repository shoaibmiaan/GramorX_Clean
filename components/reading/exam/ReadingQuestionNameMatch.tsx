import * as React from 'react';
import type { RendererProps } from './QuestionRenderer';
import { MatchingGroup, useMatchingOptionState } from './MatchingGroup';

const ReadingQuestionNameMatch: React.FC<RendererProps> = ({ question, value, setAnswer, answers, mode }) => {
  const pool = question.groupOptions ?? question.options ?? [];
  const used = useMatchingOptionState(question.groupId ?? question.id, answers);
  const current = typeof value === 'string' ? value : '';

  if (mode === 'review') {
    return <div className="text-sm text-foreground">{current || '—'}</div>;
  }

  const renderSelect = (
    <select
      className="w-full rounded-md border border-lightBorder bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring dark:bg-dark dark:border-white/10"
      value={current}
      onChange={(e) => setAnswer(e.target.value)}
    >
      <option value="">Select</option>
      {pool.map((opt) => (
        <option key={opt} value={opt} disabled={used[opt] && current !== opt}>
          {opt}
        </option>
      ))}
    </select>
  );

  return (
    <MatchingGroup prompt={question.groupPrompt} options={pool}>
      <div className="flex items-center gap-2 text-xs text-foreground">
        <span className="min-w-[80px] font-semibold">Name</span>
        {renderSelect}
      </div>
    </MatchingGroup>
  );
};

export default ReadingQuestionNameMatch;
