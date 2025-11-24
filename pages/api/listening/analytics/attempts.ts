// pages/api/listening/analytics/attempts.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerClient } from '@/lib/supabaseServer';

type AttemptListItem = {
  id: string;
  testId: string | null;
  testSlug: string | null;
  mode: 'mock' | 'practice';
  status: string;
  rawScore: number | null;
  bandScore: number | null;
  totalQuestions: number | null;
  timeSpentSeconds: number | null;
  startedAt: string | null;
  submittedAt: string | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AttemptListItem[] | { error: string }>
) {
  const supabase = getServerClient({ req, res });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) return res.status(401).json({ error: 'Unauthorized' });

  const limit = Number(req.query.limit ?? 50);
  const effectiveLimit = Number.isNaN(limit) ? 50 : Math.min(limit, 200);

  const { data, error } = await supabase
    .from('attempts_listening')
    .select(
      'id, test_id, mode, status, raw_score, band_score, total_questions, time_spent_seconds, started_at, submitted_at, listening_tests!attempts_listening_test_id_fkey(slug)'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(effectiveLimit);

  if (error) {
    console.error('[listening/analytics/attempts] failed', error);
    return res.status(500).json({ error: 'Failed to load attempts' });
  }

  const out: AttemptListItem[] =
    data?.map((row: any) => ({
      id: row.id,
      testId: row.test_id ?? null,
      testSlug: row.listening_tests?.slug ?? null,
      mode: row.mode,
      status: row.status,
      rawScore: row.raw_score ?? null,
      bandScore: row.band_score ?? null,
      totalQuestions: row.total_questions ?? null,
      timeSpentSeconds: row.time_spent_seconds ?? null,
      startedAt: row.started_at ?? null,
      submittedAt: row.submitted_at ?? null,
    })) ?? [];

  return res.status(200).json(out);
}
