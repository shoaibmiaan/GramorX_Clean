// components/writing/review/WritingPromptPanel.tsx
import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

type Props = {
  taskNumber: 1 | 2;
  prompt: string;
  minWords: number;
};

export const WritingPromptPanel: React.FC<Props> = ({ taskNumber, prompt, minWords }) => {
  return (
    <Card className="rounded-ds-2xl border border-border bg-card/70 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Task {taskNumber} prompt
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Minimum words: <span className="font-semibold text-foreground">{minWords || '—'}</span>
          </p>
        </div>
        <Badge size="sm" variant={taskNumber === 2 ? 'accent' : 'neutral'}>
          {taskNumber === 2 ? 'Higher weight' : 'Lower weight'}
        </Badge>
      </div>

      <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {prompt?.trim() ? (
          prompt
        ) : (
          <div className="flex items-start gap-2 text-muted-foreground">
            <Icon name="Info" size={16} className="mt-0.5" />
            <span>No prompt found for this task.</span>
          </div>
        )}
      </div>
    </Card>
  );
};
