import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';

const Body = z.object({
  testId: z.string().min(1),
});

type StartResponse = { attemptId: string; status: 'in_progress' | 'submitted'; };

export default async function handler(req: NextApiRequest, res: NextApiResponse<StartResponse | { error: string; details?: unknown }>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = Body.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid body', details: parse.error.flatten() });
  }

  const supabase = getServerClient(req, res);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return res.status(500).json({ error: 'Failed to resolve user session' });
  }

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { testId } = parse.data;

  const { data: existingAttempt, error: existingError } = await supabase
    .from('reading_attempts')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('test_id', testId)
    .in('status', ['created', 'in_progress'])
    .maybeSingle();

  if (existingError) {
    return res.status(500).json({ error: 'Failed to check existing attempts' });
  }

  if (existingAttempt) {
    return res.status(200).json({ attemptId: existingAttempt.id, status: existingAttempt.status as StartResponse['status'] });
  }

  const { data: inserted, error: insertError } = await supabase
    .from('reading_attempts')
    .insert({
      user_id: user.id,
      test_id: testId,
      status: 'in_progress',
      meta: { answers: {}, flags: {}, highlights: {} },
      started_at: new Date().toISOString(),
    })
    .select('id, status')
    .maybeSingle();

  if (insertError || !inserted) {
    return res.status(500).json({ error: 'Failed to create attempt' });
  }

  return res.status(200).json({ attemptId: inserted.id, status: inserted.status as StartResponse['status'] });
}
