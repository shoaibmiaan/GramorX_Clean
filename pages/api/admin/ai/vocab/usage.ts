// pages/api/admin/ai/vocab/usage.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
// import type { Database } from '@/types/supabase'; // if you have it, uncomment & use generic

type DailyUsageRow = {
  day: string; // 'YYYY-MM-DD'
  total_rewrites: number;
};

type UsageResponse = {
  totalsByDay: DailyUsageRow[];
};

type ErrorResponse = {
  error: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UsageResponse | ErrorResponse>,
): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // const supabase = createPagesServerClient<Database>({ req, res });
  const supabase = createPagesServerClient({ req, res });

  try {
    // 1) Auth
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      // eslint-disable-next-line no-console
      console.error('[admin/ai/vocab/usage] auth error:', userError);
    }

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const userId = user.id;

    // 2) Check admin role via profiles.role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      // eslint-disable-next-line no-console
      console.error('[admin/ai/vocab/usage] profile error:', profileError);
    }

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access only.' });
    }

    // 3) days param (default 7, cap 90)
    const daysParam = Array.isArray(req.query.days)
      ? req.query.days[0]
      : req.query.days;
    let days = parseInt(daysParam || '7', 10);
    if (Number.isNaN(days) || days <= 0) days = 7;
    if (days > 90) days = 90;

    // fromDate: N days back (UTC) as YYYY-MM-DD
    const fromDate = new Date();
    fromDate.setUTCDate(fromDate.getUTCDate() - (days - 1));
    const fromStr = fromDate.toISOString().slice(0, 10); // yyyy-mm-dd

    // 4) Query the daily usage view
    const { data, error: usageError } = await supabase
      .from('v_ai_vocab_rewrite_usage_by_date')
      .select('day, total_rewrites')
      .gte('day', fromStr)
      .order('day', { ascending: true });

    if (usageError) {
      // eslint-disable-next-line no-console
      console.error('[admin/ai/vocab/usage] usage view error:', usageError);
      return res.status(500).json({ error: 'Failed to load usage data.' });
    }

    const totalsByDay: DailyUsageRow[] =
      (data ?? []).map((row: any) => ({
        day: row.day,
        total_rewrites: row.total_rewrites ?? 0,
      })) ?? [];

    return res.status(200).json({ totalsByDay });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[admin/ai/vocab/usage] Fatal error:', err);
    return res.status(500).json({ error: 'Unexpected error loading usage data.' });
  }
}
