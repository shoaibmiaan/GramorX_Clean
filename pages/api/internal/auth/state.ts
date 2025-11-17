// pages/api/internal/auth/state.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerClient } from '@/lib/supabaseServer';

type AuthState =
  | {
      authenticated: false;
    }
  | {
      authenticated: true;
      userId: string;
      role: string | null;
      onboardingComplete: boolean;
    };

type ErrorResponse = { error: string };

type Response = AuthState | ErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Response>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // No caching – this is per-user, per-request state
  res.setHeader('Cache-Control', 'private, no-store');

  const supabase = getServerClient(req, res);

  // --- 1) Get authenticated user in a SAFE way ---
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    // Do NOT 500 here – just treat as unauthenticated, or you'll hard-break the UI.
    console.error('[auth/state] getUser error:', userError);
    return res.status(200).json({ authenticated: false });
  }

  if (!user) {
    // Not logged in
    return res.status(200).json({ authenticated: false });
  }

  // --- 2) Try to load profile (non-fatal if it fails) ---
  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from('profiles')
    .select('role,onboarding_complete')
    .eq('user_id', user.id) // keep it simple + RLS friendly
    .maybeSingle();

  if (profileError) {
    console.error('[auth/state] profile error:', profileError);
  }

  const role =
    (profile as { role?: string | null } | null)?.role ??
    (user.app_metadata?.role as string | undefined) ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((user.user_metadata as any)?.role as string | undefined) ??
    null;

  const userMeta = (user.user_metadata ?? {}) as Record<string, unknown>;

  const onboardingComplete =
    profile?.onboarding_complete === true ||
    userMeta.onboarding_complete === true;

  return res.status(200).json({
    authenticated: true,
    userId: user.id,
    role,
    onboardingComplete,
  });
}
