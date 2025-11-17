import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { NextPage } from 'next';

import { Container } from '@/components/design-system/Container';
import { Section } from '@/components/design-system/Section';
import { Card } from '@/components/design-system/Card';
import { Ribbon } from '@/components/design-system/Ribbon';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import SocialProofStrip from '@/components/marketing/SocialProofStrip';
import QuotaSummary from '@/components/paywall/QuotaSummary';
import {
  getPlanDisplayPrice,
  type Cycle,
  type PlanKey,
} from '@/lib/pricing';
import type { Reason } from '@/lib/paywall/redirect';

// ------------------ Types ------------------
type PlanRow = {
  key: PlanKey;
  title: 'Free' | 'Starter' | 'Rocket' | 'Master';
  subtitle: string;
  priceMonthly: number; // cents (USD)
  priceAnnual: number; // cents (USD, per month when billed annually)
  features: string[];
  badge?: string;
  mostPopular?: boolean;
  icon: string; // fontawesome key
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
  PlanKey,
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

// Order of cards on page
const PLAN_KEYS: readonly PlanKey[] = ['free', 'starter', 'booster', 'master'];

const PLANS: readonly PlanRow[] = PLAN_KEYS.map((key) => ({
  key,
  ...PLAN_PRESENTATION[key],
  priceMonthly: toUsdCents(getPlanDisplayPrice(key, 'monthly')),
  priceAnnual: toUsdCents(getPlanDisplayPrice(key, 'annual')),
})) as const;

// Simple demo FX rates relative to USD. Replace with live rates from your backend/payments provider.
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
  const raw = (usdCents / 100) * fx; // base is USD per-month
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

  // --- Reason banner (e.g., quota reached) ---
  const reason: Reason =
    typeof router.query.reason === 'string'
      ? (router.query.reason as Reason)
      : 'unknown';
  const need: PlanKey | null =
    typeof router.query.need === 'string'
      ? (router.query.need as PlanKey)
      : null;
  const from: string =
    typeof router.query.from === 'string' ? router.query.from : '/';
  const qk: string | null =
    typeof router.query.qk === 'string' ? router.query.qk : null;

  React.useEffect(() => {
    setCurrency(guessCurrency());
    try {
      setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || '—');
    } catch {
      /* noop */
    }
  }, []);

  const handleSelect = React.useCallback(
    (planKey: PlanKey) => {
      const qs = new URLSearchParams();
      qs.set('plan', planKey);
      qs.set('billingCycle', cycle);
      if (referralCode) qs.set('code', referralCode);
      qs.set('currency', currency);
      void router.push(`/checkout?${qs.toString()}`);
    },
    [cycle, referralCode, router, currency],
  );

  const getBanner = () => {
    if (reason === 'unknown') return null;

    let message = '';
    const backPath = from;
    const featureLabel = qk ? qk.replace(/_/g, ' ') : 'this feature';

    switch (reason) {
      case 'plan_required':
        message = `This feature requires the ${need || 'higher'} plan or higher.`;
        break;
      case 'quota_limit':
        message = `You've reached your quota for ${featureLabel}. Try again tomorrow or upgrade to increase your limits.`;
        break;
      case 'trial_ended':
        message = 'Your trial has ended. Upgrade to continue.';
        break;
      default:
        return null;
    }

    return (
      <div
        className="mx-auto mb-4 max-w-4xl rounded-2xl border border-amber-400/50 bg-amber-100/70 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <strong>{message}</strong>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link
              href={backPath}
              className="inline-flex items-center justify-center rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-sm underline-offset-4 hover:underline"
            >
              Back
            </Link>
            <Link
              href="#plans"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-95"
            >
              See plans
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Head>
        <title>Pricing — GramorX</title>
        <meta
          name="description"
          content="Global pricing for GramorX IELTS — Free, Starter, Rocket, and Master plans with AI-powered IELTS prep."
        />
      </Head>

      {/* MAIN landmark */}
      <main
        role="main"
        className="min-h-screen bg-lightBg text-foreground antialiased dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90"
      >
        <Section id="pricing">
          <Container
            className="pb-12 pt-6 md:pb-16 md:pt-8"
            aria-labelledby="pricing-title"
          >
            {/* Context banner (from redirects with query params) */}
            {getBanner()}

            {/* Quota Summary if applicable */}
            {reason === 'quota_limit' && <QuotaSummary qk={qk} />}

            {/* Top utility bar */}
            <div className="mx-auto mb-4 flex max-w-7xl items-center justify-between gap-3 text-small">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-indigo-600/10 px-2.5 py-1 font-medium text-indigo-700 dark:text-indigo-300">
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896l-7.336 3.869 1.402-8.168L.132 9.21l8.2-1.192L12 .587z" />
                  </svg>
                  4.8★ • 12k reviews
                </span>
                <span className="hidden text-muted-foreground md:inline">
                  Trusted by learners in 90+ countries
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="currency" className="sr-only">
                  Currency
                </label>
                <div className="inline-flex items-center gap-2 rounded-lg border border-border bg-card/60 px-2 py-1 backdrop-blur supports-[backdrop-filter]:bg-card/40">
                  <span className="text-muted-foreground">Currency</span>
                  <select
                    id="currency"
                    className="bg-transparent outline-none"
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
              </div>
            </div>

            {/* Hero */}
            <header className="mx-auto text-center max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[11px] text-muted-foreground md:text-caption backdrop-blur supports-[backdrop-filter]:bg-card/40">
                Free tier available • Cancel anytime
              </p>

              <h1
                id="pricing-title"
                className="mt-3 text-balance text-display font-semibold leading-tight md:mt-3 md:text-displayLg"
              >
                <span className="bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
                  Choose your IELTS mission plan
                </span>
              </h1>

              <p className="mt-2 text-small text-muted-foreground text-pretty md:text-body">
                Free gives you a taste. Starter adds more checks and mocks. Rocket (Booster)
                is for serious progress. Master is for full-send, 7.5–9.0 prep.
              </p>
              <div className="mt-2 text-caption text-muted-foreground">
                Local timezone: <strong>{timezone}</strong>
              </div>
            </header>

            <div className="mx-auto mt-6">
              <SocialProofStrip className="mx-auto" />
            </div>

            {/* Billing cycle + copy */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <div
                className="flex rounded-full border border-border bg-card p-1"
                role="tablist"
                aria-label="Billing cycle"
              >
                <button
                  type="button"
                  className={`rounded-full px-4 py-1.5 text-small transition ${
                    cycle === 'monthly'
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setCycle('monthly')}
                  aria-pressed={cycle === 'monthly'}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  className={`rounded-full px-4 py-1.5 text-small transition ${
                    cycle === 'annual'
                      ? 'bg-primary text-white'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  onClick={() => setCycle('annual')}
                  aria-pressed={cycle === 'annual'}
                >
                  Annual <span className="ml-1 opacity-80">(save ~2 months)</span>
                </button>
              </div>
              <span className="text-caption text-muted-foreground">
                Prices shown in {currency} before tax
              </span>
            </div>

            {/* Plans grid */}
            <section
              id="plans"
              aria-labelledby="plans-heading"
              className="mt-6 md:mt-8"
            >
              <h2 id="plans-heading" className="sr-only">
                Plans and pricing options
              </h2>

              <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {PLANS.map((p) => {
                  const priceCentsUSD =
                    cycle === 'monthly' ? p.priceMonthly : p.priceAnnual;
                  const priceLabel = formatMoneyFromUsdCents(
                    priceCentsUSD,
                    currency,
                  );
                  const periodLabel =
                    p.key === 'free'
                      ? 'forever (no card required)'
                      : cycle === 'monthly'
                        ? 'per month'
                        : 'per month (billed annually)';

                  const CardShell: React.FC<{
                    children: React.ReactNode;
                    className?: string;
                  }> = ({ children, className }) => (
                    <Card
                      className={`relative rounded-2xl p-7 transition hover:-translate-y-2 hover:shadow-xl ${
                        p.mostPopular ? 'ring-1 ring-fuchsia-400/40' : ''
                      } ${className || ''}`}
                    >
                      {children}
                    </Card>
                  );

                  const Inner = (
                    <>
                      <Badge
                        variant={p.mostPopular ? 'accent' : 'info'}
                        size="sm"
                        className="absolute right-4 top-4"
                      >
                        {p.mostPopular ? 'FEATURED' : 'STANDARD'}
                      </Badge>

                      {p.badge && (
                        <Ribbon
                          label={p.badge}
                          variant="accent"
                          position="top-right"
                        />
                      )}

                      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 text-white text-h2">
                        <i className={`fas ${p.icon}`} aria-hidden="true" />
                        <span className="sr-only">{p.title} icon</span>
                      </div>

                      <h3 className="mb-1 flex items-center gap-2 text-h3 font-semibold">
                        <i
                          className="fas fa-circle-check text-success"
                          aria-hidden="true"
                        />
                        {p.title}
                      </h3>
                      <p className="mb-3 text-small text-muted-foreground">
                        {p.subtitle}
                      </p>

                      <div className="mb-4">
                        <div className="font-slab text-displayLg leading-none bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-cyan-500 bg-clip-text text-transparent">
                          {p.key === 'free' ? 'Free' : priceLabel}
                        </div>
                        <div className="mt-1 text-muted-foreground">
                          {periodLabel}
                        </div>
                      </div>

                      <ul className="mt-2">
                        {p.features.map((f) => (
                          <li
                            key={f}
                            className="relative border-b border-dashed border-purple-400/20 py-2 pl-6 text-muted-foreground"
                          >
                            <span
                              className="absolute left-0 top-2 font-bold text-success"
                              aria-hidden="true"
                            >
                              ✓
                            </span>
                            {f}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-4 grid gap-3">
                        <Button
                          variant={
                            p.mostPopular
                              ? 'primary'
                              : p.key === 'free'
                                ? 'secondary'
                                : 'secondary'
                          }
                          className="w-full justify-center"
                          onClick={() => handleSelect(p.key)}
                          aria-label={`Choose ${p.title} plan (${cycle})`}
                        >
                          {p.key === 'free'
                            ? 'Stay on Free'
                            : `Choose ${p.title}`}
                        </Button>
                        {p.key !== 'free' && (
                          <Link
                            href="/waitlist"
                            className="text-center text-small text-cyan-700 underline decoration-2 underline-offset-4 hover:opacity-90"
                          >
                            Not ready? Join the pre-launch list
                          </Link>
                        )}
                      </div>
                    </>
                  );

                  if (p.mostPopular) {
                    return (
                      <div
                        key={p.key}
                        className="rounded-2xl bg-gradient-to-br from-indigo-600 via-fuchsia-500 to-cyan-500 p-[1px]"
                      >
                        <CardShell className="bg-background">{Inner}</CardShell>
                      </div>
                    );
                  }

                  return <CardShell key={p.key}>{Inner}</CardShell>;
                })}
              </div>
            </section>

            {/* Extras / Support */}
            <section
              aria-labelledby="extras-heading"
              className="mt-10 grid gap-6 md:grid-cols-3"
            >
              <h2 id="extras-heading" className="sr-only">
                Included features and helpful links
              </h2>

              <Card className="rounded-2xl p-6 md:p-7">
                <h3 className="text-h4 font-medium">All plans include</h3>
                <ul className="mt-3 list-none space-y-2 text-small text-muted-foreground">
                  <li>Four IELTS modules in one workspace</li>
                  <li>Study calendar & streak tracking</li>
                  <li>Dark/Light UI • Fully responsive</li>
                </ul>
              </Card>

              <Card className="rounded-2xl p-6 md:p-7">
                <h3 className="text-h4 font-medium">Need a discount?</h3>
                <p className="mt-2 text-small text-muted-foreground">
                  Have a referral code? You can apply it at checkout.
                </p>

                <Button
                  variant="primary"
                  className="mt-3 w-full justify-center"
                  onClick={() => {
                    const qs = new URLSearchParams();
                    qs.set('plan', 'booster');
                    qs.set('billingCycle', cycle);
                    qs.set('currency', currency);
                    if (referralCode) qs.set('code', referralCode);
                    void router.push(`/checkout?${qs.toString()}`);
                  }}
                  aria-label={`Continue to checkout with Rocket (${cycle})`}
                >
                  Continue to checkout
                </Button>

                <p className="mt-2 text-caption text-muted-foreground">
                  Or{' '}
                  <Link
                    href="/account/referrals"
                    className="underline decoration-2 underline-offset-4 hover:opacity-90"
                  >
                    generate your own code
                  </Link>
                  .
                </p>
              </Card>

              <Card className="rounded-2xl p-6 md:p-7">
                <h3 className="text-h4 font-medium">Questions?</h3>
                <ul className="mt-3 list-none space-y-2 text-small text-muted-foreground">
                  <li>
                    <Link
                      href="/legal/terms"
                      className="underline decoration-2 underline-offset-4 hover:opacity-90"
                    >
                      Billing & refunds
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/legal/privacy"
                      className="underline decoration-2 underline-offset-4 hover:opacity-90"
                    >
                      Privacy & data
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/contact"
                      className="underline decoration-2 underline-offset-4 hover:opacity-90"
                    >
                      Contact support
                    </Link>
                  </li>
                </ul>
              </Card>
            </section>

            <footer className="mt-8 text-center text-small text-muted-foreground md:mt-10">
              Prices shown are indicative; taxes may apply at checkout.
            </footer>
          </Container>
        </Section>
      </main>
    </>
  );
};

export default PricingPage;
