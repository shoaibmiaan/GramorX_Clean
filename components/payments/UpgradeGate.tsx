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
  ctaLabel?: string;
  ctaFullWidth?: boolean;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  className?: string;
  children?: React.ReactNode;
};

const CTA_LABEL = 'Upgrade to continue';

type GateContentProps = {
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaFullWidth?: boolean;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

function GateContent({
  title,
  description,
  ctaLabel,
  ctaFullWidth,
  secondaryCtaHref,
  secondaryCtaLabel,
}: GateContentProps) {
  return (
    <div className="flex flex-col gap-2 text-left">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title ?? 'Feature locked'}</p>
        <p className="text-sm text-muted-foreground">{description ?? 'Upgrade to unlock this feature.'}</p>
      </div>
      <div>
        <Button href="/pricing" variant="primary" className={clsx({ 'w-full': ctaFullWidth })}>
          {ctaLabel ?? CTA_LABEL}
        </Button>
        {secondaryCtaHref && secondaryCtaLabel && (
          <Button
            href={secondaryCtaHref}
            variant="ghost"
            size="sm"
            className="mt-1 h-8 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {secondaryCtaLabel}
          </Button>
        )}
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
  ctaLabel,
  ctaFullWidth,
  secondaryCtaHref,
  secondaryCtaLabel,
  className,
  children,
}: UpgradeGateProps) {
  const currentTier = mapPlanIdToTier(tier);
  const allowed = hasAtLeast(currentTier, required);

  if (allowed) return <>{children}</>;

  if (variant === 'panel') {
    return (
      <div className={clsx('rounded-xl border border-border bg-card/70 p-4 shadow-sm', className)}>
        <GateContent
          title={title}
          description={description}
          ctaLabel={ctaLabel}
          ctaFullWidth={ctaFullWidth}
          secondaryCtaHref={secondaryCtaHref}
          secondaryCtaLabel={secondaryCtaLabel}
        />
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
        <GateContent
          title={title}
          description={description}
          ctaLabel={ctaLabel}
          ctaFullWidth={ctaFullWidth}
          secondaryCtaHref={secondaryCtaHref}
          secondaryCtaLabel={secondaryCtaLabel}
        />
      </div>
    </div>
  );
}

export default UpgradeGate;
