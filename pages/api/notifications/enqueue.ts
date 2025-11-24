import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { enqueueNotification, DuplicateNotificationEventError } from '@/lib/notifications/enqueue';
import type { NotificationChannel } from '@/lib/notifications/types';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

const ChannelEnum = z.enum(['in_app', 'email', 'whatsapp', 'push']);

const BodySchema = z.object({
  userId: z.string().uuid(),
  eventKey: z.string().min(1),
  payload: z.record(z.unknown()).optional(),
  channelOverride: ChannelEnum.optional(),
  channels: z.array(ChannelEnum).optional(),
  idempotencyKey: z.string().optional(),
});

function authorised(req: NextApiRequest): boolean {
  const secret = process.env.NOTIFICATIONS_ENQUEUE_SECRET ?? null;
  if (!secret) {
    return process.env.NODE_ENV !== 'production';
  }
  const header = req.headers['x-notifications-secret'] ?? req.headers['x-api-key'] ?? null;
  if (!header) return false;
  if (Array.isArray(header)) {
    return header.some((value) => value === secret);
  }
  return header === secret;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  if (!authorised(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const parsed = BodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }

  const body = parsed.data;
  const supabase = createSupabaseServerClient({ serviceRole: true });

  try {
    await enqueueNotification(supabase, {
      userId: body.userId,
      eventKey: body.eventKey,
      payload: body.payload,
      channels: body.channels as NotificationChannel[] | undefined,
      channelOverride: body.channelOverride,
      idempotencyKey: body.idempotencyKey,
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    if (error instanceof DuplicateNotificationEventError) {
      return res.status(409).json({ error: 'duplicate', id: error.eventId ?? null });
    }
    const message = error instanceof Error ? error.message : 'Failed to enqueue notification';
    console.error('[notifications/enqueue] failed', error);
    return res.status(500).json({ error: message });
  }
}
