// components/sections/Pricing.tsx
import * as React from 'react';
import Link from 'next/link';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';

import {
  ORDERED_PLANS,
  getPlanDisplayPrice,
  PlanId,
  Cycle,
  PlanIdEnum,
  CycleEnum,
  CURRENCY_SYMBOL,
} from '@/lib/pricing';

type CycleToggleOption = {
  value: Cycle;
  label: string;
  sublabel: string;
};

const CYCLE_OPTIONS: CycleToggleOption[] = [
  {
    value: CycleEnum.Monthly,
    label: 'Monthly',
    sublabel: 'Pay month by month',
  },
  {
    value: CycleEnum.Annual,
    label: 'Annual',
    sublabel: '2 months free, billed yearly',
  },
];

const PLAN_FEATURES: Record<PlanId, string[]> = {
  [PlanIdEnum.Free]: [
    'Access to core IELTS dashboard',
    'Limited mocks across modules',
    'Basic streak tracking',
  ],
  [PlanIdEnum.Starter]: [
    'Full access for 1 IELTS module',
    'AI feedback for Writing or Speaking',
    'Streaks + Study heatmaps',
  ],
  [PlanIdEnum.Booster]: [
    'All 4 IELTS modules unlocked',
    'Unlimited mocks (fair usage)',
    'AI feedback + analytics for all skills',
    'Band score trajectory & gap analysis',
  ],
  [PlanIdEnum.Master]: [
    'Everything in Booster',
    'Priority AI queue + faster scoring',
    'Advanced analytics & error drill-down',
    'Teacher / coach view (coming soon)',
  ],
};

export const PricingSection: React.FC = () => {
  const [cycle, setCycle] = React.useState<Cycle>(CycleEnum.Monthly);

  return (
    <section className="py-16">
      <Container>
        {/* Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          <Badge>IELTS Mission Control</Badge>
          <h1 className="mt-4 text-display font-semibold">
            One platform. Four modules. Clear upgrade path.
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Start free, then level up when you&apos;re serious. Pricing is
            simple, global-ready and optimized for IELTS warriors.
          </p>

          {/* Cycle toggle */}
          <div className="mt-6 inline-flex items-center rounded-full bg-muted p-1">
            {CYCLE_OPTIONS.map((option) => {
              const isActive = cycle === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  className={[
                    'flex min-w-[140px] flex-col items-center rounded-full px-4 py-2 text-sm transition',
                    isActive
                      ? 'bg-background shadow-sm'
                      : 'text-muted-foreground',
                  ].join(' ')}
                  onClick={() => setCycle(option.value)}
                >
                  <span className="font-medium">{option.label}</span>
                  <span className="text-[11px] leading-tight">
                    {option.sublabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {ORDERED_PLANS.map((plan) => {
            const price = getPlanDisplayPrice(plan.id, cycle);
            const isFree = !plan.isPaid;
            const isHighlighted = plan.highlight;

            return (
              <Card
                key={plan.id}
                className={[
                  'relative flex h-full flex-col border',
                  isHighlighted ? 'border-primary shadow-lg' : 'border-subtle',
                ].join(' ')}
              >
                {/* Ribbon */}
                {isHighlighted && (
                  <div className="absolute right-3 top-3">
                    <Badge variant="primary">
                      {plan.badge ?? 'Best value'}
                    </Badge>
                  </div>
                )}

                {!isHighlighted && plan.badge && (
                  <div className="absolute right-3 top-3">
                    <Badge>{plan.badge}</Badge>
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3">
                    <h2 className="text-h4 font-semibold">{plan.label}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-4">
                    {isFree ? (
                      <p className="text-2xl font-semibold">Free forever</p>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl">{CURRENCY_SYMBOL}</span>
                        <span className="text-3xl font-bold">
                          {price.toFixed(0)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /mo
                        </span>
                      </div>
                    )}
                    {!isFree && cycle === CycleEnum.Annual && (
                      <p className="text-xs text-muted-foreground">
                        Billed yearly as{' '}
                        <strong>
                          {CURRENCY_SYMBOL}
                          {getPlanBillingAmount(
                            plan.id,
                            CycleEnum.Annual,
                          ).toFixed(0)}
                        </strong>
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="mb-5 flex flex-1 flex-col gap-2 text-sm text-muted-foreground">
                    {PLAN_FEATURES[plan.id].map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="mt-[3px] inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="mt-auto">
                    <Link
                      href={
                        isFree
                          ? '/auth/signup?plan=free'
                          : `/auth/upgrade?plan=${plan.id}`
                      }
                      passHref
                    >
                      <Button
                        className="w-full"
                        variant={isHighlighted ? 'primary' : 'outline'}
                      >
                        {isFree ? 'Start free' : 'Choose plan'}
                      </Button>
                    </Link>
                    {!isFree && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Cancel anytime. Plan enforcement handled per attempt.
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Small reassurance */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          All plans include IELTS Listening, Reading, Writing, and Speaking
          modules, with usage and depth based on your plan.
        </p>
      </Container>
    </section>
  );
};
