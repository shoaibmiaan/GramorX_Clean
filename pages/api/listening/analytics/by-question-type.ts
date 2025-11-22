// pages/api/listening/analytics/by-question-type.ts
import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import type { ListeningQuestionTypeStats } from '@/lib/listening/types';

type AnswerRow = {
  attempt_id: string;
  question_id: string;
  is_correct: boolean | null;
  time_spent_seconds: number | null;
  listening_questions: {
    type: string;
  } | null;
  attempts_listening: {
    user_id: string;
    status: string;
  } | null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ stats: ListeningQuestionTypeStats[] } | { error: string }>,
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
    .from('attempts_listening_answers')
    .select(
      'attempt_id, question_id, is_correct, time_spent_seconds, listening_questions(type), attempts_listening(user_id, status)',
    )
    .eq('attempts_listening.user_id', user.id)
    .eq('attempts_listening.status', 'submitted')
    .returns<AnswerRow[]>();

  if (error || !data) {
    return res.status(500).json({ error: 'Failed to load answers' });
  }

  const map = new Map<string, ListeningQuestionTypeStats>();

  for (const row of data) {
    const qTypeRaw = row.listening_questions?.type;
    if (!qTypeRaw) continue;

    const qType = qTypeRaw as ListeningQuestionTypeStats['type'];

    if (!map.has(qType)) {
      map.set(qType, {
        type: qType,
        attempts: 0,
        correct: 0,
        accuracy: 0,
        avgTimeSeconds: null,
      });
    }

    const stat = map.get(qType)!;
    stat.attempts += 1;
    if (row.is_correct) {
      stat.correct += 1;
    }

    if (row.time_spent_seconds != null) {
      const prevTotalTime = (stat.avgTimeSeconds ?? 0) * (stat.attempts - 1);
      const newAvg = (prevTotalTime + row.time_spent_seconds) / stat.attempts;
      stat.avgTimeSeconds = newAvg;
    }
  }

  const result: ListeningQuestionTypeStats[] = Array.from(map.values()).map((s) => ({
    ...s,
    accuracy: s.attempts > 0 ? s.correct / s.attempts : 0,
  }));

  return res.status(200).json({ stats: result });
}
