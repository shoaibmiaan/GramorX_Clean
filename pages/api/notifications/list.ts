// pages/api/notifications/list.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';

const QuerySchema = z.object({
  limit: z
    .preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().regex(/^\d+$/).transform((v) => parseInt(v, 10)))
    .optional(),
  before: z
    .preprocess((v) => (Array.isArray(v) ? v[0] : v), z.string().datetime())
    .optional(),
});

export type NotificationRow = {
  id: string;
  user_id: string | null;
  message: string;
  url: string | null;
  read: boolean | null;
  created_at: string | null;
  title: string | null;
  body: string | null;
  type: string | null;
  data: Record<string, unknown> | null;
};

export type NotificationsListResponse = {
  notifications: NotificationRow[];
  unreadCount: number;
  nextCursor: string | null;
};

type ErrorResponse = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NotificationsListResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parseQuery = QuerySchema.safeParse(req.query);
  if (!parseQuery.success) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  const { limit: rawLimit, before } = parseQuery.data;
  const limit = Math.min(Math.max(rawLimit ?? 20, 1), 50);

  const supabase = getServerClient(req, res);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    // auth failure from Supabase
    return res.status(500).json({ error: 'Failed to resolve current user' });
  }

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 1) Fetch notifications with cursor pagination
  let query = supabase
    .from('notifications')
    .select(
      `
      id,
      user_id,
      message,
      url,
      read,
      created_at,
      title,
      body,
      type,
      data
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit + 1); // fetch one extra to detect hasMore

  if (before) {
    query = query.lt('created_at', before);
  }

  const { data: rows, error: listError } = await query;

  if (listError) {
    // This is what was previously showing as { message: '' } in logs
    console.error('[notifications/list] list query failed', listError);
    return res.status(500).json({ error: 'Failed to load notifications' });
  }

  const notifications: NotificationRow[] = (rows ?? []).slice(0, limit) as NotificationRow[];
  const hasMore = (rows ?? []).length > limit;
  const last = notifications[notifications.length - 1] ?? null;

  const nextCursor = hasMore && last?.created_at ? last.created_at : null;

  // 2) Unread count
  const { count: unreadCount, error: countError } = await supabase
    .from('notifications')
    .select('id', { head: true, count: 'exact' })
    .eq('user_id', user.id)
    .eq('read', false);

  if (countError) {
    console.error('[notifications/list] unread count failed', countError);
    // Do NOT block response just because count failed
  }

  return res.status(200).json({
    notifications,
    unreadCount: unreadCount ?? 0,
    nextCursor,
  });
}
