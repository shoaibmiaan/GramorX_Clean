// components/writing/review/WritingResponsePanel.tsx
import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

type Props = {
  taskNumber: 1 | 2;
  text: string;
  wordCount: number;
};

export const WritingResponsePanel: React.FC<Props> = ({ taskNumber, text, wordCount }) => {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text ?? '');
    } catch {
      // ignore
    }
  };

  return (
    <Card className="rounded-ds-2xl border border-border bg-card/70 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Task {taskNumber} response
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Word count: <span className="font-semibold text-foreground">{wordCount}</span>
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={() => void copy()}>
          <Icon name="Copy" className="mr-1.5 h-4 w-4" />
          Copy text
        </Button>
      </div>

      <div className="mt-4 whitespace-pre-wrap rounded-ds-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
        {text?.trim() ? text : <span className="text-muted-foreground">No answer saved for this task.</span>}
      </div>
    </Card>
  );
};
