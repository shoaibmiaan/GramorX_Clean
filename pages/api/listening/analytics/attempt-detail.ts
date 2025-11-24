// pages/api/listening/analytics/attempt-detail.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerClient } from '@/lib/supabaseServer';

type QuestionDetail = {
  questionId: string;
  questionNumber: number | null;
  sectionNumber: number | null;
  questionText: string;
  questionType: string | null;
  maxScore: number;
  correctAnswer: string | null;
  correctAnswers: string[] | null;
  userValue: unknown;
  isCorrect: boolean | null;
};

type AttemptDetailResponse = {
  attemptId: string;
  testId: string | null;
  mode: 'mock' | 'practice';
  status: string;
  rawScore: number | null;
  bandScore: number | null;
  totalQuestions: number | null;
  timeSpentSeconds: number | null;
  startedAt: string | null;
  submittedAt: string | null;
  questions: QuestionDetail[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AttemptDetailResponse | { error: string }>
) {
  const attemptId = req.query.attemptId;
  const attemptIdStr = Array.isArray(attemptId) ? attemptId[0] : attemptId;

  if (!attemptIdStr || typeof attemptIdStr !== 'string') {
    return res.status(400).json({ error: 'Missing attemptId' });
  }

  const supabase = getServerClient({ req, res });

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr || !user) return res.status(401).json({ error: 'Unauthorized' });

  // 1) Attempt
  const { data: attempt, error: attErr } = await supabase
    .from('attempts_listening')
    .select('id, user_id, test_id, mode, status, raw_score, band_score, total_questions, time_spent_seconds, started_at, submitted_at')
    .eq('id', attemptIdStr)
    .single();

  if (attErr || !attempt) return res.status(404).json({ error: 'Attempt not found' });
  if (attempt.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

  // 2) Answers
  const { data: answers, error: ansErr } = await supabase
    .from('attempts_listening_answers')
    .select('question_id, value, is_correct')
    .eq('attempt_id', attempt.id);

  if (ansErr || !answers) {
    return res.status(500).json({ error: 'Failed to load answers' });
  }

  // 3) Questions
  const { data: questions, error: qErr } = await supabase
    .from('listening_questions')
    .select(
      'id, question_number, section_number, question_text, question_type, max_score, correct_answer, correct_answers'
    )
    .eq('test_id', attempt.test_id);

  if (qErr || !questions) {
    return res.status(500).json({ error: 'Failed to load questions' });
  }

  const questionsById = new Map<string, any>();
  for (const q of questions) questionsById.set(q.id, q);

  const questionsOut: QuestionDetail[] = answers.map((a) => {
    const q = questionsById.get(a.question_id);
    if (!q) {
      return {
        questionId: a.question_id,
        questionNumber: null,
        sectionNumber: null,
        questionText: '[Unknown question]',
        questionType: null,
        maxScore: 1,
        correctAnswer: null,
        correctAnswers: null,
        userValue: a.value,
        isCorrect: a.is_correct,
      };
    }

    return {
      questionId: q.id,
      questionNumber: q.question_number ?? null,
      sectionNumber: q.section_number ?? null,
      questionText: q.question_text,
      questionType: q.question_type ?? null,
      maxScore: q.max_score ?? 1,
      correctAnswer: q.correct_answer ?? null,
      correctAnswers: q.correct_answers ?? null,
      userValue: a.value,
      isCorrect: a.is_correct,
    };
  });

  const out: AttemptDetailResponse = {
    attemptId: attempt.id,
    testId: attempt.test_id ?? null,
    mode: attempt.mode,
    status: attempt.status,
    rawScore: attempt.raw_score ?? null,
    bandScore: attempt.band_score ?? null,
    totalQuestions: attempt.total_questions ?? null,
    timeSpentSeconds: attempt.time_spent_seconds ?? null,
    startedAt: attempt.started_at ?? null,
    submittedAt: attempt.submitted_at ?? null,
    questions: questionsOut,
  };

  return res.status(200).json(out);
}
