// pages/api/listening/tests/list.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';

const QuerySchema = z.object({
  mode: z
    .union([z.literal('practice'), z.literal('mock'), z.literal('all')])
    .optional()
    .default('practice'),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined))
    .refine((val) => val === undefined || (Number.isFinite(val) && val > 0 && val <= 100), {
      message: 'limit must be between 1 and 100',
    })
    .optional(),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined))
    .refine((val) => val === undefined || (Number.isFinite(val) && val >= 0), {
      message: 'offset must be >= 0',
    })
    .optional(),
});

type ListeningDifficulty = 'easy' | 'medium' | 'hard';

type ListeningTestSummaryAPI = {
  id: string;
  slug: string;
  title: string;
  difficulty: ListeningDifficulty;
  isMock: boolean;
  totalQuestions: number;
  durationSeconds: number;
  estimatedBandRange?: {
    min: number;
    max: number;
  } | null;
};

type Data =
  | { tests: ListeningTestSummaryAPI[] }
  | { error: string; details?: unknown };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = QuerySchema.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({
      error: 'Invalid query',
      details: parse.error.flatten(),
    });
  }

  const { mode, limit, offset } = parse.data;

  const supabase = getServerClient(req, res);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return res.status(500).json({ error: 'Failed to load auth user' });
  }
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Base query
  let query = supabase
    .from('listening_tests')
    .select(
      'id, slug, title, difficulty, is_mock, total_questions, duration_seconds, estimated_band_min, estimated_band_max',
    )
    .order('created_at', { ascending: false });

  if (mode === 'practice') {
    query = query.eq('is_mock', false);
  } else if (mode === 'mock') {
    query = query.eq('is_mock', true);
  }

  if (typeof limit === 'number') {
    query = query.limit(limit);
  }
  if (typeof offset === 'number') {
    query = query.range(offset, offset + (limit ?? 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(500).json({
      error: 'Failed to load listening tests',
      details: error.message,
    });
  }

  const tests: ListeningTestSummaryAPI[] =
    (data ?? []).map((row: any) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      difficulty: row.difficulty as ListeningDifficulty,
      isMock: !!row.is_mock,
      totalQuestions: row.total_questions ?? 0,
      durationSeconds: row.duration_seconds ?? 0,
      estimatedBandRange:
        row.estimated_band_min != null && row.estimated_band_max != null
          ? {
              min: Number(row.estimated_band_min),
              max: Number(row.estimated_band_max),
            }
          : null,
    })) ?? [];

  return res.status(200).json({ tests });
}
