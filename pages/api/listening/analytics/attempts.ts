// pages/api/listening/analytics/attempts.ts
import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import type { ListeningBandSnapshot } from '@/lib/listening/types';

type AttemptRow = {
  id: string;
  test_id: string;
  user_id: string;
  mode: string;
  status: string;
  submitted_at: string | null;
  raw_score: number | null;
  band_score: number | null;
  listening_tests: {
    slug: string;
    total_score: number | null;
  } | null;
};

type ResponseBody = {
  attempts: ListeningBandSnapshot[];
  total: number;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody | { error: string }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const page = Number.parseInt((req.query.page as string) ?? '1', 10) || 1;
  const pageSize = Number.parseInt((req.query.pageSize as string) ?? '10', 10) || 10;
  const modeQuery = req.query.mode as string | undefined;

  const supabase = getServerClient(req, res);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('attempts_listening')
    .select(
      'id, test_id, user_id, mode, status, submitted_at, raw_score, band_score, listening_tests!inner(slug, total_score)',
      { count: 'exact' },
    )
    .eq('user_id', user.id)
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false })
    .range(from, to);

  if (modeQuery === 'mock') {
    query = query.eq('mode', 'mock');
  }
  if (modeQuery === 'practice') {
    query = query.eq('mode', 'practice');
  }

  const { data, error, count } = await query.returns<AttemptRow[]>();

  if (error || !data || count == null) {
    return res.status(500).json({ error: 'Failed to load attempts' });
  }

  const attempts: ListeningBandSnapshot[] = data.map((a) => ({
    attemptId: a.id,
    testSlug: a.listening_tests?.slug ?? 'unknown',
    attemptedAt: a.submitted_at ?? new Date().toISOString(),
    mode: a.mode === 'mock' ? 'mock' : 'practice',
    rawScore: a.raw_score ?? 0,
    maxScore: a.listening_tests?.total_score ?? 40,
    bandScore: a.band_score ?? 0,
  }));

  return res.status(200).json({
    attempts,
    total: count,
  });
}
