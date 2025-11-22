// components/listening/ListeningInfoBanner.tsx
import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type Variant = 'info' | 'warning' | 'success';

type Props = {
  variant?: Variant;
  title: string;
  body: string;
};

const variantIcon: Record<Variant, string> = {
  info: 'Info',
  warning: 'AlertTriangle',
  success: 'CheckCircle',
};

const variantBg: Record<Variant, string> = {
  info: 'bg-muted/60',
  warning: 'bg-warning/10',
  success: 'bg-success/10',
};

const variantIconColor: Record<Variant, string> = {
  info: 'text-primary',
  warning: 'text-warning',
  success: 'text-success',
};

const ListeningInfoBanner: React.FC<Props> = ({ variant = 'info', title, body }) => {
  return (
    <Card className={`flex items-start gap-3 border border-dashed border-border ${variantBg[variant]}`}>
      <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 ${variantIconColor[variant]}`}>
        <Icon name={variantIcon[variant]} size={16} />
      </div>
      <div>
        <h2 className="text-xs font-semibold text-foreground sm:text-sm">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{body}</p>
      </div>
    </Card>
  );
};

export default ListeningInfoBanner;
