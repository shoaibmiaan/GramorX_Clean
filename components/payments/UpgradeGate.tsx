import * as React from 'react';
import clsx from 'clsx';

import { Button } from '@/components/design-system/Button';
import { hasAtLeast, mapPlanIdToTier, type PlanInput, type PlanTier } from '@/lib/plans';

export type UpgradeGateProps = {
  required: PlanTier;
  tier?: PlanInput;
  variant?: 'inline' | 'overlay' | 'panel';
  title?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

const CTA_LABEL = 'Upgrade to continue';

function GateContent({ title, description }: { title?: string; description?: string }) {
  return (
    <div className="flex flex-col gap-2 text-left">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title ?? 'Feature locked'}</p>
        <p className="text-sm text-muted-foreground">{description ?? 'Upgrade to unlock this feature.'}</p>
      </div>
      <div>
        <Button href="/pricing" variant="primary">
          {CTA_LABEL}
        </Button>
      </div>
    </div>
  );
}

export function UpgradeGate({
  required,
  tier = 'free',
  variant = 'inline',
  title,
  description,
  className,
  children,
}: UpgradeGateProps) {
  const currentTier = mapPlanIdToTier(tier);
  const allowed = hasAtLeast(currentTier, required);

  if (allowed) return <>{children}</>;

  if (variant === 'panel') {
    return (
      <div className={clsx('rounded-xl border border-border bg-card/70 p-4 shadow-sm', className)}>
        <GateContent title={title} description={description} />
      </div>
    );
  }

  return (
    <div className={clsx('relative overflow-hidden rounded-xl', className)}>
      <div className="pointer-events-none select-none opacity-60 blur-sm">{children}</div>
      <div className={clsx('absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm', {
        'p-6': variant === 'overlay',
        'p-4': variant === 'inline',
      })}>
        <GateContent title={title} description={description} />
      </div>
    </div>
  );
}

export default UpgradeGate;
