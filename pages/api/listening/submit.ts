// pages/api/listening/submit.ts
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
    } catch {
      // ignore
    }
    return raw;
  }

  if (Array.isArray(raw)) return raw[0] ?? null;

  if (typeof raw === 'object') {
    if (typeof (raw as any).value === 'string') return (raw as any).value;
    if (typeof (raw as any).text === 'string') return (raw as any).text;
  }

  const s = String(raw ?? '');
  return s.length ? s : null;
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

  const {
    testId: testIdRaw,
    testSlug: testSlugRaw,
    answers,
    durationSeconds,
    autoSubmit,
  }: Body = req.body || {};

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'Invalid payload: answers missing' });
  }

  // Resolve test from id or slug
  let testId: string | null = testIdRaw ?? null;
  let testSlug: string | null = testSlugRaw ?? null;

  if (!testId || !testSlug) {
    if (!testId && !testSlug) {
      return res
        .status(400)
        .json({ error: 'Missing testId or testSlug in payload' });
    }

    const query = supabaseAdmin
      .from('listening_tests')
      .select('id,slug')
      .limit(1);

    if (testId) {
      query.eq('id', testId);
    } else if (testSlug) {
      query.eq('slug', testSlug);
    }

    const { data: testRow, error: testErr } = await query.single();

    if (testErr || !testRow) {
      return res.status(404).json({ error: 'Listening test not found' });
    }

    testId = testRow.id as string;
    testSlug = testRow.slug as string;
  }

  // Pull questions for deterministic scoring on server
  const { data: questions, error: qErr } = await supabaseAdmin
    .from('listening_questions')
    .select(
      'id,test_id,test_slug,section_id,section_no,question_number,qno,question_type,type,correct_answer',
    )
    .eq('test_id', testId as string)
    .order('question_number', { ascending: true });

  if (qErr) return res.status(500).json({ error: qErr.message });
  if (!questions || questions.length === 0) {
    return res
      .status(404)
      .json({ error: 'No questions found for this listening test' });
  }

  // Quick lookup maps
  const questionsById = new Map<string, any>();
  const questionsByQno = new Map<number, any>();
  for (const q of questions) {
    questionsById.set(q.id as string, q);
    const numericQno =
      (q as any).qno ?? (q as any).question_number ?? null;
    if (numericQno != null) {
      questionsByQno.set(Number(numericQno), q);
    }
  }

  // Build scoring payload
  const scoringQuestions = (questions ?? []).map((q: any) => {
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

  // Map answers by qno
  const answerByQno = new Map<number, any>();
  (answers ?? []).forEach((a) => {
    let qno: number | null = null;

    if (a.questionNumber != null) {
      qno = Number(a.questionNumber);
    } else if (a.questionId && questionsById.has(a.questionId)) {
      const q = questionsById.get(a.questionId);
      qno = Number(q.qno ?? q.question_number ?? 0);
    }

    if (qno != null) {
      answerByQno.set(qno, a.answer);
    }
  });

  // Score
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
    if (ok) bucket.correct += 1;
    perSection[sectionKey] = bucket;

    if (ok) total += 1;
  }

  const band = rawToBand(total);
  const submittedAt = new Date().toISOString();
  const questionCount = questions.length;

  // Insert into listening_attempts
  const { data: attemptRow, error: aErr } = await supabaseAdmin
    .from('listening_attempts')
    .insert({
      user_id: userId,
      test_id: testId,
      test_slug: testSlug,
      raw_score: total,
      score: total,
      total_questions: questionCount,
      questions: questionCount,
      band_score: band,
      band,
      duration_seconds: durationSeconds ?? null,
      status: autoSubmit ? 'auto_submitted' : 'completed',
      section_scores: perSection,
      meta: { autoSubmit: !!autoSubmit },
      submitted_at: submittedAt,
    })
    .select('id')
    .single();

  if (aErr || !attemptRow) {
    return res
      .status(500)
      .json({ error: aErr?.message || 'Insert attempt failed' });
  }

  const attemptId = attemptRow.id as string;

  // Build detailed answers for listening_user_answers + listening_attempt_answers
  const userAnswersDetailed = (answers ?? []).map((a) => {
    let qRow: any | null = null;
    let qnoGuess: number | null = null;

    if (a.questionId && questionsById.has(a.questionId)) {
      qRow = questionsById.get(a.questionId);
      qnoGuess = Number(qRow.qno ?? qRow.question_number ?? 0);
    } else if (a.questionNumber != null) {
      qnoGuess = Number(a.questionNumber);
      qRow = questionsByQno.get(qnoGuess) ?? null;
    }

    const isCorrect =
      qnoGuess != null ? correctness.get(qnoGuess) ?? false : false;

    const correctText = qRow
      ? extractText(qRow.correct_answer)
      : null;

    let normalized: string | null = null;
    if (typeof a.answer === 'string') {
      normalized = normText(a.answer);
    } else if (Array.isArray(a.answer)) {
      normalized = normText(JSON.stringify(sortPairs(a.answer)));
    }

    const userAnswerText =
      typeof a.answer === 'string'
        ? a.answer
        : Array.isArray(a.answer)
        ? JSON.stringify(a.answer)
        : a.answer == null
        ? null
        : String(a.answer);

    const sectionNo =
      a.section ??
      (qRow ? qRow.section_no : null);

    const qnoFinal =
      qnoGuess ??
      (qRow ? Number(qRow.qno ?? qRow.question_number ?? 0) : 0);

    const questionNumber =
      qRow?.question_number ?? qnoFinal ?? null;

    return {
      attemptId,
      questionId: qRow?.id ?? a.questionId ?? null,
      qno: qnoFinal,
      questionNumber,
      section: sectionNo ?? null,
      rawAnswer: a.answer ?? null,
      userAnswerText,
      normalized,
      correctText,
      isCorrect,
    };
  });

  // Insert into listening_user_answers
  const userAnswerRows = userAnswersDetailed.map((ua) => ({
    attempt_id: ua.attemptId,
    question_id: ua.questionId,
    qno: ua.qno,
    question_number: ua.questionNumber,
    section: ua.section,
    answer: ua.rawAnswer,
    user_answer: ua.userAnswerText,
    normalized_answer: ua.normalized,
    correct_answer: ua.correctText,
    is_correct: ua.isCorrect,
  }));

  const { error: uaErr } = await supabaseAdmin
    .from('listening_user_answers')
    .insert(userAnswerRows);

  if (uaErr) {
    return res.status(500).json({ error: uaErr.message });
  }

  // Backfill compatibility: listening_attempt_answers (simple text version)
  const legacyAnswerRows = userAnswersDetailed.map((ua) => ({
    attempt_id: ua.attemptId,
    question_id: ua.questionId,
    question_number: ua.questionNumber,
    section: ua.section,
    user_answer: ua.userAnswerText,
    correct_answer: ua.correctText,
    is_correct: ua.isCorrect,
  }));

  const { error: legacyErr } = await supabaseAdmin
    .from('listening_attempt_answers')
    .insert(legacyAnswerRows);

  if (legacyErr) {
    // Don't kill the whole flow – just log via response meta
    console.error('listening_attempt_answers insert failed', legacyErr);
  }

  // Backfill compatibility: listening_responses (summary table)
  const accuracy =
    questionCount > 0 ? total / questionCount : null;

  const { error: respErr } = await supabaseAdmin
    .from('listening_responses')
    .insert({
      user_id: userId,
      test_slug: testSlug,
      score: total,
      total_questions: questionCount,
      accuracy,
      band,
      meta: { attempt_id: attemptId },
      submitted_at: submittedAt,
    });

  if (respErr) {
    console.error('listening_responses insert failed', respErr);
  }

  // Analytics event
  await trackor.log('listening_attempt_submitted', {
    attempt_id: attemptId,
    user_id: userId,
    test_id: testId,
    test_slug: testSlug,
    raw_score: total,
    band_score: band,
    section_scores: perSection,
    question_count: questionCount,
    submitted_at: submittedAt,
    meta: { autoSubmit: !!autoSubmit },
  });

  return res.status(200).json({
    attemptId,
    score: total,
    band,
    sectionScores: perSection,
  });
}
