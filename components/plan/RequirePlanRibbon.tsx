// components/plan/RequirePlanRibbon.tsx
import * as React from 'react';
import Link from 'next/link';

import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';

import {
  PlanId,
  PlanIdEnum,
  ORDERED_PLANS,
  PLAN_LABEL,
} from '@/lib/pricing';
import { useUserPlan } from '@/hooks/useUserPlan';

type RequirePlanRibbonProps = {
  /** The minimum plan required to fully unlock this feature/module */
  requiredPlan: PlanId;
  /** The current user plan, or null if unauthenticated / unknown */
  currentPlan: PlanId | null;
  /** Optional: override CTA href, else defaults to /pricing or /auth/upgrade */
  upgradeHref?: string;
  /** Optional extra CSS classes */
  className?: string;
};

const PLAN_RANK: Record<PlanId, number> = ORDERED_PLANS.reduce(
  (acc, plan, index) => {
    acc[plan.id] = index;
    return acc;
  },
  {} as Record<PlanId, number>,
);

const getUpgradeTargetPlan = (required: PlanId, current: PlanId | null): PlanId => {
  if (!current) return required;
  const requiredRank = PLAN_RANK[required];
  const currentRank = PLAN_RANK[current] ?? -1;
  return currentRank >= requiredRank ? current : required;
};

export const RequirePlanRibbon: React.FC<RequirePlanRibbonProps> = ({
  requiredPlan,
  currentPlan,
  upgradeHref,
  className,
}) => {
  if (currentPlan && PLAN_RANK[currentPlan] >= PLAN_RANK[requiredPlan]) {
    // Already on required or higher → nothing to show
    return null;
  }

  const targetPlan = getUpgradeTargetPlan(requiredPlan, currentPlan);
  const isLoggedIn = Boolean(currentPlan);
  const href =
    upgradeHref ??
    (isLoggedIn
      ? `/auth/upgrade?plan=${targetPlan}`
      : `/auth/signup?plan=${targetPlan}`);

  const labelCurrent = currentPlan ? PLAN_LABEL[currentPlan] : 'Guest';
  const labelRequired = PLAN_LABEL[requiredPlan];

  return (
    <Card
      className={[
        'mb-4 flex flex-col gap-3 border border-dashed border-primary/60 bg-primary/5 px-4 py-3 text-sm',
        className ?? '',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Badge variant="primary" /* adjust if you have more variants */ size="sm">
            Plan upgrade recommended
          </Badge>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>
              You&apos;re currently on <strong>{labelCurrent}</strong>.
            </span>
            <span className="hidden text-muted-foreground/80 sm:inline">
              This feature works best on <strong>{labelRequired}</strong> or higher.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={href} passHref>
            <Button size="sm" variant="primary">
              Upgrade to {PLAN_LABEL[targetPlan]}
            </Button>
          </Link>
          <Link href="/pricing" passHref>
            <Button size="sm" variant="ghost">
              View all plans
            </Button>
          </Link>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Plan enforcement is handled automatically per attempt. You can explore
        the UI, but some actions may be blocked or rate-limited on lower plans.
      </p>
    </Card>
  );
};

// 🔥 Auto-wired version – call this in pages/components.
type AutoRequirePlanRibbonProps = {
  requiredPlan: PlanId;
  className?: string;
  upgradeHref?: string;
};

export const AutoRequirePlanRibbon: React.FC<AutoRequirePlanRibbonProps> = ({
  requiredPlan,
  className,
  upgradeHref,
}) => {
  const { loading, plan } = useUserPlan();

  // Optional: you can show skeleton while loading, but for now we hide until known.
  if (loading) return null;

  return (
    <RequirePlanRibbon
      requiredPlan={requiredPlan}
      currentPlan={plan}
      className={className}
      upgradeHref={upgradeHref}
    />
  );
};
