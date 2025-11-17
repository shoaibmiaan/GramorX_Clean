import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import { buildStreakAnalytics, loadShieldSummary } from '@/lib/streakServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getServerClient(req, res);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const { summary } = await buildStreakAnalytics({
      supabase,
      userId: user.id,
      historyDays: 365,
      summaryLookback: 365,
    });
    const shields = await loadShieldSummary(supabase, user.id);

    return res.status(200).json({
      ...summary,
      shields: shields?.tokens ?? summary.shields ?? 0,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[api/streak] failed to compute streak', err);
    return res.status(500).json({ error: 'Failed to compute streak' });
  }
}
