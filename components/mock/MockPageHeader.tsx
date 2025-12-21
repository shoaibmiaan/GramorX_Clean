import * as React from 'react';
import Link from 'next/link';

import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';

type Action = { label: string; href: string; icon?: React.ComponentProps<typeof Icon>['name']; variant?: 'primary' | 'secondary' };

type MockPageHeaderProps = {
  title: string;
  subtitle?: string;
  badge?: { label: string; tone?: React.ComponentProps<typeof Badge>['tone'] };
  backHref?: string;
  backLabel?: string;
  actions?: Action[];
};

export const MockPageHeader: React.FC<MockPageHeaderProps> = ({
  title,
  subtitle,
  badge,
  backHref,
  backLabel = 'Back',
  actions,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-ds-2xl bg-card/60 px-4 py-3 ring-1 ring-border/60">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          {backHref ? (
            <Button asChild size="sm" variant="ghost" className="-ml-1 px-2 text-muted-foreground">
              <Link href={backHref}>
                <Icon name="ArrowLeft" size={16} className="mr-1" />
                {backLabel}
              </Link>
            </Button>
          ) : null}
          {badge ? <Badge tone={badge.tone ?? 'info'}>{badge.label}</Badge> : null}
        </div>
        <h1 className="font-slab text-h3 text-foreground sm:text-h2">{title}</h1>
        {subtitle ? <p className="text-small text-muted-foreground">{subtitle}</p> : null}
      </div>

      {actions && actions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              asChild
              variant={action.variant ?? 'primary'}
              className="rounded-ds-full"
            >
              <Link href={action.href}>
                {action.icon ? <Icon name={action.icon} size={16} className="mr-1.5" /> : null}
                {action.label}
              </Link>
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default MockPageHeader;
