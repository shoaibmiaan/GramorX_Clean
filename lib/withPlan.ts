// lib/withPlan.ts
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { getServerClient } from '@/lib/supabaseServer';
import type { PlanId } from '@/types/pricing';
import { evaluateQuota, upgradeAdvice, getUtcDayWindow, type QuotaKey } from '@/lib/plan/quotas';

export type PlanGuardContext = {
  supabase: ReturnType<typeof getServerClient>;
  user: { id: string; email?: string | null };
  plan: PlanId;
};

type Options = {
  allowRoles?: string[];
  killSwitchFlag?: string;
  /** Optional quota guard (evaluated before handler) */
  quota?: {
    key: QuotaKey;
    /** How many units this call would consume (default 1) */
    amount?: number;
    /**
     * Count function that returns "used today".
     * Kept generic to avoid coupling with specific tables.
     */
    getUsedToday?: (ctx: PlanGuardContext) => Promise<number>;
  };
};

async function resolvePlanId(supabase: ReturnType<typeof getServerClient>, userId: string): Promise<PlanId> {
  // Try common locations; fall back to 'starter'
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('plan_id')
      .eq('user_id', userId)
      .maybeSingle();
    if (!error && data?.plan_id) return data.plan_id as PlanId;
  } catch { /* ignore */ }
  return 'starter' as PlanId;
}

export function withPlan<T extends (req: NextApiRequest, res: NextApiResponse, ctx: PlanGuardContext) => any>(
  _minPlan: PlanId,
  handler: T,
  options: Options = {}
) {
  const wrapped: NextApiHandler = async (req, res) => {
    const supabase = getServerClient(req, res);
    const { data: auth, error: authErr } = await supabase.auth.getUser();
    if (authErr || !auth?.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const ctx: PlanGuardContext = {
      supabase,
      user: { id: auth.user.id, email: auth.user.email ?? null },
      plan: await resolvePlanId(supabase, auth.user.id),
    };

    // Optional role check
    if (options.allowRoles?.length) {
      try {
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', ctx.user.id)
          .maybeSingle();
        const role = roleRow?.role as string | undefined;
        if (role && !options.allowRoles.includes(role)) {
          res.status(403).json({ error: 'Forbidden' });
          return;
        }
      } catch { /* non-fatal */ }
    }

    // Optional quota guard
    if (options.quota) {
      const { key, amount = 1, getUsedToday } = options.quota;
      let used = 0;
      try {
        used = getUsedToday ? await getUsedToday(ctx) : 0;
      } catch {
        // If counting fails, do not block — treat as 0 used
        used = 0;
      }

      const snap = evaluateQuota(ctx.plan, key, used);
      if (!snap.isUnlimited && snap.remaining < amount) {
        const advice = upgradeAdvice(ctx.plan, key, used);
        res.status(402).json({
          error: 'Quota exceeded',
          quota: { key, limit: snap.limit, used: snap.used, remaining: snap.remaining },
          advice,
        });
        return;
      }
    }

    return handler(req, res, ctx);
  };

  return wrapped;
}