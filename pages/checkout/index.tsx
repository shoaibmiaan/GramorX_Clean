// pages/checkout/index.tsx
import * as React from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import {
  PLANS as CANONICAL_PLANS,
  ORDERED_PLANS,
  PLAN_LABEL,
  type PlanId,
  type Cycle,
  CURRENCY_SYMBOL,
  getPlanDisplayPrice,
  getPlanBillingAmount,
} from '@/lib/pricing';

const DEFAULT_PLAN: PlanId = 'starter';
const DEFAULT_CYCLE: Cycle = 'monthly';

const CheckoutPage: NextPage = () => {
  const router = useRouter();
  const queryPlan = (router.query.plan as string | undefined)?.toLowerCase() as
    | PlanId
    | undefined;
  const queryCycle = (router.query.cycle as string | undefined)?.toLowerCase() as
    | Cycle
    | undefined;

  const [selectedPlan, setSelectedPlan] = React.useState<PlanId>(
    CANONICAL_PLANS[queryPlan ?? DEFAULT_PLAN] ? queryPlan ?? DEFAULT_PLAN : DEFAULT_PLAN,
  );
  const [cycle, setCycle] = React.useState<Cycle>(
    queryCycle === 'annual' ? 'annual' : DEFAULT_CYCLE,
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const activePlan = CANONICAL_PLANS[selectedPlan];

  const handleConfirm = async () => {
    if (!activePlan) {
      setError('Unknown plan selected. Please refresh and try again.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan, cycle }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to create checkout session');
      }

      const body = await res.json();
      if (body?.redirectUrl) {
        window.location.href = body.redirectUrl;
      } else {
        // Fallback: go to account/billing or home
        router.push('/account/billing').catch(() => {
          router.push('/').catch(() => undefined);
        });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong during checkout';
      setError(message);
      setSubmitting(false);
    }
  };

  const displayPrice = activePlan
    ? getPlanDisplayPrice(activePlan.id, cycle)
    : 0;
  const billingAmount = activePlan
    ? getPlanBillingAmount(activePlan.id, cycle)
    : 0;

  return (
    <>
      <Head>
        <title>Checkout • GramorX</title>
      </Head>
      <main className="min-h-screen bg-background py-10">
        <Container className="max-w-4xl">
          <h1 className="text-display font-bold">Confirm your plan</h1>
          <p className="mt-2 text-muted">
            Choose your IELTS mission level and complete secure payment to unlock premium
            modules.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-[2fr,1.25fr]">
            <Card className="space-y-4 p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-h4 font-semibold">Select a plan</h2>
                <div className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium">
                  Billed in {cycle === 'monthly' ? 'monthly' : 'annual'} cycle
                </div>
              </div>

              {/* Plan selector */}
              <div className="grid gap-3 md:grid-cols-3">
                {ORDERED_PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={[
                      'flex flex-col rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selectedPlan === plan.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/60 hover:bg-muted',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">
                        {PLAN_LABEL[plan.id]}
                      </span>
                      {plan.badge ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {plan.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">
                      {plan.description}
                    </p>
                  </button>
                ))}
              </div>

              {/* Cycle toggle */}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-full bg-muted p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setCycle('monthly')}
                    className={[
                      'px-3 py-1 rounded-full transition',
                      cycle === 'monthly'
                        ? 'bg-background text-primary shadow-sm'
                        : 'text-muted',
                    ].join(' ')}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setCycle('annual')}
                    className={[
                      'px-3 py-1 rounded-full transition',
                      cycle === 'annual'
                        ? 'bg-background text-primary shadow-sm'
                        : 'text-muted',
                    ].join(' ')}
                  >
                    Annual (save more)
                  </button>
                </div>
                <p className="text-xs text-muted">
                  You can change or cancel your plan any time.
                </p>
              </div>
            </Card>

            {/* Summary card */}
            <Card className="flex flex-col justify-between p-6">
              <div>
                <h2 className="text-h5 font-semibold">Summary</h2>
                {activePlan ? (
                  <>
                    <p className="mt-1 text-xs text-muted">
                      {PLAN_LABEL[activePlan.id]} •{' '}
                      {cycle === 'monthly' ? 'Monthly billing' : 'Annual billing'}
                    </p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        {CURRENCY_SYMBOL}
                        {displayPrice.toFixed(0)}
                      </span>
                      <span className="text-xs text-muted">
                        /month • billed{' '}
                        {cycle === 'monthly'
                          ? 'each month'
                          : `${CURRENCY_SYMBOL}${billingAmount.toFixed(0)} once / year`}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-danger">
                    Invalid plan. Please go back and select again.
                  </p>
                )}

                <ul className="mt-4 space-y-1 text-xs text-muted">
                  <li>• Access to IELTS modules based on your plan.</li>
                  <li>• AI-powered scoring & feedback included.</li>
                  <li>• Secure payment, no hidden charges.</li>
                </ul>

                {error ? (
                  <p className="mt-3 text-xs text-danger">
                    {error}
                  </p>
                ) : null}
              </div>

              <Button
                className="mt-6 w-full"
                size="lg"
                disabled={submitting || !activePlan}
                onClick={handleConfirm}
              >
                {submitting ? 'Processing…' : 'Confirm & pay'}
              </Button>
            </Card>
          </div>
        </Container>
      </main>
    </>
  );
};

export default CheckoutPage;
