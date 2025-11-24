// pages/api/listening/analytics/summary.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerClient } from '@/lib/supabaseServer';

type SummaryResponse = {
  totalAttempts: number;
  totalMockAttempts: number;
  totalPracticeAttempts: number;
  bestBand: number | null;
  latestBand: number | null;
  averageBand: number | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SummaryResponse | { error: string }>
) {
  const supabase = getServerClient({ req, res });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: rows, error } = await supabase
    .from('attempts_listening')
    .select('mode, band_score, submitted_at')
    .eq('user_id', user.id)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: true });

  if (error) {
    console.error('[listening/analytics/summary] failed', error);
    return res.status(500).json({ error: 'Failed to load summary' });
  }

  const totalAttempts = rows?.length ?? 0;
  const totalMockAttempts = rows?.filter((r) => r.mode === 'mock').length ?? 0;
  const totalPracticeAttempts = rows?.filter((r) => r.mode === 'practice').length ?? 0;

  const bands = rows?.map((r) => Number(r.band_score)).filter((b) => !Number.isNaN(b)) ?? [];

  const bestBand = bands.length ? Math.max(...bands) : null;
  const latestBand = bands.length ? bands[bands.length - 1] : null;
  const averageBand = bands.length
    ? Number((bands.reduce((a, b) => a + b, 0) / bands.length).toFixed(1))
    : null;

  return res.status(200).json({
    totalAttempts,
    totalMockAttempts,
    totalPracticeAttempts,
    bestBand,
    latestBand,
    averageBand,
  });
}
