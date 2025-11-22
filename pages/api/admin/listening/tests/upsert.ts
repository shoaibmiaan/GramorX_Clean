// pages/api/admin/listening/tests/upsert.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import { withPlan } from '@/lib/withPlan';

const Body = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  isMock: z.boolean().default(false),
  totalQuestions: z.number().int().positive(),
  totalScore: z.number().int().positive().optional(),
  durationSeconds: z.number().int().positive(),
  audioStorageKey: z.string().optional().nullable(),
  estimatedBandMin: z.number().optional().nullable(),
  estimatedBandMax: z.number().optional().nullable(),
});

type Data =
  | { test: unknown }
  | { error: string; details?: unknown };

async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = Body.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      error: 'Invalid body',
      details: parse.error.flatten(),
    });
  }

  const {
    id,
    slug,
    title,
    description,
    difficulty,
    isMock,
    totalQuestions,
    totalScore,
    durationSeconds,
    audioStorageKey,
    estimatedBandMin,
    estimatedBandMax,
  } = parse.data;

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

  const payload = {
    slug,
    title,
    description: description ?? null,
    difficulty,
    is_mock: isMock,
    total_questions: totalQuestions,
    total_score: totalScore ?? totalQuestions,
    duration_seconds: durationSeconds,
    audio_storage_key: audioStorageKey ?? null,
    estimated_band_min: estimatedBandMin ?? null,
    estimated_band_max: estimatedBandMax ?? null,
  };

  let result;
  if (id) {
    result = await supabase
      .from('listening_tests')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
  } else {
    result = await supabase
      .from('listening_tests')
      .insert(payload)
      .select()
      .single();
  }

  const { data, error } = result;

  if (error) {
    return res.status(500).json({
      error: 'Failed to upsert listening test',
      details: error.message,
    });
  }

  return res.status(200).json({ test: data });
}

export default withPlan('master', handler, { allowRoles: ['admin'] });
