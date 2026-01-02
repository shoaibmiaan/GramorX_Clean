import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { readingBandFromRaw } from '@/lib/reading/band';
import { getServerClient } from '@/lib/supabaseServer';

const AnswerSchema = z.union([z.string(), z.array(z.string())]);

const Body = z.object({
  attemptId: z.string().uuid(),
  testId: z.string().min(1),
  answers: z.record(z.string(), AnswerSchema),
  flags: z.record(z.string(), z.boolean()).optional(),
  highlights: z.record(z.string(), z.any()).optional(),
  durationSec: z.number().int().min(0).optional(),
});

type SubmitResponse = {
  attemptId: string;
  correct: number;
  total: number;
  percentage: number;
  band: number;
};

function normalize(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

function normalizeAnswer(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => normalize(v)).filter(Boolean) as string[];
  }
  const single = normalize(value);
  return single ? [single] : [];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SubmitResponse | { error: string; details?: unknown }>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = Body.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid body', details: parse.error.flatten() });
  }

  const supabase = getServerClient(req, res);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return res.status(500).json({ error: 'Failed to resolve user session' });
  }

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { attemptId, testId, answers, flags, highlights, durationSec } = parse.data;

  const { data: attempt, error: attemptError } = await supabase
    .from('reading_attempts')
    .select('id, user_id, status')
    .eq('id', attemptId)
    .maybeSingle();

  if (attemptError || !attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  if (attempt.user_id !== user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (attempt.status === 'submitted') {
    return res.status(400).json({ error: 'Attempt already submitted' });
  }

  const { data: questions, error: questionsError } = await supabase
    .from('reading_questions')
    .select('id, answers')
    .eq('test_id', testId)
    .order('question_order', { ascending: true });

  if (questionsError) {
    return res.status(500).json({ error: 'Failed to load answer keys' });
  }

  const expected = (questions ?? []).map((row) => ({
    id: String(row.id),
    answers: normalizeAnswer((row as any).answers),
  }));

  let correct = 0;
  for (const item of expected) {
    const userAnswer = answers[item.id];
    const normalizedUser = normalizeAnswer(userAnswer as unknown);
    if (normalizedUser.length === 0) continue;

    if (item.answers.length > 0) {
      const allIncluded = item.answers.every((ans) => normalizedUser.includes(ans));
      if (allIncluded) correct += 1;
    }
  }

  const total = expected.length || 1;
  const percentage = Math.round((correct / total) * 100);
  const band = readingBandFromRaw(correct, expected.length);

  const { error: updateError } = await supabase
    .from('reading_attempts')
    .update({
      status: 'submitted',
      raw_score: correct,
      band_score: band,
      duration_seconds: typeof durationSec === 'number' ? durationSec : null,
      submitted_at: new Date().toISOString(),
      meta: {
        answers,
        flags: flags ?? {},
        highlights: highlights ?? {},
      },
    })
    .eq('id', attemptId)
    .eq('user_id', user.id);

  if (updateError) {
    return res.status(500).json({ error: 'Failed to finalize attempt' });
  }

  return res.status(200).json({ attemptId, correct, total: expected.length, percentage, band });
}
