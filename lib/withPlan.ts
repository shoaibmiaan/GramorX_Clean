import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import { hasAtLeast, mapPlanIdToTier, resolveUserTier, type PlanInput, type PlanTier } from '@/lib/plans';

export type WithPlanContext = { tier: PlanTier; hasAtLeast: (tier: PlanInput) => boolean };
export type WithPlanOptions = {
  allowRoles?: string[];
  onPlanFailure?: (args: {
    apiRoute: boolean;
    req: NextApiRequest | GetServerSidePropsContext['req'];
    res: NextApiResponse | GetServerSidePropsContext['res'] | undefined;
    required: PlanTier;
    current: PlanTier;
  }) => any;
};

const DEFAULT_REDIRECT = '/pricing';

async function fetchRole(supabase: ReturnType<typeof getServerClient>, userId: string): Promise<string | null> {
  try {
    const { data } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    const role = (data?.role as string | null) ?? null;
    return role ? role.toLowerCase() : null;
  } catch {
    return null;
  }
}

function buildContext(tier: PlanTier): WithPlanContext {
  return {
    tier,
    hasAtLeast: (required) => hasAtLeast(tier, mapPlanIdToTier(required)),
  };
}

async function ensureAuth(
  supabase: ReturnType<typeof getServerClient>,
): Promise<{ userId: string; role: string | null; tier: PlanTier } | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const [tier, role] = await Promise.all([
    resolveUserTier(supabase, user.id),
    fetchRole(supabase, user.id),
  ]);

  return { userId: user.id, role, tier };
}

function handlePlanFailure(
  isApi: boolean,
  req: NextApiRequest | GetServerSidePropsContext['req'] | undefined,
  res: NextApiResponse | undefined,
  required: PlanTier,
  current: PlanTier,
  options?: WithPlanOptions,
) {
  if (options?.onPlanFailure) {
    return options.onPlanFailure({ apiRoute: isApi, req: req as any, res, required, current });
  }

  if (isApi && res) {
    res.status(402).json({ error: 'Plan required', required, current, upgradeUrl: DEFAULT_REDIRECT });
    return null;
  }

  const redirect = `${DEFAULT_REDIRECT}?required=${required}`;
  return { redirect: { destination: redirect, permanent: false } } as const;
}

function handleAuthFailure(isApi: boolean, res: NextApiResponse | undefined) {
  if (isApi && res) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  return { redirect: { destination: '/login', permanent: false } } as const;
}

function isApiRoute(args: unknown[]): args is [NextApiRequest, NextApiResponse] {
  return args.length >= 2 && typeof (args[0] as NextApiRequest)?.method === 'string';
}

export function withPlan(required: PlanInput, handler?: any, options: WithPlanOptions = {}): any {
  const requiredTier = mapPlanIdToTier(required);
  const allowedRoles = (options.allowRoles ?? []).map((r) => r.toLowerCase());

  const wrap = (fn: any): NextApiHandler | GetServerSideProps => {
    return async (...args: any[]) => {
      const apiRoute = isApiRoute(args);
      const req = apiRoute ? (args[0] as NextApiRequest) : (args[0] as GetServerSidePropsContext)?.req;
      const res = apiRoute ? (args[1] as NextApiResponse) : (args[0] as GetServerSidePropsContext)?.res;
      const supabase = getServerClient(req as any, res as any);

      const auth = await ensureAuth(supabase);
      if (!auth) {
        return handleAuthFailure(apiRoute, res);
      }

      const ctx = buildContext(auth.tier);

      if (auth.role && allowedRoles.includes(auth.role)) {
        return apiRoute ? fn(args[0], args[1], ctx) : fn(args[0], ctx);
      }

      if (!ctx.hasAtLeast(requiredTier)) {
        return handlePlanFailure(
          apiRoute,
          req as NextApiRequest,
          res as NextApiResponse | undefined,
          requiredTier,
          auth.tier,
          options,
        );
      }

      return apiRoute ? fn(args[0], args[1], ctx) : fn(args[0], ctx);
    };
  };

  if (handler) return wrap(handler);
  return (fn: any, override?: WithPlanOptions) => withPlan(requiredTier, fn, override ?? options);
}

export default withPlan;
