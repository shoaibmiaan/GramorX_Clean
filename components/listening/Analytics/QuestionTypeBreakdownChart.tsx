// components/listening/Analytics/QuestionTypeBreakdownChart.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';
import type { ListeningQuestionType } from '@/lib/listening/types';
import { LISTENING_QUESTION_TYPE_LABELS } from '@/lib/listening/constants';

type QuestionTypeRow = {
  type: ListeningQuestionType;
  attempted: number;
  correct: number;
  avgAccuracy: number | null; // 0–1
};

type Props = {
  rows: QuestionTypeRow[];
};

const QuestionTypeBreakdownChart: React.FC<Props> = ({ rows }) => {
  if (!rows.length) {
    return (
      <Card className="border-border bg-card/60 p-4 text-xs text-muted-foreground sm:text-sm">
        No question-type analytics yet. Do a few attempts to see where you&apos;re leaking marks.
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/60 p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon name="PieChart" size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Accuracy by question type
          </h2>
        </div>
        <p className="text-[11px] text-muted-foreground">
          This is where you surgically fix your gaps.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs text-muted-foreground sm:text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide">
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Attempts</th>
              <th className="px-4 py-2 font-medium">Correct</th>
              <th className="px-4 py-2 font-medium">Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const percent =
                row.avgAccuracy != null
                  ? Math.round(row.avgAccuracy * 100)
                  : null;

              return (
                <tr
                  key={row.type}
                  className="border-b border-border/60 last:border-b-0"
                >
                  <td className="px-4 py-2 align-middle">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground sm:text-sm">
                        {LISTENING_QUESTION_TYPE_LABELS[row.type]}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {row.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                    {row.attempted}
                  </td>
                  <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                    {row.correct}
                  </td>
                  <td className="px-4 py-2 align-middle">
                    {percent != null ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        <Icon name="CheckCircle" size={11} />
                        <span>{percent}%</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default QuestionTypeBreakdownChart;
