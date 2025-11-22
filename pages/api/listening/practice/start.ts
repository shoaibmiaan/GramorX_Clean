// pages/api/listening/practice/start.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import { computeListeningBandFromRaw } from '@/lib/listening/analytics';

const BodySchema = z.object({
  testSlug: z.string().min(1),
});

type Body = z.infer<typeof BodySchema>;

type ListeningTestRow = {
  id: string;
  slug: string;
  title: string;
  is_mock: boolean;
  total_score: number | null;
};

type AttemptRow = {
  id: string;
  test_id: string;
  user_id: string;
  mode: string;
  status: string;
  started_at: string;
  submitted_at: string | null;
  raw_score: number | null;
  band_score: number | null;
  time_spent_seconds: number | null;
};

type ListeningAttemptResponse = {
  id: string;
  testId: string;
  userId: string;
  mode: 'practice';
  status: 'in_progress';
  startedAt: string;
  submittedAt: string | null;
  rawScore: number | null;
  bandScore: number | null;
  timeSpentSeconds: number | null;
  answers: [];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListeningAttemptResponse | { error: string }>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = BodySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid body' });
  }
  const body: Body = parse.data;

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

  // Find test by slug, must NOT be mock
  const { data: testRows, error: testError } = await supabase
    .from('listening_tests')
    .select('id, slug, title, is_mock, total_score')
    .eq('slug', body.testSlug)
    .eq('is_mock', false)
    .limit(1)
    .returns<ListeningTestRow[]>();

  if (testError) {
    return res.status(500).json({ error: 'Failed to load test' });
  }
  const test = testRows?.[0];
  if (!test) {
    return res.status(404).json({ error: 'Test not found' });
  }

  // Create attempt
  const { data: attemptRows, error: attemptError } = await supabase
    .from('attempts_listening')
    .insert({
      test_id: test.id,
      user_id: user.id,
      mode: 'practice',
      status: 'in_progress',
      // started_at defaults to now() in DB ideally
    })
    .select(
      'id, test_id, user_id, mode, status, started_at, submitted_at, raw_score, band_score, time_spent_seconds',
    )
    .single<AttemptRow>();

  if (attemptError || !attemptRows) {
    return res.status(500).json({ error: 'Failed to create attempt' });
  }

  const attemptRow = attemptRows;

  const response: ListeningAttemptResponse = {
    id: attemptRow.id,
    testId: attemptRow.test_id,
    userId: attemptRow.user_id,
    mode: 'practice',
    status: 'in_progress',
    startedAt: attemptRow.started_at,
    submittedAt: attemptRow.submitted_at,
    rawScore: attemptRow.raw_score,
    bandScore: attemptRow.band_score,
    timeSpentSeconds: attemptRow.time_spent_seconds,
    answers: [],
  };

  return res.status(200).json(response);
}
