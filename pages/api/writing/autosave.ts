import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabaseServer';

const Body = z.object({
  attemptId: z.string().uuid(),
  taskNumber: z.union([z.literal(1), z.literal(2)]),
  answerText: z.string(),
});

type AutosaveResponse =
  | { ok: true; savedAt: string; wordCount: number }
  | { ok: false; error: string; details?: unknown };

const countWords = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<AutosaveResponse>) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const parse = Body.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ ok: false, error: 'Invalid body', details: parse.error.flatten() });

  const { attemptId, taskNumber, answerText } = parse.data;
  const supabase = getServerClient(req, res);

  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return res.status(401).json({ ok: false, error: 'Unauthorized' });

  // Ensure attempt is owned and not submitted/evaluated (RLS + triggers also enforce, but we fail fast)
  const { data: attempt, error: attemptErr } = await supabase
    .from('writing_attempts')
    .select('id, status')
    .eq('id', attemptId)
    .single();

  if (attemptErr || !attempt) return res.status(404).json({ ok: false, error: 'Attempt not found' });

  if (attempt.status === 'submitted' || attempt.status === 'evaluated') {
    return res.status(409).json({ ok: false, error: 'Attempt is locked' });
  }

  const wc = countWords(answerText);
  const savedAt = new Date().toISOString();

  // Update answer row
  const { error: updErr } = await supabase
    .from('writing_attempt_answers')
    .update({
      answer_text: answerText,
      word_count: wc,
      last_saved_at: savedAt,
    })
    .eq('attempt_id', attemptId)
    .eq('task_number', taskNumber);

  if (updErr) return res.status(500).json({ ok: false, error: 'Autosave failed', details: updErr });

  // Move attempt to in_progress (optional but useful)
  await supabase
    .from('writing_attempts')
    .update({ status: 'in_progress' })
    .eq('id', attemptId)
    .eq('status', 'created');

  return res.status(200).json({ ok: true, savedAt, wordCount: wc });
}
