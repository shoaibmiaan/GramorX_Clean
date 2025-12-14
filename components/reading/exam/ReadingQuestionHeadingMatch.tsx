import * as React from 'react';
import type { RendererProps } from './QuestionRenderer';
import { MatchingGroup, useMatchingOptionState } from './MatchingGroup';

const ReadingQuestionHeadingMatch: React.FC<RendererProps> = ({ question, value, setAnswer, answers, mode }) => {
  const groupOptions = question.groupOptions ?? question.options ?? [];
  const used = useMatchingOptionState(question.groupId ?? question.id, answers);
  const current = typeof value === 'string' ? value : '';

  if (mode === 'review') {
    return <div className="text-sm text-foreground">{current || '—'}</div>;
  }

  const options = groupOptions.length ? groupOptions : question.options ?? [];

  const renderSelect = (
    <select
      className="w-full rounded-md border border-lightBorder bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring dark:bg-dark dark:border-white/10"
      value={current}
      onChange={(e) => setAnswer(e.target.value)}
    >
      <option value="">Select</option>
      {options.map((opt) => (
        <option key={opt} value={opt} disabled={used[opt] && current !== opt}>
          {opt}
        </option>
      ))}
    </select>
  );

  if (options === groupOptions) {
    return (
      <MatchingGroup prompt={question.groupPrompt} options={options}>
        <div className="flex items-center gap-2 text-xs text-foreground">
          <span className="min-w-[40px] font-semibold">Heading</span>
          {renderSelect}
        </div>
      </MatchingGroup>
    );
  }

  return renderSelect;
};

export default ReadingQuestionHeadingMatch;
