// pages/api/listening/mock/tests.ts
import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import type { ListeningTestSummary } from '@/lib/listening/types';

type ListeningTestRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  is_mock: boolean;
  total_questions: number;
  total_score: number | null;
  duration_seconds: number;
};

type ResponseBody = {
  tests: ListeningTestSummary[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody | { error: string }>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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

  const { data, error } = await supabase
    .from('listening_tests')
    .select(
      'id, slug, title, description, difficulty, is_mock, total_questions, total_score, duration_seconds',
    )
    .eq('is_mock', true)
    .order('title', { ascending: true })
    .returns<ListeningTestRow[]>();

  if (error || !data) {
    return res.status(500).json({ error: 'Failed to load tests' });
  }

  const tests: ListeningTestSummary[] = data.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    difficulty: row.difficulty,
    isMock: row.is_mock,
    totalQuestions: row.total_questions,
    durationSeconds: row.duration_seconds,
    estimatedBandRange: undefined,
  }));

  return res.status(200).json({ tests });
}
