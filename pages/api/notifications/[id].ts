// pages/api/notifications/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';

const BodySchema = z
  .object({
    action: z.enum(['read', 'unread']).optional(),
  })
  .optional();

type SuccessResponse = { ok: true };
type ErrorResponse = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  if (req.method !== 'POST' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const notificationId = req.query.id;
  if (!notificationId || Array.isArray(notificationId)) {
    return res.status(400).json({ error: 'Invalid notification id' });
  }

  const parseBody = BodySchema.safeParse(req.body);
  if (!parseBody.success) {
    return res.status(400).json({ error: 'Invalid body' });
  }

  const action = parseBody.data?.action ?? 'read';
  const readValue = action === 'read';

  const supabase = getServerClient(req, res);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return res.status(500).json({ error: 'Failed to resolve current user' });
  }

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { error: updateError } = await supabase
    .from('notifications')
    .update({ read: readValue })
    .eq('id', notificationId)
    .eq('user_id', user.id);

  if (updateError) {
    console.error('[notifications/id] update failed', updateError);
    return res.status(500).json({ error: 'Failed to update notification' });
  }

  return res.status(200).json({ ok: true });
}
