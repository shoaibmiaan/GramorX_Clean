// pages/api/admin/listening/tests/upsert.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabaseServer';

const BodySchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  difficulty: z.string().optional().nullable(),
  isMock: z.boolean(),
  totalQuestions: z.number().int().nonnegative().optional().nullable(),
  totalScore: z.number().int().nonnegative().optional().nullable(),
  durationSeconds: z.number().int().nonnegative().optional().nullable(),
  audioUrl: z.string().url().optional().nullable(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = BodySchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid body' });
  const body = parse.data;

  const supabase = getServerClient({ req, res });

  // TODO: admin guard
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const payload = {
    slug: body.slug,
    title: body.title,
    description: body.description ?? null,
    difficulty: body.difficulty ?? null,
    is_mock: body.isMock,
    total_questions: body.totalQuestions ?? null,
    total_score: body.totalScore ?? null,
    duration_seconds: body.durationSeconds ?? null,
    audio_url: body.audioUrl ?? null,
  };

  let result;
  if (body.id) {
    result = await supabase
      .from('listening_tests')
      .update(payload)
      .eq('id', body.id)
      .select()
      .single();
  } else {
    result = await supabase.from('listening_tests').insert(payload).select().single();
  }

  const { data, error } = result;

  if (error || !data) {
    console.error('[admin/listening/tests/upsert] failed', error);
    return res.status(500).json({ error: 'Failed to save test' });
  }

  return res.status(200).json(data);
}
