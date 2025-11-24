// components/layout/PlanNavCta.tsx
import * as React from 'react';
import Link from 'next/link';

import { Button } from '@/components/design-system/Button';
import { useUserPlan } from '@/hooks/useUserPlan';
import { PlanIdEnum } from '@/lib/pricing';

export const PlanNavCta: React.FC = () => {
  const { loading, isAuthenticated, plan } = useUserPlan();

  if (loading) {
    // Small skeleton so nav doesn't jump
    return (
      <div className="h-9 w-24 animate-pulse rounded-full bg-muted" aria-hidden />
    );
  }

  // Not logged in → "Start free"
  if (!isAuthenticated || !plan) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/auth/login" passHref>
          <Button size="sm" variant="ghost">
            Log in
          </Button>
        </Link>
        <Link href="/auth/signup?plan=free" passHref>
          <Button size="sm" variant="primary">
            Start free
          </Button>
        </Link>
      </div>
    );
  }

  // Logged in, but Free → highlight upgrade
  if (plan === PlanIdEnum.Free) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/app" passHref>
          <Button size="sm" variant="ghost">
            Go to dashboard
          </Button>
        </Link>
        <Link href="/pricing" passHref>
          <Button size="sm" variant="primary">
            Upgrade
          </Button>
        </Link>
      </div>
    );
  }

  // Starter / Booster / Master → focus on dashboard, subtle upgrade link
  return (
    <div className="flex items-center gap-2">
      <Link href="/app" passHref>
        <Button size="sm" variant="primary">
          Dashboard
        </Button>
      </Link>
      <Link href="/pricing" passHref>
        <Button size="sm" variant="ghost">
          Manage plan
        </Button>
      </Link>
    </div>
  );
};
