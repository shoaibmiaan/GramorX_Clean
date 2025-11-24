// pages/api/listening/mock/start.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabaseServer';

const BodySchema = z.object({
  testSlug: z.string().min(1),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = BodySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid body' });
  }

  const { testSlug } = parse.data;

  // 🔥 this is the correct way in YOUR codebase
  const supabase = getServerClient(req, res);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 1) Resolve test
  const { data: testRow, error: testErr } = await supabase
    .from('listening_tests')
    .select('id, slug')
    .eq('slug', testSlug)
    .single();

  if (testErr || !testRow) {
    return res.status(404).json({ error: 'Test not found' });
  }

  // 2) Create attempt
  const { data: attemptRow, error: attErr } = await supabase
    .from('attempts_listening')
    .insert({
      user_id: user.id,
      test_id: testRow.id,
      mode: 'mock',
      status: 'in_progress',
      started_at: new Date().toISOString(),
      time_spent_seconds: 0,
    })
    .select('id, test_id')
    .single();

  if (attErr || !attemptRow) {
    console.error('[listening/mock/start] insert failed', attErr);
    return res.status(500).json({ error: 'Failed to start mock attempt' });
  }

  return res.status(200).json({
    attempt: {
      id: attemptRow.id,
      testId: attemptRow.test_id,
      testSlug: testRow.slug,
    },
  });
}
