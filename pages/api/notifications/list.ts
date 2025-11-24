import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import type { NotificationDTO, NotificationsListResponse } from '@/lib/notifications/types';
import { getServerClient } from '@/lib/supabaseServer';

const QuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((value) => (Array.isArray(value) ? value[0] : value)),
});

type RawNotificationRow = Record<string, any>;

function mapRow(row: RawNotificationRow): NotificationDTO {
  const createdAt = typeof row.created_at === 'string' ? row.created_at : new Date().toISOString();
  const readAt =
    row.read_at ??
    (row.read === true || row.is_read === true ? createdAt : null);
  return {
    id: String(row.id),
    title: row.title ?? null,
    body: row.body ?? null,
    message: row.message ?? row.body ?? row.title ?? null,
    url: row.url ?? null,
    type: row.type ?? null,
    channel: row.channel ?? null,
    readAt,
    createdAt,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<NotificationsListResponse | { error: string }>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end('Method Not Allowed');
  }

  const supabase = getServerClient(req, res);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = QuerySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid query parameters' });
  }

  const { limit, cursor } = parsed.data;

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    const cursorDate = new Date(cursor);
    if (Number.isNaN(cursorDate.getTime())) {
      return res.status(400).json({ error: 'Invalid cursor format' });
    }
    query = query.lt('created_at', cursorDate.toISOString());
  }

  const { data, error } = await query;
  if (error) {
    console.error('[notifications/list] query failed', error);
    return res.status(500).json({ error: 'Failed to load notifications' });
  }

  const rows = (data ?? []) as RawNotificationRow[];
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit).map(mapRow);
  const nextCursorRaw = hasMore ? rows[limit]?.created_at ?? null : null;
  const nextCursor = nextCursorRaw ? new Date(nextCursorRaw).toISOString() : null;

  const { count: unreadCount, error: unreadError } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('read_at', null);

  if (unreadError) {
    console.error('[notifications/list] unread count failed', unreadError);
    return res.status(500).json({ error: 'Failed to compute unread count' });
  }

  return res.status(200).json({
    items,
    nextCursor,
    unreadCount: unreadCount ?? 0,
  });
}
