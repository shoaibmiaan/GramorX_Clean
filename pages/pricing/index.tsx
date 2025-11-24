// pages/pricing/index.tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';

import { Container } from '@/components/design-system/Container';
import { Section } from '@/components/design-system/Section';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { Ribbon } from '@/components/design-system/Ribbon';
import SocialProofStrip from '@/components/marketing/SocialProofStrip';
import {
  getPlanDisplayPrice,
  type Cycle,
  type PlanKey,
} from '@/lib/pricing';

// ------------------ Types ------------------
type DisplayPlanKey = PlanKey | 'free';

type PlanRow = {
  key: DisplayPlanKey;
  title: 'Free' | 'Starter' | 'Rocket' | 'Master';
  subtitle: string;
  priceMonthly: number;
  priceAnnual: number;
  features: string[];
  badge?: string;
  mostPopular?: boolean;
  icon: string;
};

type Currency =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'INR'
  | 'PKR'
  | 'AED'
  | 'SAR'
  | 'AUD'
  | 'CAD'
  | 'NGN'
  | 'BRL'
  | 'PHP';

// ------------------ Data ------------------
const PLAN_PRESENTATION: Record<
  DisplayPlanKey,
  Omit<PlanRow, 'key' | 'priceMonthly' | 'priceAnnual'>
> = {
  free: {
    title: 'Free',
    subtitle: 'Try the platform, no card needed',
    features: [
      'Access to all four modules in limited mode',
      'A few AI checks per month',
      'Basic streaks & saved items',
    ],
    icon: 'fa-circle-dollar-to-slot',
  },
  starter: {
    title: 'Starter',
    subtitle: 'Essentials to get moving',
    features: [
      'More AI checks each month across skills',
      'Extra mock attempts with band estimates',
      'Core analytics and study suggestions',
    ],
    icon: 'fa-seedling',
  },
  booster: {
    title: 'Rocket',
    subtitle: 'Best for fast band progress',
    features: [
      'All IELTS modules unlocked',
      'Deeper AI feedback & mock tests',
      'Progress analytics and AI Lab features',
    ],
    badge: 'MOST POPULAR',
    mostPopular: true,
    icon: 'fa-rocket',
  },
  master: {
    title: 'Master',
    subtitle: 'Advanced prep & full-send mode',
    features: [
      'Unlimited mocks across all four modules',
      'Unlimited AI feedback & improvement deltas',
      'Advanced reports, coach tools & streak heatmap',
    ],
    icon: 'fa-feather',
  },
};

const toUsdCents = (major: number) => Math.round(major * 100);

const PLAN_KEYS: readonly DisplayPlanKey[] = ['free', 'starter', 'booster', 'master'];

const PLANS: readonly PlanRow[] = PLAN_KEYS.map((key) => {
  const base = PLAN_PRESENTATION[key];

  if (key === 'free') {
    return {
      key,
      ...base,
      priceMonthly: 0,
      priceAnnual: 0,
    } as const;
  }

  const paidKey = key as PlanKey;
  return {
    key,
    ...base,
    priceMonthly: toUsdCents(getPlanDisplayPrice(paidKey, 'monthly')),
    priceAnnual: toUsdCents(getPlanDisplayPrice(paidKey, 'annual')),
  } as const;
}) as const;

// FX (demo only)
const FX: Record<Currency, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  INR: 84,
  PKR: 280,
  AED: 3.67,
  SAR: 3.75,
  AUD: 1.5,
  CAD: 1.35,
  NGN: 1600,
  BRL: 5.5,
  PHP: 57,
};

const ZERO_DECIMAL: Currency[] = ['PKR', 'INR', 'NGN'];

// ------------------ Helpers ------------------
const guessCurrency = (): Currency => {
  if (typeof window === 'undefined') return 'USD';
  try {
    const loc = Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
    const cc = (loc.split('-')[1] || '').toUpperCase();
    const map: Partial<Record<string, Currency>> = {
      GB: 'GBP',
      IN: 'INR',
      PK: 'PKR',
      AE: 'AED',
      SA: 'SAR',
      AU: 'AUD',
      CA: 'CAD',
      NG: 'NGN',
      BR: 'BRL',
      PH: 'PHP',
      IE: 'EUR',
      DE: 'EUR',
      FR: 'EUR',
      ES: 'EUR',
      IT: 'EUR',
      NL: 'EUR',
      PT: 'EUR',
    };
    return (map[cc] as Currency) || 'USD';
  } catch {
    return 'USD';
  }
};

