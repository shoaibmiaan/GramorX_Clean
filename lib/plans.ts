import type { SupabaseClient } from '@supabase/supabase-js';

export type PlanTier = 'free' | 'basic' | 'pro' | 'elite';
export type PlanInput =
  | PlanTier
  | 'starter'
  | 'booster'
  | 'master'
  | 'seedling'
  | 'rocket'
  | 'owl'
  | string
  | null
  | undefined;

const RANK: Record<PlanTier, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  elite: 3,
};

const ALIASES: Record<string, PlanTier> = {
  free: 'free',
  basic: 'basic',
  pro: 'pro',
  elite: 'elite',
  starter: 'basic',
  seedling: 'basic',
  booster: 'pro',
  rocket: 'pro',
  master: 'elite',
  owl: 'elite',
};

export function mapPlanIdToTier(plan: PlanInput): PlanTier {
  if (!plan || typeof plan !== 'string') return 'free';
  const key = plan.toLowerCase();
  return ALIASES[key] ?? 'free';
}

export function planRank(plan: PlanInput): number {
  return RANK[mapPlanIdToTier(plan)];
}

export function hasAtLeast(current: PlanInput, required: PlanInput): boolean {
  return planRank(current) >= planRank(required);
}

export type PlanSnapshot = { tier: PlanTier; hasAtLeast: (tier: PlanInput) => boolean };

export async function resolveUserTier(
  supabase: SupabaseClient,
  userId: string,
): Promise<PlanTier> {
  try {
    const { data } = await supabase
      .from('v_latest_subscription_per_user')
      .select('plan_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (data?.plan_id) {
      return mapPlanIdToTier(data.plan_id as string);
    }
  } catch {
    // ignore and fall through
  }

  try {
    const { data } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', userId)
      .maybeSingle();

    if (data?.tier) {
      return mapPlanIdToTier(data.tier as string);
    }
  } catch {
    // ignore and fall through
  }

  return 'free';
}
