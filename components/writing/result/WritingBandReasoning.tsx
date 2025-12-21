// components/writing/result/WritingBandReasoning.tsx
import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import type { BandReasoningItem } from '@/lib/writing/types';

type Props = {
  items: BandReasoningItem[];
};

export const WritingBandReasoning: React.FC<Props> = ({ items }) => {
  if (!items.length) return null;

  const grouped: Record<'1' | '2', BandReasoningItem[]> = { '1': [], '2': [] };
  items.forEach((i) => grouped[String(i.taskNumber) as '1' | '2'].push(i));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[2, 1].map((task) => {
        const list = grouped[String(task) as '1' | '2'];
        if (!list.length) return null;

        const toneClass = task === 2 ? 'bg-card/80' : 'bg-card/70';

        return (
          <Card key={task} className={`rounded-ds-2xl border border-border ${toneClass} p-5`}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Task {task}
                </p>
                <p className="text-base font-semibold text-foreground">Why this band</p>
              </div>
              <Badge size="sm" variant={task === 2 ? 'accent' : 'neutral'}>
                {task === 2 ? 'Higher weight' : 'Lower weight'}
              </Badge>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-foreground">
              {list.slice(0, 6).map((item) => (
                <li key={`${item.criteria}-${item.text}`} className="flex items-start gap-2">
                  <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-border" />
                  <span>
                    <span className="font-semibold">{item.criteria}</span> — {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
};

export default WritingBandReasoning;
