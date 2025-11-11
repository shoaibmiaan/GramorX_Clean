// lib/plan/withPlan.ts
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import type { PlanId } from '@/types/pricing';
import { getServerClient } from '@/lib/supabaseServer';
import { resolveUserPlan } from '@/lib/plan/resolveUserPlan';

// Canonical plan rank (free < starter < booster < master)
const PLAN_RANK: Record<PlanId, number> = { free: 0, starter: 1, booster: 2, master: 3 };

// Accepts anything and returns a safe PlanId
function normalizePlan(input: unknown): PlanId {
  // common shapes we’ve seen: "starter", { plan_id: "starter" }, { plan: "starter" }
  const raw =
    (typeof input === 'string' && input) ||
    (input && typeof input === 'object' && ( // @ts-ignore
      (input as any).plan_id || (input as any).plan || (input as any).id || null
    )) ||
    null;

  const v = typeof raw === 'string' ? raw.toLowerCase().trim() : 'free';

  if (v === 'free' || v === 'starter' || v === 'booster' || v === 'master') return v as PlanId;

  // tolerate legacy aliases
  if (v === 'seedling') return 'free';
  if (v === 'rocket') return 'starter';
  if (v === 'owl') return 'booster';

  return 'free';
}

function rank(plan: unknown): number {
  const p = normalizePlan(plan);
  return PLAN_RANK[p];
}

function hasRequiredPlan(userPlan: unknown, required: PlanId) {
  return rank(userPlan) >= PLAN_RANK[required];
}

/**
 * Enforce minimum plan on API routes, with optional role bypass.
 * Usage: export default withPlan('starter', handler, { allowRoles: ['admin','teacher'] })
 */
export function withPlan(
  requiredPlan: PlanId,
  handler: NextApiHandler,
  opts?: { allowRoles?: string[] }
): NextApiHandler {
  const allowRoles = (opts?.allowRoles ?? []).map((r) => r.toLowerCase());

  return async function planWrapped(req: NextApiRequest, res: NextApiResponse) {
    const supabase = getServerClient(req, res);

    // auth
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // role bypass (profiles.role)
    let role: string | undefined;
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      role = (prof?.role as string | undefined)?.toLowerCase();
    } catch {
      /* ignore */
    }
    if (role && allowRoles.includes(role)) {
      return handler(req, res);
    }

    // plan enforcement (normalize whatever resolveUserPlan returns)
    let plan: unknown = 'free';
    try {
      plan = await resolveUserPlan(supabase, user.id);
    } catch {
      plan = 'free';
    }

    if (!hasRequiredPlan(plan, requiredPlan)) {
      return res.status(403).json({ error: 'Plan required', need: requiredPlan, have: normalizePlan(plan) });
    }

    return handler(req, res);
  };
}

export default withPlan;
