// pages/api/listening/test/[slug].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerClient } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const slugParam = req.query.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  if (!slug || typeof slug !== 'string') {
    return res.status(400).json({ error: 'Missing slug' });
  }

  const supabase = getServerClient(req, res);

  const { data: testRow, error: testErr } = await supabase
    .from('listening_tests')
    .select(
      'id, slug, title, description, difficulty, is_mock, total_questions, total_score, duration_seconds, audio_url',
    )
    .eq('slug', slug)
    .single();

  if (testErr || !testRow) {
    return res.status(404).json({ error: 'Test not found' });
  }

  const { data: sectionRows, error: secErr } = await supabase
    .from('listening_sections')
    .select(
      'id, test_id, section_number, title, description, audio_url, start_ms, end_ms, transcript, order_no',
    )
    .eq('test_id', testRow.id)
    .order('order_no', { ascending: true });

  if (secErr || !sectionRows) {
    return res.status(500).json({ error: 'Failed to load sections' });
  }

  const { data: questionRows, error: qErr } = await supabase
    .from('listening_questions')
    .select(
      'id, test_id, section_id, section_number, question_number, question_text, question_type, options, correct_answer, correct_answers, audio_start_ms, audio_end_ms, transcript, max_score',
    )
    .eq('test_id', testRow.id)
    .order('section_number', { ascending: true })
    .order('question_number', { ascending: true });

  if (qErr || !questionRows) {
    return res.status(500).json({ error: 'Failed to load questions' });
  }

  return res.status(200).json({
    test: {
      id: testRow.id,
      slug: testRow.slug,
      title: testRow.title,
      description: testRow.description ?? null,
      difficulty: testRow.difficulty ?? null,
      isMock: !!testRow.is_mock,
      totalQuestions: testRow.total_questions ?? null,
      totalScore: testRow.total_score ?? null,
      durationSeconds: testRow.duration_seconds ?? null,
      audioUrl: testRow.audio_url ?? null,
    },
    sections: sectionRows.map((s: any) => ({
      id: s.id,
      testId: s.test_id,
      sectionNumber: s.section_number,
      title: s.title ?? null,
      description: s.description ?? null,
      audioUrl: s.audio_url ?? null,
      startMs: s.start_ms ?? null,
      endMs: s.end_ms ?? null,
      transcript: s.transcript ?? null,
      orderNo: s.order_no ?? null,
    })),
    questions: questionRows.map((q: any) => ({
      id: q.id,
      testId: q.test_id,
      sectionId: q.section_id,
      sectionNumber: q.section_number ?? null,
      questionNumber: q.question_number ?? null,
      questionText: q.question_text,
      questionType: q.question_type ?? null,
      options: q.options ?? null,
      correctAnswer: q.correct_answer ?? null,
      correctAnswers: q.correct_answers ?? null,
      audioStartMs: q.audio_start_ms ?? null,
      audioEndMs: q.audio_end_ms ?? null,
      transcript: q.transcript ?? null,
      maxScore: q.max_score ?? 1,
    })),
  });
}
