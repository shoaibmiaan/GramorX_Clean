// components/sections/PricingPreview.tsx
import * as React from 'react';
import Link from 'next/link';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { Ribbon } from '@/components/design-system/Ribbon';
import {
  getPlanDisplayPrice,
  type Cycle,
  type PlanKey,
} from '@/lib/pricing';

type PlanConfig = {
  key: PlanKey;
  label: string;
  tagline?: string;
  badge?: string;
  badgeTone?: 'default' | 'success' | 'warning' | 'info';
  recommended?: boolean;
  bullets: string[];
  ctaLabel: string;
};

const PLAN_CONFIG: PlanConfig[] = [
  {
    key: 'free',
    label: 'Free',
    tagline: 'Start here • Test-drive GramorX',
    badge: 'Start here',
    badgeTone: 'info',
    bullets: [
      'Access to all four modules in limited mode',
      'A few AI checks per month',
      'Basic streaks, saved items & dashboards',
    ],
    ctaLabel: 'Stay on Free',
  },
  {
    key: 'starter',
    label: 'Starter',
    tagline: 'Best for first-time takers',
    badge: 'New learners',
    badgeTone: 'default',
    bullets: [
      'More AI checks each month across skills',
      'Extra mock attempts with band estimates',
      'Core analytics and study suggestions',
    ],
    ctaLabel: 'Upgrade to Starter',
  },
  {
    key: 'booster',
    label: 'Rocket',
    tagline: 'Best for 6.5 — 7.5+',
    badge: 'Most popular',
    badgeTone: 'success',
    recommended: true,
    bullets: [
      'Deeper AI writing + speaking feedback',
      'More full mocks every month',
      'Full analytics, AI Lab & insights',
    ],
    ctaLabel: 'See Rocket details',
  },
  {
    key: 'master',
    label: 'Master',
    tagline: 'For 7.5 — 9.0 and serious prep',
    badge: 'All-in access',
    badgeTone: 'warning',
    bullets: [
      'Unlimited mocks for all four modules',
      'Unlimited AI feedback & improvement deltas',
      'Advanced reports, coach tools & streak heatmap',
    ],
    ctaLabel: 'Unlock Master',
  },
];

type Props = {
  cycle?: Cycle; // 'monthly' | 'yearly' etc, defaults to monthly
};

const PricingPreview: React.FC<Props> = ({ cycle = 'monthly' }) => {
  return (
    <section className="border-t border-border/40 bg-surface-muted py-10 md:py-14">
      <Container>
        {/* Header row */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
              Pricing preview
            </p>
            <h2 className="text-display-sm font-semibold text-foreground">
              Start free. Upgrade when you’re serious.
            </h2>
            <p className="max-w-xl text-body-sm text-muted">
              Free covers basic practice and a taste of AI. Starter unlocks more
              checks and mocks. Rocket (Booster) adds deep analytics. Master
              gives you everything we offer.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <Link
              href="/pricing/overview"
              className="text-body-xs font-medium text-primary hover:underline"
            >
              View full pricing page
            </Link>
            <span className="text-[11px] text-muted">
              Plans & limits may change before public launch.
            </span>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PLAN_CONFIG.map((plan) => {
            const price = getPlanDisplayPrice(plan.key, cycle);

            return (
              <Card
                key={plan.key}
                className={[
                  'flex h-full flex-col justify-between border border-border/60 bg-surface',
                  plan.recommended ? 'ring-1 ring-primary shadow-lg' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="space-y-4 p-5 pb-4 md:p-6 md:pb-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-h4 font-semibold text-foreground">
                        {plan.label}
                      </h3>
                      {plan.tagline && (
                        <p className="mt-1 text-body-xs text-muted">
                          {plan.tagline}
                        </p>
                      )}
                    </div>
                    {plan.badge && (
                      <Badge
                        variant={
                          (plan.badgeTone as any) ?? 'default'
                        }
                        size="sm"
                      >
                        {plan.badge}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-1">
                      <span className="text-display-sm font-semibold text-foreground">
                        {price}
                      </span>
                      <span className="text-body-xs text-muted">
                        / {cycle}
                      </span>
                    </div>
                    {plan.key === 'free' && (
                      <p className="text-body-xs text-muted">No card required.</p>
                    )}
                  </div>

                  <ul className="space-y-2 text-body-xs text-muted">
                    {plan.bullets.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-[3px] inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-border/60 p-5 pt-4 md:p-6 md:pt-4">
                  <Button
                    variant={plan.recommended ? 'primary' : 'secondary'}
                    className="w-full justify-center"
                    asChild
                  >
                    <Link href={`/pricing/overview?plan=${plan.key}`}>
                      {plan.ctaLabel}
                    </Link>
                  </Button>
                </div>

                {plan.recommended && (
                  <Ribbon position="top-right" tone="primary">
                    Most popular
                  </Ribbon>
                )}
              </Card>
            );
          })}
        </div>

        {/* Institution / Teacher strip */}
        <div className="mt-8 rounded-xl border border-dashed border-border/60 bg-surface px-4 py-4 md:flex md:items-center md:justify-between md:px-6">
          <div className="space-y-1">
            <p className="text-body-sm font-medium text-foreground">
              Institution / Teacher plans
            </p>
            <p className="text-body-xs text-muted">
              Running a coaching centre or academy? Get cohort analytics,
              teacher dashboards and co-branded experiences.
            </p>
          </div>
          <div className="mt-3 flex justify-start md:mt-0 md:justify-end">
            <Button variant="outline" size="sm" asChild>
              <Link href="/pricing/overview#institution">
                Talk to us
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default PricingPreview;
