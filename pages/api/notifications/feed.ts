import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import type { NotificationRecord } from '@/lib/notifications/types';

const QuerySchema = z.object({
  limit: z
    .preprocess((value) => {
      if (value == null) return 20;
      const parsed = typeof value === 'string' ? Number(value) : value;
      return Number.isFinite(parsed) ? Number(parsed) : 20;
    }, z.number().int().min(1).max(50))
    .optional(),
  cursor: z.string().optional(),
});

type NotificationsFeedResponse = {
  items: NotificationRecord[];
  unreadCount: number;
  nextCursor: string | null;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const supabase = getServerClient(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const parseResult = QuerySchema.safeParse(req.query);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'invalid_query' });
  }

  const { limit = 20, cursor } = parseResult.data;

  let query = supabase
    .from('notifications')
    .select('id, user_id, message, url, read, created_at, updated_at, title, type, metadata')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    const cursorDate = new Date(cursor);
    if (isNaN(cursorDate.getTime())) {
      return res.status(400).json({ error: 'invalid_cursor' });
    }
    query = query.lt('created_at', cursorDate.toISOString());
  }

  const { data, error } = await query;
  if (error) {
    console.error('[notifications.feed] select failed', error);
    return res.status(500).json({ error: 'failed_to_load' });
  }

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit) as NotificationRecord[];
  const nextCursor = hasMore ? rows[limit]?.created_at ?? null : null;

  const { count: unreadCount, error: countError } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false);

  if (countError) {
    console.error('[notifications.feed] count failed', countError);
    return res.status(500).json({ error: 'failed_to_load' });
  }

  const payload: NotificationsFeedResponse = {
    items,
    unreadCount: unreadCount ?? 0,
    nextCursor,
  };

  return res.status(200).json(payload);
}
