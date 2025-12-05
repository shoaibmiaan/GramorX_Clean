import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseServer } from '@/lib/supabaseServer';
import { computeStreakUpdate, syncStreak } from '@/lib/streaks';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type StreakData = {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null; // YYYY-MM-DD
  next_restart_date: string | null; // not persisted on 'user_streaks' table
  shields: number; // not persisted on 'user_streaks' table
};

const getTimezone = (req: NextApiRequest): string => {
  const queryTz = Array.isArray(req.query.tz) ? req.query.tz[0] : req.query.tz;
  const headerTz = Array.isArray(req.headers['x-user-timezone'])
    ? req.headers['x-user-timezone'][0]
    : req.headers['x-user-timezone'];
  return (typeof queryTz === 'string' && queryTz) || (typeof headerTz === 'string' && headerTz) || 'UTC';
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let token = req.headers.authorization?.split(' ')[1] ?? null;
  let refreshToken: string | null = null;

  if (!token) {
    try {
      const cookieClient = supabaseServer(req);
      const { data, error } = await cookieClient.auth.getSession();
      if (error) {
        console.error('[API/streak] Cookie session lookup failed:', error);
      }
      token = data?.session?.access_token ?? null;
      refreshToken = data?.session?.refresh_token ?? null;
    } catch (error) {
      console.error('[API/streak] Cookie session client unavailable:', error);
    }
  }

  if (!token) return res.status(401).json({ error: 'No authorization token' });

  // RLS client (acts as the user)
  let supabaseUser: SupabaseClient;
  try {
    supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch (error) {
    console.error('[API/streak] User client creation failed:', error);
    return res.status(503).json({ error: 'service_unavailable' });
  }

  try {
    await supabaseUser.auth.setSession({
      access_token: token,
      refresh_token: refreshToken ?? '',
    });
  } catch (error) {
    console.error('[API/streak] User session setup failed:', error);
    return res.status(503).json({ error: 'service_unavailable' });
  }

  let user = null;
  try {
    const { data: { user: authUser }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !authUser) return res.status(401).json({ error: 'Invalid token' });
    user = authUser;
  } catch (error) {
    console.error('[API/streak] Auth verification failed:', error);
    return res.status(503).json({ error: 'auth_unavailable' });
  }

  const timezone = getTimezone(req);

  try {
    const { data: fetchedRow, error: fetchError } = await supabaseUser
      .from('user_streaks')
      .select('current_streak, last_activity_date')
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

    let row = fetchedRow ?? null;

    let shieldTokens = 0;
    try {
      const { data: shieldRow } = await supabaseUser
        .from('streak_shields')
        .select('tokens')
        .eq('user_id', user.id)
        .maybeSingle();
      shieldTokens = shieldRow?.tokens ?? 0;
    } catch (shieldErr) {
      console.warn('[API/streak] Unable to load shields', shieldErr);
      shieldTokens = 0;
    }

    const asResponse = (
      r: { current_streak?: number | null; last_activity_date?: string | null } | null,
      shields = shieldTokens,
    ): StreakData => ({
      current_streak: Number(r?.current_streak ?? 0),
      longest_streak: Number(r?.current_streak ?? 0),
      last_activity_date: r?.last_activity_date ?? null,
      next_restart_date: null,
      shields,
    });

    if (req.method === 'GET') {
      return res.status(200).json(asResponse(row));
    }

    if (req.method === 'POST') {
      const { action, date } = req.body as { action?: 'use' | 'claim' | 'schedule'; date?: string };
      const now = new Date();
      const previousCurrent = row?.current_streak ?? 0;

      if (action === 'claim') {
        const nextTokens = shieldTokens + 1;
        try {
          const { data: updatedShield, error: shieldErr } = await supabaseUser
            .from('streak_shields')
            .upsert({ user_id: user.id, tokens: nextTokens }, { onConflict: 'user_id' })
            .select('tokens')
            .single();
          if (shieldErr) throw shieldErr;
          shieldTokens = updatedShield?.tokens ?? nextTokens;
          await supabaseUser.from('streak_shield_logs').insert({ user_id: user.id, action: 'claim' });
        } catch (err) {
          console.error('[API/streak] Claim shield failed', err);
          return res.status(500).json({ error: 'Failed to claim shield' });
        }
        return res.status(200).json(asResponse(row, shieldTokens));
      }

      if (action === 'schedule') {
        if (!date) return res.status(400).json({ error: 'Date required for scheduling' });
        return res.status(200).json({ ...asResponse(row), next_restart_date: date });
      }

      const spentShield = action === 'use';
      if (spentShield && shieldTokens <= 0) {
        return res.status(400).json({ error: 'No shields available' });
      }

      const update = computeStreakUpdate({ now, tz: timezone, row: row ?? null });
      const computed = spentShield
        ? {
            ...update,
            current: (row?.current_streak ?? 0) + 1,
            changed: (row?.current_streak ?? 0) + 1 !== (row?.current_streak ?? 0),
          }
        : update;

      if (computed.changed) {
        try {
          await syncStreak(supabaseUser, user.id, computed, now);
          row ??= {};
          row.current_streak = computed.current;
          row.last_activity_date = computed.todayKey;
        } catch (upsertErr) {
          console.error('[API/streak] Failed to sync streak', upsertErr);
          return res.status(500).json({ error: 'Failed to update streak' });
        }
      }

      let tokensDelta = 0;
      if (spentShield) tokensDelta -= 1;
      if (computed.current > previousCurrent && computed.current % 7 === 0) tokensDelta += 1;

      if (tokensDelta !== 0) {
        try {
          const nextTokens = Math.max(0, shieldTokens + tokensDelta);
          const { data: shieldRowUpdated, error: shieldErr } = await supabaseUser
            .from('streak_shields')
            .upsert({ user_id: user.id, tokens: nextTokens }, { onConflict: 'user_id' })
            .select('tokens')
            .single();
          if (shieldErr) throw shieldErr;
          shieldTokens = shieldRowUpdated?.tokens ?? nextTokens;
        } catch (shieldUpdateError) {
          console.error('[API/streak] Shield update failed', shieldUpdateError);
        }
      }

      if (spentShield) {
        await supabaseUser.from('streak_shield_logs').insert({ user_id: user.id, action: 'use' });
      }
      if (tokensDelta > 0) {
        await supabaseUser.from('streak_shield_logs').insert({ user_id: user.id, action: 'claim' });
      }

      return res.status(200).json(asResponse(row, shieldTokens));
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[API/streak] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
