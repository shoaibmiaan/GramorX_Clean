// components/writing/result/WritingFeedbackBlocks.tsx
import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Icon } from '@/components/design-system/Icon';
import type { FeedbackBlock } from '@/lib/writing/types';

type Props = {
  blocks: FeedbackBlock[];
};

const Section: React.FC<{ title: string; items: string[] }> = ({ title, items }) => (
  <div className="space-y-1">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
    <ul className="space-y-1 text-sm text-foreground">
      {(items ?? []).slice(0, 4).map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-border" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </div>
);

export const WritingFeedbackBlocks: React.FC<Props> = ({ blocks }) => {
  if (!blocks.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {blocks.map((block) => (
        <Card
          key={`${block.taskNumber}-${block.title}`}
          className="rounded-ds-2xl border border-border/70 bg-card/70 p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {block.taskNumber === 2 ? 'Task 2' : 'Task 1'}
              </p>
              <p className="mt-1 text-base font-semibold text-foreground">{block.title}</p>
            </div>
            <Badge variant="accent" size="sm">
              {block.taskNumber === 2 ? 'Higher weight' : 'Lower weight'}
            </Badge>
          </div>

          <div className="mt-4 space-y-4">
            <Section title="Issues" items={block.issues} />
            <Section title="Why it hurts band" items={block.impact} />
            <Section title="Fix" items={block.fixes} />

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Example fix
              </p>
              <div className="mt-1 space-y-2">
                {(block.examples ?? []).slice(0, 2).map((ex) => (
                  <div
                    key={ex}
                    className="rounded-ds-xl border border-border bg-muted/30 px-3 py-2 text-sm text-foreground"
                  >
                    <Icon name="Wand" className="mr-2 inline h-4 w-4 text-muted-foreground" />
                    {ex}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default WritingFeedbackBlocks;
