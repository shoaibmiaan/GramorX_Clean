// components/writing/result/WritingCriteriaGrid.tsx
import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import type { CriteriaKey } from '@/lib/writing/types';

type Props = {
  criteriaBands: Record<CriteriaKey, string>;
  criteriaNotes: Record<CriteriaKey, string[]>;
};

const labels: Record<CriteriaKey, { title: string; desc: string }> = {
  TR: { title: 'Task Response', desc: 'Answers the question fully, develops ideas.' },
  CC: { title: 'Coherence & Cohesion', desc: 'Paragraphing, flow, linking.' },
  LR: { title: 'Lexical Resource', desc: 'Vocabulary range, precision, repetition.' },
  GRA: { title: 'Grammar Range & Accuracy', desc: 'Structures + error control.' },
};

export const WritingCriteriaGrid: React.FC<Props> = ({ criteriaBands, criteriaNotes }) => {
  const keys: CriteriaKey[] = ['TR', 'CC', 'LR', 'GRA'];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {keys.map((k) => {
        const info = labels[k];
        const notes = criteriaNotes[k] ?? [];

        return (
          <Card key={k} className="rounded-ds-2xl border border-border bg-card/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {k}
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">{info.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{info.desc}</p>
              </div>
              <Badge variant="neutral" size="sm">
                Band {criteriaBands[k]}
              </Badge>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {(notes.length ? notes : ['No notes provided.']).slice(0, 3).map((n) => (
                <li key={n} className="flex items-start gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-border" />
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
};
