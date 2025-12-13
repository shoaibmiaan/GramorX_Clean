import * as React from 'react';
import Link from 'next/link';

import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';

type MockEmptyStateProps = {
  title: string;
  description?: string;
  icon?: React.ComponentProps<typeof Icon>['name'];
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  className?: string;
};

export const MockEmptyState: React.FC<MockEmptyStateProps> = ({
  title,
  description,
  icon = 'AlertCircle',
  primaryCta,
  secondaryCta,
  className,
}) => {
  return (
    <Card className={`border border-border/70 bg-card/80 p-6 shadow-sm ${className ?? ''}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-ds-xl bg-muted text-foreground/80">
          <Icon name={icon} size={20} />
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-base font-semibold text-foreground">{title}</p>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>

          {(primaryCta || secondaryCta) && (
            <div className="flex flex-wrap gap-2">
              {primaryCta ? (
                <Button asChild variant="primary" className="rounded-ds-full">
                  <Link href={primaryCta.href}>{primaryCta.label}</Link>
                </Button>
              ) : null}
              {secondaryCta ? (
                <Button asChild variant="secondary" className="rounded-ds-full">
                  <Link href={secondaryCta.href}>{secondaryCta.label}</Link>
                </Button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MockEmptyState;
