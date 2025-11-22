// components/listening/Mock/MockAnswerSheet.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type AnswerRow = {
  questionNumber: number;
  sectionNumber: number;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
};

type Props = {
  rows: AnswerRow[];
};

const MockAnswerSheet: React.FC<Props> = ({ rows }) => {
  if (!rows.length) {
    return (
      <Card className="border-border bg-card/60 p-4 text-xs text-muted-foreground sm:text-sm">
        No answer data available for this mock. Something is off with the attempt or mapping.
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/60 p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon name="FileText" size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Answer sheet</h2>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Green = correct, red = wrong. No drama, just learn.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs text-muted-foreground sm:text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide">
              <th className="px-4 py-2 font-medium">Q</th>
              <th className="px-4 py-2 font-medium">Section</th>
              <th className="px-4 py-2 font-medium">Prompt</th>
              <th className="px-4 py-2 font-medium">Your answer</th>
              <th className="px-4 py-2 font-medium">Correct answer</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.sectionNumber}-${row.questionNumber}`}
                className="border-b border-border/60 last:border-b-0"
              >
                <td className="px-4 py-2 align-top text-xs font-semibold text-foreground">
                  {row.questionNumber}
                </td>
                <td className="px-4 py-2 align-top text-[11px] text-muted-foreground">
                  {row.sectionNumber}
                </td>
                <td className="px-4 py-2 align-top text-[11px] text-muted-foreground">
                  {row.prompt}
                </td>
                <td className="px-4 py-2 align-top">
                  <span
                    className={[
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[11px]',
                      row.isCorrect
                        ? 'bg-success/10 text-success'
                        : 'bg-danger/10 text-danger',
                    ].join(' ')}
                  >
                    {row.userAnswer || '—'}
                  </span>
                </td>
                <td className="px-4 py-2 align-top text-[11px] text-foreground">
                  {row.correctAnswer || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default MockAnswerSheet;
