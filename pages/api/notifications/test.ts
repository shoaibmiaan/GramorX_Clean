import type { NextApiRequest, NextApiResponse } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import { publishNotificationEvent } from '@/lib/notifications/publish';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const supabase = getServerClient(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const record = await publishNotificationEvent(supabase, {
    type: 'mock_submitted',
    userId: user.id,
    payload: { module: 'listening' },
  });

  return res.status(200).json({ ok: true, notification: record });
}
