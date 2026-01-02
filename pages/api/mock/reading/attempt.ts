import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerClient } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const attemptId = typeof req.query.attemptId === 'string' ? req.query.attemptId : '';
  if (!attemptId) {
    return res.status(400).json({ error: 'attemptId is required' });
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

  const { data: attempt, error } = await supabase
    .from('attempts_reading')
    .select('id, user_id, paper_id, submitted_at, score_json')
    .eq('id', attemptId)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: 'Failed to load attempt' });
  }

  if (!attempt) {
    return res.status(404).json({ error: 'Attempt not found' });
  }

  if (attempt.user_id !== user.id) {
    return res.status(403).json({ error: 'Not your attempt' });
  }

  return res.status(200).json({ attempt });
}
