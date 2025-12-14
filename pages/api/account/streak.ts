import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerClient, getServerUser } from '@/lib/supabaseServer';
import { getServerStreakPayload } from '@/lib/server/streakMetrics';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const supabase = getServerClient(req, res);
  const user = await getServerUser(req, res);

  if (!user) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  try {
    const payload = await getServerStreakPayload(req, res, user.id, supabase);
    return res.status(200).json(payload);
  } catch (err) {
    console.error('[api/account/streak] failed', err);
    return res.status(500).json({ ok: false, error: 'Failed to load streak' });
  }
}
