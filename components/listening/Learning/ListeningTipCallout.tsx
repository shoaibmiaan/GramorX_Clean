// components/listening/Learning/ListeningTipCallout.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type Variant = 'tip' | 'warning' | 'exam';

type Props = {
  variant?: Variant;
  title: string;
  children: React.ReactNode;
};

const iconByVariant: Record<Variant, string> = {
  tip: 'Lightbulb',
  warning: 'AlertTriangle',
  exam: 'Clock',
};

const chipByVariant: Record<Variant, string> = {
  tip: 'GX Tip',
  warning: 'Careful',
  exam: 'Exam behaviour',
};

const ListeningTipCallout: React.FC<Props> = ({ variant = 'tip', title, children }) => {
  return (
    <Card className="flex items-start gap-3 border border-dashed border-border bg-muted/40 px-3 py-3 sm:px-4 sm:py-3">
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-background">
        <Icon name={iconByVariant[variant]} size={16} className="text-primary" />
      </div>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
            {chipByVariant[variant]}
          </span>
          <h3 className="text-xs font-semibold text-foreground sm:text-sm">{title}</h3>
        </div>
        <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{children}</div>
      </div>
    </Card>
  );
};

export default ListeningTipCallout;
