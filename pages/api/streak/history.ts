import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import { buildStreakAnalytics } from '@/lib/streakServer';

const querySchema = z.object({
  days: z
    .preprocess((value) => (typeof value === 'string' ? Number(value) : value), z.number().int().min(1).max(365))
    .default(90),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parseResult = querySchema.safeParse({ days: req.query.days });
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Invalid query' });
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
    const { history } = await buildStreakAnalytics({
      supabase,
      userId: user.id,
      historyDays: parseResult.data.days,
    });
    return res.status(200).json({ days: history });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[api/streak/history] failed to compute heatmap', err);
    return res.status(500).json({ error: 'Failed to load streak history' });
  }
}
