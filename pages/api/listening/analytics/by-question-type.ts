// pages/api/listening/analytics/by-question-type.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerClient } from '@/lib/supabaseServer';

type QuestionTypeStats = {
  questionType: string;
  attempts: number;
  correct: number;
  accuracy: number; // 0–1
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QuestionTypeStats[] | { error: string }>
) {
  const supabase = getServerClient({ req, res });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) return res.status(401).json({ error: 'Unauthorized' });

  // 1) Get all attempts for this user
  const { data: attempts, error: attErr } = await supabase
    .from('attempts_listening')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'submitted');

  if (attErr || !attempts) {
    return res.status(500).json({ error: 'Failed to load attempts' });
  }
  if (!attempts.length) return res.status(200).json([]);

  const attemptIds = attempts.map((a) => a.id);

  // 2) Get answers + question types
  const { data: rows, error: joinErr } = await supabase
    .from('attempts_listening_answers')
    .select(
      'is_correct, listening_questions!attempts_listening_answers_question_id_fkey(question_type)'
    )
    .in('attempt_id', attemptIds);

  if (joinErr || !rows) {
    return res.status(500).json({ error: 'Failed to load data' });
  }

  const statsMap = new Map<string, { attempts: number; correct: number }>();

  for (const row of rows as any[]) {
    const qt = row.listening_questions?.question_type ?? 'unknown';
    const key = qt || 'unknown';

    if (!statsMap.has(key)) {
      statsMap.set(key, { attempts: 0, correct: 0 });
    }
    const st = statsMap.get(key)!;
    st.attempts += 1;
    if (row.is_correct === true) st.correct += 1;
  }

  const result: QuestionTypeStats[] = [];
  for (const [questionType, { attempts: a, correct }] of statsMap.entries()) {
    result.push({
      questionType,
      attempts: a,
      correct,
      accuracy: a === 0 ? 0 : correct / a,
    });
  }

  return res.status(200).json(result);
}
