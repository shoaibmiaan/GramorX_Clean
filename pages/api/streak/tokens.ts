import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import { buildStreakAnalytics, loadShieldSummary } from '@/lib/streakServer';

const TOKEN_VALUE_USD = 0.5;

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
    const [{ summary }, shields] = await Promise.all([
      buildStreakAnalytics({ supabase, userId: user.id, historyDays: 30 }),
      loadShieldSummary(supabase, user.id),
    ]);

    const availableTokens = shields?.tokens ?? 0;
    const remainder = summary.current_streak % 7;
    const nextTokenInDays = remainder === 0 ? 7 : 7 - remainder;

    return res.status(200).json({
      availableTokens,
      estimatedUsdValue: availableTokens * TOKEN_VALUE_USD,
      nextTokenInDays,
      lastUpdatedAt: shields?.updated_at ?? null,
      lastClaimedAt: shields?.updated_at ?? shields?.created_at ?? null,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[api/streak/tokens] failed to compute tokens', err);
    return res.status(500).json({ error: 'Failed to load streak rewards' });
  }
}
