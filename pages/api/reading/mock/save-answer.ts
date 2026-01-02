import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';

const Body = z.object({
  attemptId: z.string().uuid(),
  answers: z.record(z.string(), z.any()).optional(),
  flags: z.record(z.string(), z.boolean()).optional(),
  activeQuestionId: z.string().optional(),
  durationSec: z.number().int().min(0).optional(),
});

type SaveResponse = { saved: true; attemptId: string; lastSavedAt: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<SaveResponse | { error: string; details?: unknown }>) {
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

  const { attemptId, answers, flags, activeQuestionId, durationSec } = parse.data;

  const { data: attempt, error: attemptError } = await supabase
    .from('reading_attempts')
    .select('id, user_id, status, meta')
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

  const currentMeta = (attempt.meta as Record<string, unknown>) || {};
  const updatedMeta = {
    ...currentMeta,
    answers: answers ?? (currentMeta as any).answers ?? {},
    flags: flags ?? (currentMeta as any).flags ?? {},
    activeQuestionId: activeQuestionId ?? (currentMeta as any).activeQuestionId,
  };

  const lastSavedAt = new Date().toISOString();

  const { error: updateError } = await supabase
    .from('reading_attempts')
    .update({
      meta: updatedMeta,
      last_saved_at: lastSavedAt,
      duration_seconds: typeof durationSec === 'number' ? durationSec : null,
      status: 'in_progress',
    })
    .eq('id', attemptId)
    .eq('user_id', user.id);

  if (updateError) {
    return res.status(500).json({ error: 'Failed to save progress' });
  }

  return res.status(200).json({ saved: true, attemptId, lastSavedAt });
}
