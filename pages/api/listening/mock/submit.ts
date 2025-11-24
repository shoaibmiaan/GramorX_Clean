// pages/api/listening/mock/submit.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabaseServer';
import { computeListeningBandFromRaw } from '@/lib/listening/analytics';

const BodySchema = z.object({
  attemptId: z.string().min(1),
  timeSpentSeconds: z.number().int().nonnegative(),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      value: z.union([z.string(), z.array(z.string())]),
    }),
  ),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = BodySchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid body' });
  const body = parse.data;

  const supabase = getServerClient(req, res);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: attempt, error: attErr } = await supabase
    .from('attempts_listening')
    .select('id, user_id, test_id, status, mode')
    .eq('id', body.attemptId)
    .single();

  if (attErr || !attempt) return res.status(404).json({ error: 'Attempt not found' });
  if (attempt.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });
  if (attempt.mode !== 'mock') return res.status(400).json({ error: 'Not a mock attempt' });
  if (attempt.status === 'submitted')
    return res.status(400).json({ error: 'Already submitted' });

  const { data: questions, error: qErr } = await supabase
    .from('listening_questions')
    .select('id, question_type, correct_answer, correct_answers, max_score')
    .eq('test_id', attempt.test_id);

  if (qErr || !questions) return res.status(500).json({ error: 'Missing questions' });

  const qMap = new Map<string, any>();
  for (const q of questions) qMap.set(q.id, q);

  let rawScore = 0;

  const enriched = body.answers.map((a) => {
    const q = qMap.get(a.questionId);
    if (!q) {
      return { questionId: a.questionId, value: a.value, is_correct: false };
    }

    let isCorrect = false;

    if (q.question_type === 'mcq') {
      isCorrect = a.value === q.correct_answer;
    } else if (q.question_type === 'short_answer') {
      const norm = (s: string) => s.trim().toLowerCase();
      isCorrect = norm(a.value as string) === norm(q.correct_answer || '');
    } else if (q.question_type === 'multiple_select') {
      if (Array.isArray(a.value) && Array.isArray(q.correct_answers)) {
        const u = [...a.value].sort().join('|');
        const c = [...q.correct_answers].sort().join('|');
        isCorrect = u === c;
      }
    }

    if (isCorrect) rawScore += q.max_score ?? 1;

    return {
      questionId: q.id,
      value: a.value,
      is_correct: isCorrect,
    };
  });

  const bandScore = computeListeningBandFromRaw(rawScore);
  const submittedAt = new Date().toISOString();

  const rows = enriched.map((e) => ({
    attempt_id: attempt.id,
    question_id: e.questionId,
    value: e.value,
    is_correct: e.is_correct,
  }));

  const { error: ansErr } = await supabase
    .from('attempts_listening_answers')
    .upsert(rows, { onConflict: 'attempt_id,question_id' });

  if (ansErr) {
    console.error('[listening/mock/submit] upsert failed', ansErr);
    return res.status(500).json({ error: 'Failed to store answers' });
  }

  const { data: final, error: updErr } = await supabase
    .from('attempts_listening')
    .update({
      status: 'submitted',
      submitted_at: submittedAt,
      raw_score: rawScore,
      band_score: bandScore,
      time_spent_seconds: body.timeSpentSeconds,
    })
    .eq('id', attempt.id)
    .select()
    .single();

  if (updErr || !final) {
    console.error('[listening/mock/submit] update failed', updErr);
    return res.status(500).json({ error: 'Failed to finalise attempt' });
  }

  return res.status(200).json({
    attemptId: final.id,
    testId: final.test_id,
    mode: final.mode,
    status: final.status,
    rawScore,
    bandScore,
    timeSpentSeconds: final.time_spent_seconds,
    submittedAt: final.submitted_at,
    answers: enriched,
  });
}
