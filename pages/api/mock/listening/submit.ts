// pages/api/mock/listening/submit.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
// import { withPlan } from '@/lib/withPlan'; // if you want plan gating

const Body = z.object({
  testId: z.string().min(1),
  durationSeconds: z.number().int().positive(),
  startedAt: z.string().datetime(),
  answers: z.record(z.string().min(1)), // questionId -> answer
});

type BodyType = z.infer<typeof Body>;

type ApiResponse =
  | { ok: true; attemptId: string; bandEstimate: number | null }
  | { ok: false; error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const parse = Body.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      ok: false,
      error: 'Invalid body',
    });
  }

  const body: BodyType = parse.data;

  const supabase = getServerClient(req, res);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return res.status(500).json({ ok: false, error: 'Auth error' });
  }
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  // TODO: if you want plan gating:
  // await withPlan('free', async () => { ... }, { allowRoles: ['admin', 'teacher'] });

  // ---- Insert attempt in your DB ----
  // Adjust table + columns to your actual schema.
  const attemptPayload = {
    user_id: user.id,
    test_id: body.testId,
    started_at: body.startedAt,
    duration_seconds: body.durationSeconds,
    raw_answers: body.answers, // JSONB in Supabase
    // Optional: fill after AI scoring
    band_estimate: null as number | null,
  };

  const { data, error } = await supabase
    .from('listening_attempts')
    .insert(attemptPayload)
    .select('id')
    .single();

  if (error || !data) {
    console.error('Error inserting listening_attempt', error);
    return res.status(500).json({ ok: false, error: 'Failed to save attempt' });
  }

  // TODO: trigger background AI scoring (Edge function / cron) to fill band_estimate.
  // For now just return null so UI doesn’t lie.

  return res.status(200).json({
    ok: true,
    attemptId: data.id,
    bandEstimate: null,
  });
}
