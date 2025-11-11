// lib/usage/checkQuota.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export type QuotaResult = {
  ok: boolean;
  remaining?: number | null;
  reason?: string | null;
  resetAt?: string | null;
};

/**
 * Check per-user quota for a usage key.
 * If the RPC doesn't exist or errors, we **fail-open** (ok: true) so the API never 500s.
 * If you have an RPC named `usage_check(user_id uuid, key text)`, its response
 * should include: { ok boolean, remaining int4|null, reason text|null, reset_at timestamptz|null }.
 */
export async function checkQuota(
  supabase: SupabaseClient,
  userId: string,
  key: string
): Promise<QuotaResult> {
  try {
    const rpc = (supabase as any).rpc?.bind?.(supabase);
    if (rpc) {
      const { data, error } = await rpc('usage_check', { p_user_id: userId, p_key: key });
      if (!error && data && typeof data.ok === 'boolean') {
        return {
          ok: data.ok,
          remaining: data.remaining ?? null,
          reason: data.reason ?? null,
          resetAt: data.reset_at ?? data.resetAt ?? null,
        };
      }
    }
    // No RPC or unexpected shape → allow
    return { ok: true, remaining: null, reason: null, resetAt: null };
  } catch {
    // Transport/service hiccup → allow (you can flip to fail-closed if desired)
    return { ok: true, remaining: null, reason: 'rpc_unavailable', resetAt: null };
  }
}

export default checkQuota;
