// lib/pricing.ts
// Canonical plan IDs, labels, and pricing helpers for the whole app.

export type PlanKey = 'starter' | 'booster' | 'master';
export type PlanId = 'free' | PlanKey;
export type Cycle = 'monthly' | 'annual';

// Enum-style object so existing imports keep working
export const PlanIdEnum = {
  Free: 'free',
  Starter: 'starter',
  Booster: 'booster',
  Master: 'master',
} as const;

// Convenient array for ordering in UI
export const PLAN_ORDER: PlanId[] = [
  PlanIdEnum.Free,
  PlanIdEnum.Starter,
  PlanIdEnum.Booster,
  PlanIdEnum.Master,
];

type PlanPrice = {
  /** Amount billed each month for the monthly cycle (in major units). */
  monthly: number;
  /** Total amount billed upfront for the annual cycle (in major units). */
  annual: number;
};

/**
 * Canonical USD pricing for all paid plans.
 *  - `monthly` is the amount a customer pays for one month.
 *  - `annual` is the full upfront charge for one year.
 */
export const USD_PLAN_PRICES: Record<PlanKey, PlanPrice> = {
  starter: { monthly: 9, annual: 96 },
  booster: { monthly: 19, annual: 192 },
  master: { monthly: 39, annual: 384 },
};

/**
 * Nice labels for each plan ID.
 */
export const PLAN_LABEL: Record<PlanId, string> = {
  [PlanIdEnum.Free]: 'Free',
  [PlanIdEnum.Starter]: 'Starter',
  [PlanIdEnum.Booster]: 'Booster',
  [PlanIdEnum.Master]: 'Master',
};

/**
 * Short taglines if you need them in UI.
 */
export const PLAN_TAGLINE: Record<PlanId, string> = {
  [PlanIdEnum.Free]: 'Try the basics',
  [PlanIdEnum.Starter]: 'Lock in one module',
  [PlanIdEnum.Booster]: 'All 4 core modules',
  [PlanIdEnum.Master]: 'Everything, maxed out',
};

/**
 * Returns the *display* price per month (even for annual plans we normalize).
 * Handles "free" safely so it doesn’t crash if someone passes it in.
 */
export const getPlanDisplayPrice = (plan: PlanId, cycle: Cycle): number => {
  if (plan === PlanIdEnum.Free) return 0;

  const key = plan as PlanKey;
  const config = USD_PLAN_PRICES[key];

  if (!config) {
    // Fails safe instead of blowing up with "undefined.monthly"
    return 0;
  }

  return cycle === 'monthly' ? config.monthly : config.annual / 12;
};

/**
 * Returns the *billing* amount that will actually be charged.
 * For monthly → one month
 * For annual → full annual lump sum
 */
export const getPlanBillingAmount = (plan: PlanId, cycle: Cycle): number => {
  if (plan === PlanIdEnum.Free) return 0;

  const key = plan as PlanKey;
  const config = USD_PLAN_PRICES[key];

  if (!config) {
    return 0;
  }

  return cycle === 'monthly' ? config.monthly : config.annual;
};