const formatMoneyFromUsdCents = (usdCents: number, currency: Currency) => {
  const fx = FX[currency] || 1;
  const raw = (usdCents / 100) * fx;
  const maximumFractionDigits = ZERO_DECIMAL.includes(currency) ? 0 : 2;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits,
    }).format(raw);
  } catch {
    const sym: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      INR: '₹',
      PKR: '₨',
      AED: 'د.إ',
      SAR: '﷼',
      AUD: 'A$',
      CAD: 'C$',
      NGN: '₦',
      BRL: 'R$',
      PHP: '₱',
    };
    const s = sym[currency] ?? '$';
    return `${s}${
      ZERO_DECIMAL.includes(currency) ? Math.round(raw) : raw.toFixed(2)
    }`;
  }
};

// ------------------ Components ------------------
type PlanCardProps = {
  plan: PlanRow;
  cycle: Cycle;
  currency: Currency;
  onSelect: (key: DisplayPlanKey) => void;
};

const PlanCard: React.FC<PlanCardProps> = ({ plan, cycle, currency, onSelect }) => {
  const priceCentsUSD =
    cycle === 'monthly' ? plan.priceMonthly : plan.priceAnnual;

  const priceLabel =
    plan.key === 'free'
      ? 'Free'
      : formatMoneyFromUsdCents(priceCentsUSD, currency);

  const periodLabel =
    plan.key === 'free'
      ? 'forever'
      : cycle === 'monthly'
        ? 'per month'
        : 'per month · annual billing';

  const Wrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className,
  }) => (
    <Card
      className={`flex h-full flex-col rounded-2xl border border-border/60 bg-card/90 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${
        className || ''
      }`}
    >
      {children}
    </Card>
  );

  const body = (
    <>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">{plan.title}</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {plan.subtitle}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant={plan.mostPopular ? 'accent' : 'info'} size="sm">
            {plan.mostPopular ? 'Popular' : 'Plan'}
          </Badge>
          {plan.badge && (
            <Ribbon label={plan.badge} variant="accent" position="top-right" />
          )}
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <i className={`fas ${plan.icon}`} aria-hidden="true" />
        </div>
        <div>
          <div className="font-slab text-xl bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
            {priceLabel}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {periodLabel}
          </div>
        </div>
      </div>

      <ul className="mb-4 space-y-1.5 text-[11px] text-muted-foreground">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-[2px] text-primary">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Button
        variant={plan.mostPopular ? 'primary' : plan.key === 'free' ? 'secondary' : 'secondary'}
        className="mt-auto w-full justify-center rounded-ds-2xl text-sm"
        onClick={() => onSelect(plan.key)}
      >
        {plan.key === 'free' ? 'Continue on Free' : `Choose ${plan.title}`}
      </Button>
    </>
  );

  if (plan.mostPopular) {
    return (
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-fuchsia-500 to-cyan-500 p-[1px]">
        <Wrapper className="bg-background">{body}</Wrapper>
      </div>
    );
  }

  if (plan.key === 'free') {
    return (
      <Wrapper className="border-dashed bg-card/80">
        {body}
      </Wrapper>
    );
  }

  return <Wrapper>{body}</Wrapper>;
};

