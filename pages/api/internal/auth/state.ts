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

function isNetworkError(err: unknown): boolean {
  const anyErr = err as { message?: string; code?: string; cause?: { code?: string } } | null;
  const message = (anyErr?.message ?? '').toLowerCase();
  const code = anyErr?.cause?.code ?? anyErr?.code ?? '';

  return (
    code === 'UND_ERR_CONNECT_TIMEOUT' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN' ||
    message.includes('fetch failed') ||
    message.includes('connect timeout')
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Response>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'private, no-store');

  try {
    const supabase = getServerClient(req, res);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // If Supabase responded but with an auth error, don’t 500-loop the UI.
    // Treat as signed out.
    if (userError) {
      // If it's actually a network error, mark offline via header and return authenticated:false
      if (isNetworkError(userError)) {
        res.setHeader('X-GramorX-Auth-State', 'offline');
        return res.status(200).json({ authenticated: false });
      }

      return res.status(200).json({ authenticated: false });
    }

    if (!user) {
      return res.status(200).json({ authenticated: false });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role,onboarding_complete')
      .or(`user_id.eq.${user.id},id.eq.${user.id}`)
      .maybeSingle();

    const role =
      (profile as { role?: string | null } | null)?.role ??
      (user.app_metadata?.role as string | undefined) ??
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((user.user_metadata as any)?.role as string | undefined) ??
      null;

    const onboardingComplete =
      profile?.onboarding_complete === true ||
      (user.user_metadata as Record<string, unknown> | undefined)?.onboarding_complete === true;

    return res.status(200).json({
      authenticated: true,
      userId: user.id,
      role,
      onboardingComplete,
    });
  } catch (err) {
    // Network/offline: never return 500 here (it causes infinite refresh loops)
    if (isNetworkError(err)) {
      res.setHeader('X-GramorX-Auth-State', 'offline');
      return res.status(200).json({ authenticated: false });
    }

    return res.status(200).json({ authenticated: false });
  }
}
