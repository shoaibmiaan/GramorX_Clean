// pages/api/listening/tests.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerClient } from '@/lib/supabaseServer';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const supabase = getServerClient(req, res);

  const { data, error } = await supabase
    .from('listening_tests')
    .select(
      'id, slug, title, description, difficulty, is_mock, total_questions, total_score, duration_seconds, audio_url',
    )
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[listening/tests] failed', error);
    return res.status(500).json({ error: 'Failed to load tests' });
  }

  const out =
    data?.map((t) => ({
      id: t.id,
      slug: t.slug,
      title: t.title,
      description: t.description ?? null,
      difficulty: t.difficulty ?? null,
      isMock: !!t.is_mock,
      totalQuestions: t.total_questions ?? null,
      totalScore: t.total_score ?? null,
      durationSeconds: t.duration_seconds ?? null,
      audioUrl: t.audio_url ?? null,
    })) ?? [];

  return res.status(200).json(out);
}