// ------------------ Page ------------------
const PricingPage: NextPage = () => {
  const router = useRouter();
  const referralCode = React.useMemo(
    () => (router.query.code ? String(router.query.code) : undefined),
    [router.query],
  );

  const [cycle, setCycle] = React.useState<Cycle>('monthly');
  const [currency, setCurrency] = React.useState<Currency>('USD');
  const [timezone, setTimezone] = React.useState<string>('—');

  React.useEffect(() => {
    setCurrency(guessCurrency());
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || '—');
    } catch {
      /* noop */
    }
  }, []);

  const handleSelect = React.useCallback(
    (planKey: DisplayPlanKey) => {
      if (planKey === 'free') {
        void router.push('/');
        return;
      }

      const qs = new URLSearchParams();
      qs.set('plan', planKey);
      qs.set('billingCycle', cycle);
      if (referralCode) qs.set('code', referralCode);
      qs.set('currency', currency);
      void router.push(`/checkout?${qs.toString()}`);
    },
    [cycle, referralCode, router, currency],
  );

  return (
    <>
      <Head>
        <title>Pricing — GramorX</title>
        <meta
          name="description"
          content="Pricing for GramorX IELTS — Free, Starter, Rocket, and Master plans."
        />
      </Head>

      <main className="min-h-screen bg-lightBg text-foreground antialiased dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
        <Section id="pricing">
          <Container className="pb-10 pt-6 md:pb-14 md:pt-8">
            {/* Top bar (mobile-friendly) */}
            <div className="mb-4 flex flex-col gap-2 text-[11px] md:flex-row md:items-center md:justify-between">
              <div className="flex items-center justify-between gap-2 md:justify-start">
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/20 text-[10px]">
                    ★
                  </span>
                  4.8 • 12k reviews
                </span>
                <span className="hidden text-muted-foreground sm:inline">
                  Trusted in 90+ countries
                </span>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 md:justify-end">
                <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card/70 px-2.5 py-1">
                  <span className="text-[11px] text-muted-foreground">Currency</span>
                  <select
                    className="bg-transparent text-[11px] outline-none"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as Currency)}
                  >
                    {(Object.keys(FX) as Currency[]).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  TZ: <strong>{timezone}</strong>
                </span>
              </div>
            </div>

            {/* Hero */}
            <header className="space-y-4 text-left">
              <p className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-[11px] text-muted-foreground">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-[10px] text-primary">
                  💳
                </span>
                Free plan available • Cancel anytime
              </p>

              <h1
                id="pricing-title"
                className="font-slab text-2xl leading-tight md:text-3xl"
              >
                <span className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent">
                  Choose your IELTS mission plan
                </span>
              </h1>

              <p className="max-w-xl text-sm text-muted-foreground">
                Free for messing around. Starter to get moving. Rocket for fast progress.
                Master if you&apos;re actually going for 7.5–9.0.
              </p>

              {/* Billing switch */}
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="inline-flex rounded-full border border-border bg-card/80 p-1 shadow-sm"
                  role="tablist"
                  aria-label="Billing cycle"
                >
                  <button
                    type="button"
                    className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                      cycle === 'monthly'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setCycle('monthly')}
                    aria-pressed={cycle === 'monthly'}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    className={`rounded-full px-4 py-1.5 text-xs font-medium transition ${
                      cycle === 'annual'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setCycle('annual')}
                    aria-pressed={cycle === 'annual'}
                  >
                    Annual <span className="ml-1 opacity-80">(~2 months off)</span>
                  </button>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Prices shown in {currency} before tax
                </span>
              </div>
            </header>

            {/* Social proof (single line on mobile) */}
            <div className="mt-5">
              <SocialProofStrip className="mx-auto max-w-full" />
            </div>

            {/* Plans */}
            <section
              id="plans"
              aria-labelledby="plans-heading"
              className="mt-8"
            >
              <div className="mb-3">
                <h2
                  id="plans-heading"
                  className="font-slab text-lg md:text-xl"
                >
                  Plans
                </h2>
                <p className="text-[12px] text-muted-foreground">
                  Start low, upgrade when you decide you&apos;re serious.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {PLANS.map((plan) => (
                  <PlanCard
                    key={plan.key}
                    plan={plan}
                    cycle={cycle}
                    currency={currency}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </section>

            <footer className="mt-8 text-center text-[11px] text-muted-foreground">
              Prices are indicative and may vary by region. Taxes may apply at checkout.
            </footer>
          </Container>
        </Section>
      </main>
    </>
  );
};

export default PricingPage;
