// pages/api/internal/auth/state.ts

import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import type { PlanId } from '@/lib/pricing';
import { PlanIdEnum } from '@/lib/pricing';

type AuthStateUnauthenticated = {
  authenticated: false;
};

type AuthStateAuthenticated = {
  authenticated: true;
  userId: string;
  role: string | null;
  onboardingComplete: boolean;
  planId: PlanId;
};

type AuthState = AuthStateUnauthenticated | AuthStateAuthenticated;

type ErrorResponse = { error: string };

type Response = AuthState | ErrorResponse;

// Runtime guard so we never leak weird plan ids
const normalizePlanId = (raw: unknown): PlanId => {
  if (raw === PlanIdEnum.Starter) return PlanIdEnum.Starter;
  if (raw === PlanIdEnum.Booster) return PlanIdEnum.Booster;
  if (raw === PlanIdEnum.Master) return PlanIdEnum.Master;
  // Anything unknown falls back to free
  return PlanIdEnum.Free;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // No caching of auth state
  res.setHeader('Cache-Control', 'private, no-store');

  const supabase = getServerClient(req, res);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return res.status(500).json({ error: userError.message });
  }

  if (!user) {
    const unauth: AuthStateUnauthenticated = { authenticated: false };
    return res.status(200).json(unauth);
  }

  // Profile: role + onboarding
  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return res.status(500).json({ error: profileError.message });
  }

  // Subscription / plan: from view v_latest_subscription_per_user
  const {
    data: subscriptionRow,
    error: subscriptionError,
  } = await supabase
    .from('v_latest_subscription_per_user')
    .select('plan_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (subscriptionError && subscriptionError.code !== 'PGRST116') {
    // PGRST116 = no rows; anything else is a real error
    return res.status(500).json({ error: subscriptionError.message });
  }

  const rawPlanId = subscriptionRow?.plan_id ?? PlanIdEnum.Free;
  const planId = normalizePlanId(rawPlanId);

  const payload: AuthStateAuthenticated = {
    authenticated: true,
    userId: user.id,
    role: profile?.role ?? null,
    onboardingComplete: Boolean(profile?.onboarding_complete),
    planId,
  };

  return res.status(200).json(payload);
}
