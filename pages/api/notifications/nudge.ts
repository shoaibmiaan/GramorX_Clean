import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { withPlan, type PlanGuardContext } from '@/lib/api/withPlan';
import { enqueueNotification } from '@/lib/notifications/enqueue';
import type { NotificationChannel } from '@/lib/notifications/types';
import { supabaseService } from '@/lib/supabaseServer';

const ChannelEnum = z.enum(['in_app', 'email', 'whatsapp', 'push']);

const NudgeBody = z.object({
  user_id: z.string().uuid(),
  event_key: z.string().min(1).default('nudge_manual'),
  payload: z.record(z.unknown()).optional(),
  channels: z.array(ChannelEnum).optional(),
  channelOverride: ChannelEnum.optional(),
  idempotency_key: z.string().optional(),
});

function buildIdempotencyKey(userId: string, eventKey: string): string {
  const today = new Date().toISOString().slice(0, 10);
  return `${eventKey}:${userId}:${today}`;
}

export default withPlan('starter', async (req: NextApiRequest, res: NextApiResponse, ctx?: PlanGuardContext) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const role = ctx?.role ?? null;
  if (!role || (role !== 'admin' && role !== 'teacher')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const parsed = NudgeBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }

  const body = parsed.data;
  const supabase = supabaseService();

  try {
    await enqueueNotification(supabase, {
      userId: body.user_id,
      eventKey: body.event_key,
      payload: body.payload,
      channels: body.channels as NotificationChannel[] | undefined,
      channelOverride: body.channelOverride,
      idempotencyKey: body.idempotency_key ?? buildIdempotencyKey(body.user_id, body.event_key),
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to enqueue nudge';
    console.error('[notifications/nudge] failed', error);
    return res.status(500).json({ error: message });
  }
}, { allowRoles: ['admin', 'teacher'] });
