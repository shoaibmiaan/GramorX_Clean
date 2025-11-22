// components/listening/Learning/ListeningQuestionTypeCard.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';
import type { ListeningQuestionType } from '@/lib/listening/types';
import { LISTENING_QUESTION_TYPE_LABELS } from '@/lib/listening/constants';

type Props = {
  type: ListeningQuestionType;
  description: string;
  commonTraps?: string;
  exampleLabel?: string;
};

const iconByType: Partial<Record<ListeningQuestionType, string>> = {
  multiple_choice_single: 'ListChecks',
  multiple_choice_multiple: 'ListPlus',
  matching: 'Shuffle',
  map: 'Map',
  plan: 'MapPinned',
  form_completion: 'FileText',
  note_completion: 'FilePen',
  table_completion: 'Columns',
  diagram_completion: 'Shapes',
  short_answer: 'Edit3',
};

const ListeningQuestionTypeCard: React.FC<Props> = ({
  type,
  description,
  commonTraps,
  exampleLabel,
}) => {
  const iconName = iconByType[type] ?? 'HelpCircle';

  return (
    <Card className="flex h-full flex-col justify-between border-border bg-card/60 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <Icon name={iconName} size={16} className="text-primary" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {LISTENING_QUESTION_TYPE_LABELS[type]}
            </h3>
            <Badge variant="neutral" size="sm" className="uppercase tracking-wide">
              {type.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-2 text-xs text-muted-foreground sm:text-sm">
        {commonTraps && (
          <p className="flex items-start gap-1.5">
            <Icon name="AlertTriangle" size={12} className="mt-0.5 text-warning" />
            <span>{commonTraps}</span>
          </p>
        )}
        {exampleLabel && (
          <p className="flex items-start gap-1.5">
            <Icon name="Sparkles" size={12} className="mt-0.5 text-primary" />
            <span>{exampleLabel}</span>
          </p>
        )}
      </div>
    </Card>
  );
};

export default ListeningQuestionTypeCard;
