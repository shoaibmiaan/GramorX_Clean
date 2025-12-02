import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();
  const attemptId = String(req.query.attemptId);

  const { data: attempt, error: e1 } = await supabaseAdmin
    .from('listening_attempts')
    .select('id,test_id,raw_score,band_score,section_stats,submitted_at,meta')
    .eq('id', attemptId)
    .maybeSingle();

  if (e1 || !attempt) return res.status(404).json({ error: e1?.message || 'Attempt not found' });

  const testId = (attempt as any).test_id ?? null;

  if (!testId) {
    return res.status(400).json({ error: 'Attempt is missing test reference' });
  }

  const questionQuery = supabaseAdmin
    .from('listening_questions')
    .select('qno,type,prompt,options,match_left,match_right,answer_key,section_order');

  const sectionQuery = supabaseAdmin
    .from('listening_sections')
    .select('order_no,title,transcript,start_ms,end_ms');

  const testQuery = supabaseAdmin.from('listening_tests').select('id,slug,title');

  questionQuery.eq('test_id', testId).order('qno');
  sectionQuery.eq('test_id', testId).order('order_no');
  testQuery.eq('id', testId).limit(1);

  const [
    { data: answers, error: e2 },
    { data: questions, error: e3 },
    { data: sections, error: e4 },
    { data: test, error: e5 },
  ] = await Promise.all([
    supabaseAdmin
      .from('listening_user_answers')
      .select('qno,answer,is_correct')
      .eq('attempt_id', attemptId)
      .order('qno'),
    questionQuery,
    sectionQuery,
    testQuery.maybeSingle(),
  ]);

  if (e2 || e3 || e4 || e5)
    return res.status(500).json({ error: e2?.message || e3?.message || e4?.message || e5?.message });

  res.json({
    attempt: {
      id: attempt.id,
      test_slug: test?.slug ?? (attempt.meta as any)?.test_slug ?? null,
      score: (attempt as any).raw_score ?? null,
      raw_score: (attempt as any).raw_score ?? null,
      band: (attempt as any).band_score ?? null,
      band_score: (attempt as any).band_score ?? null,
      section_scores: (attempt as any).section_stats ?? null,
      section_stats: (attempt as any).section_stats ?? null,
      submitted_at: attempt.submitted_at,
      meta: attempt.meta,
    },
    test: test ? { slug: test.slug, title: test.title } : null,
    answers: answers ?? [],
    questions: questions ?? [],
    sections: sections ?? [],
  });
}
