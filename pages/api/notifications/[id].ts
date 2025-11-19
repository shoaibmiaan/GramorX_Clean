import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import type { NotificationDTO } from '@/lib/notifications/types';
import { getServerClient } from '@/lib/supabaseServer';

const ParamsSchema = z.object({
  id: z.union([z.string(), z.array(z.string())]).transform((value) => (Array.isArray(value) ? value[0] : value)),
});

const BodySchema = z.object({
  action: z.enum(['read', 'click']),
});

function mapRow(row: Record<string, any>): NotificationDTO {
  const createdAt = typeof row.created_at === 'string' ? row.created_at : new Date().toISOString();
  const readAt = row.read_at ?? (row.read === true || row.is_read === true ? createdAt : null);
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

export default async function handler(req: NextApiRequest, res: NextApiResponse<{ ok: true; notification?: NotificationDTO } | { error: string }>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const params = ParamsSchema.safeParse({ id: req.query.id });
  if (!params.success) {
    return res.status(400).json({ error: 'Invalid notification id' });
  }

  const body = BodySchema.safeParse(req.body);
  if (!body.success) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  const supabase = getServerClient(req, res);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const update = {
    read_at: new Date().toISOString(),
    read: true,
    is_read: true,
  };

  const { data, error } = await supabase
    .from('notifications')
    .update(update)
    .eq('user_id', user.id)
    .eq('id', params.data.id)
    .select('*')
    .single<Record<string, any>>();

  if (error) {
    console.error('[notifications/:id] update failed', error);
    return res.status(500).json({ error: 'Failed to update notification' });
  }

  return res.status(200).json({ ok: true, notification: mapRow(data) });
}
