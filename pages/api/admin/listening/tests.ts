// pages/api/admin/listening/tests.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerClient } from '@/lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = getServerClient({ req, res });

  // TODO: plug in your own admin guard here
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data, error } = await supabase
    .from('listening_tests')
    .select(
      'id, slug, title, description, difficulty, is_mock, total_questions, total_score, duration_seconds, audio_url, created_at, updated_at'
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[admin/listening/tests] failed', error);
    return res.status(500).json({ error: 'Failed to load tests' });
  }

  return res.status(200).json(data ?? []);
}
