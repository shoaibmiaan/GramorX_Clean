// lib/pricing.ts
// Canonical pricing + plan metadata for GramorX

export type PlanKey = 'starter' | 'booster' | 'master';
export type PlanId = 'free' | PlanKey;
export type Cycle = 'monthly' | 'annual';

type PlanPrice = {
  /** Amount billed each month for the monthly cycle (in major units). */
  monthly: number;
  /** Total amount billed upfront for the annual cycle (in major units). */
  annual: number;
};

/**
 * Canonical USD pricing for all paid plans.
 *  - `monthly` is the amount a customer pays for one month.
 *  - `annual` is the full upfront charge for one year
 *    (should be ≈ 12 × the per-month *display* value, with discount baked in).
 */
export const USD_PLAN_PRICES: Record<PlanKey, PlanPrice> = {
  starter: { monthly: 9, annual: 96 },   // ≈ $8/mo effective
  booster: { monthly: 19, annual: 192 }, // ≈ $16/mo effective
  master: { monthly: 29, annual: 288 },  // ≈ $24/mo effective
};

export const DEFAULT_CURRENCY = 'USD';
export const CURRENCY_SYMBOL = '$';

export type PlanDefinition = {
  id: PlanId;
  label: string;
  description: string;
  order: number;
  isPaid: boolean;
  highlight?: boolean;
  badge?: string;
};

const PLAN_LIST: PlanDefinition[] = [
  {
    id: 'free',
    label: 'Free',
    description: 'Try core IELTS tools with limited mocks & AI feedback.',
    order: 0,
    isPaid: false,
    badge: 'Start here',
  },
  {
    id: 'starter',
    label: 'Starter',
    description: 'Serious prep for one module with AI insights.',
    order: 1,
    isPaid: true,
  },
  {
    id: 'booster',
    label: 'Booster',
    description: 'Full IELTS coverage with rich analytics.',
    order: 2,
    isPaid: true,
    highlight: true,
    badge: 'Most popular',
  },
  {
    id: 'master',
    label: 'Master',
    description: 'All-access IELTS mission control, max AI usage.',
    order: 3,
    isPaid: true,
  },
];

/**
 * Object lookup by plan id, so `PLANS['starter']` works.
 */
export const PLANS: Record<PlanId, PlanDefinition> = PLAN_LIST.reduce(
  (acc, plan) => {
    acc[plan.id] = plan;
    return acc;
  },
  {} as Record<PlanId, PlanDefinition>,
);

/**
 * Ordered list (use for rendering cards in UI).
 */
export const ORDERED_PLANS: PlanDefinition[] = [...PLAN_LIST].sort(
  (a, b) => a.order - b.order,
);

/**
 * Human label for a plan id.
 */
export const PLAN_LABEL: Record<PlanId, string> = {
  free: 'Free',
  starter: 'Starter',
  booster: 'Booster',
  master: 'Master',
};

/**
 * Display price per *month* (for showing “$X/mo”), not necessarily
 * the actual amount charged in one transaction.
 */
export const getPlanDisplayPrice = (plan: PlanId, cycle: Cycle): number => {
  if (plan === 'free') return 0;

  const base = USD_PLAN_PRICES[plan];
  return cycle === 'monthly' ? base.monthly : base.annual / 12;
};

/**
 * Actual billing amount for the transaction:
 *  - monthly  → one month
 *  - annual   → full year upfront
 */
export const getPlanBillingAmount = (plan: PlanId, cycle: Cycle): number => {
  if (plan === 'free') return 0;

  const base = USD_PLAN_PRICES[plan];
  return cycle === 'monthly' ? base.monthly : base.annual;
};
