// pages/api/mock/listening/summary.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

type ListeningMockSummary = {
  ok: true;
  lastBand: number | null;
  bestBand: number | null;
  mocksTaken: number;
  latestAttemptId: string | null;
  targetBand: number | null;
};

type ErrorResponse = {
  ok: false;
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListeningMockSummary | ErrorResponse>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const supabase = createSupabaseServerClient({ req });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  try {
    // Grab recent listening attempts for this user
    const { data: attempts, error: attemptsErr } = await supabase
      .from('listening_attempts')
      .select('id, band, submitted_at')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(50);

    if (attemptsErr) {
      console.error('[mock/listening/summary] attempts error', attemptsErr);
      return res.status(500).json({ ok: false, error: 'Failed to load attempts' });
    }

    const rows = attempts ?? [];

    const last = rows[0] ?? null;
    const bands = rows
      .map((r) => (typeof r.band === 'number' ? r.band : Number(r.band ?? NaN)))
      .filter((b) => Number.isFinite(b)) as number[];

    const lastBand = last && typeof last.band === 'number'
      ? last.band
      : last && last.band != null
      ? Number(last.band)
      : null;

    const bestBand = bands.length ? Math.max(...bands) : null;
    const mocksTaken = rows.length;
    const latestAttemptId = last ? String(last.id) : null;

    // Target band from profiles.goal_band
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('goal_band')
      .eq('user_id', user.id)
      .maybeSingle();

    const goal = profileRow?.goal_band;
    const targetBand =
      typeof goal === 'number'
        ? goal
        : goal != null
        ? Number(goal)
        : null;

    return res.status(200).json({
      ok: true,
      lastBand,
      bestBand,
      mocksTaken,
      latestAttemptId,
      targetBand,
    });
  } catch (err) {
    console.error('[mock/listening/summary] unexpected error', err);
    return res.status(500).json({ ok: false, error: 'Unexpected error' });
  }
}
