import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { rawToBand } from '@/lib/listening/band';
import { scoreOne } from '@/lib/listening/score';
import { trackor } from '@/lib/analytics/trackor.server';
import { normText, sortPairs } from '@/lib/listening/normalize';

type BodyAnswer = {
  questionId?: string;
  questionNumber?: number | null;
  section?: number | null;
  answer: any;
};

type Body = {
  testId?: string;
  testSlug?: string;
  answers?: BodyAnswer[];
  durationSeconds?: number | null;
  autoSubmit?: boolean;
};

async function getUserId(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getServerClient(req, res);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthenticated');
  return user.id;
}

const extractText = (raw: any): string | null => {
  if (raw == null) return null;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string') return parsed;
    } catch (_) {
      return raw;
    }
    return raw;
  }
  if (Array.isArray(raw)) return raw[0] ?? null;
  if (typeof raw === 'object') {
    if (typeof (raw as any).value === 'string') return (raw as any).value;
    if (typeof (raw as any).text === 'string') return (raw as any).text;
  }
  return String(raw ?? '').length ? String(raw) : null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') return res.status(405).end();

  let userId: string;
  try {
    userId = await getUserId(req, res);
  } catch {
    return res.status(401).json({ error: 'Unauthenticated' });
  }

  const { testId, testSlug, answers, durationSeconds, autoSubmit }: Body =
    req.body || {};
  if ((!testId && !testSlug) || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  // Pull questions for deterministic scoring on server
  const { data: questions, error: qErr } = await supabaseAdmin
    .from('listening_questions')
    .select('id,qno,question_number,question_type,type,correct_answer,section_no,test_id,test_slug')
    .eq(testId ? 'test_id' : 'test_slug', (testId ?? testSlug) as string)
    .order('question_number');

  if (qErr) return res.status(500).json({ error: qErr.message });
  if (!questions || questions.length === 0)
    return res.status(404).json({ error: 'Test not found' });

  // Build scoring payload
  const scoringQuestions = (questions ?? []).map((q) => {
    const qno = q.qno ?? q.question_number;
    const typeRaw = (q.type ?? q.question_type ?? 'mcq').toLowerCase();
    const answerKey = (() => {
      if (typeRaw === 'matching' || typeRaw === 'match') {
        return { pairs: (q.correct_answer as any)?.pairs ?? [] };
      }
      if (typeRaw === 'mcq') {
        return { value: extractText(q.correct_answer) ?? '' };
      }
      return { text: extractText(q.correct_answer) ?? '' };
    })();

    const normalizedType =
      typeRaw === 'matching' || typeRaw === 'match'
        ? 'match'
        : typeRaw === 'mcq'
        ? 'mcq'
        : 'gap';

    const section =
      q.section_no ??
      (qno != null
        ? qno <= 10
          ? 1
          : qno <= 20
          ? 2
          : qno <= 30
          ? 3
          : 4
        : null);

    return {
      qno: Number(qno ?? 0),
      type: normalizedType as 'mcq' | 'gap' | 'match',
      answer_key: answerKey as any,
      section,
    };
  });

  const answerByQno = new Map<number, any>();

  (answers ?? []).forEach((a) => {
    if (a.questionNumber != null) {
      answerByQno.set(Number(a.questionNumber), a.answer);
    }
  });

  let total = 0;
  const perSection: Record<string, { total: number; correct: number }> = {};
  const correctness = new Map<number, boolean>();

  for (const q of scoringQuestions) {
    const userAnswer = answerByQno.get(q.qno);
    const ok = scoreOne(q as any, userAnswer);
    correctness.set(q.qno, ok);

    const sectionKey = String(q.section ?? '1');
    const bucket = perSection[sectionKey] ?? { total: 0, correct: 0 };
    bucket.total += 1;
    if (ok) {
      bucket.correct += 1;
    }
    perSection[sectionKey] = bucket;

    if (ok) {
      total += 1;
    }
  }

  const band = rawToBand(total);
  const submittedAt = new Date().toISOString();

  // Persist attempt
  const { data: attemptRow, error: aErr } = await supabaseAdmin
    .from('listening_attempts')
    .insert({
      user_id: userId,
      test_id: questions[0].test_id,
      test_slug: questions[0].test_slug,
      submitted_at: submittedAt,
      raw_score: total,
      score: total,
      total_questions: questions.length,
      questions: questions.length,
      band_score: band,
      band,
      duration_seconds: durationSeconds ?? null,
      section_scores: perSection,
      status: autoSubmit ? 'auto_submitted' : 'completed',
      meta: { autoSubmit: !!autoSubmit },
    })
    .select('id')
    .single();

  if (aErr || !attemptRow)
    return res.status(500).json({ error: aErr?.message || 'Insert failed' });

  // Persist answers with normalization
  const userAnswers = (answers ?? []).map((a) => {
    const qnoGuess = a.questionNumber ?? null;
    const isCorrect = qnoGuess ? correctness.get(Number(qnoGuess)) ?? false : false;
    const correctRow = (questions ?? []).find(
      (q) => q.id === a.questionId || q.question_number === qnoGuess,
    );
    const correctText = extractText(correctRow?.correct_answer);

    let normalized: string | null = null;
    if (typeof a.answer === 'string') normalized = normText(a.answer);
    else if (Array.isArray(a.answer)) normalized = normText(JSON.stringify(sortPairs(a.answer)));

    const userAnswerText =
      typeof a.answer === 'string'
        ? a.answer
        : Array.isArray(a.answer)
        ? JSON.stringify(a.answer)
        : a.answer == null
        ? null
        : String(a.answer);

    return {
      attempt_id: attemptRow.id,
      question_id: a.questionId,
      qno: qnoGuess ?? null,
      question_number: qnoGuess ?? null,
      section: a.section ?? correctRow?.section_no ?? null,
      answer: a.answer ?? null,
      user_answer: userAnswerText,
      normalized_answer: normalized,
      correct_answer: correctText,
      is_correct: isCorrect,
    };
  });

  const { error: uaErr } = await supabaseAdmin
    .from('listening_user_answers')
    .insert(userAnswers);

  if (uaErr) return res.status(500).json({ error: uaErr.message });

  await trackor.log('listening_attempt_submitted', {
    attempt_id: attemptRow.id,
    user_id: userId,
    test_slug: questions[0].test_slug,
    score: total,
    band,
    section_scores: perSection,
    question_count: questions.length,
    submitted_at: submittedAt,
    meta: { autoSubmit: !!autoSubmit },
  });

  res
    .status(200)
    .json({ attemptId: attemptRow.id, score: total, band, sectionScores: perSection });
}
