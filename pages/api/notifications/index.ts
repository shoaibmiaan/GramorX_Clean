// pages/api/notifications/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { NotificationService } from '@/lib/notificationService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    const supabase = createSupabaseServerClient({ req, res });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const service = new NotificationService(supabase);
    await service.ensureSeeded(user.id);

    const { items, unreadCount } = await service.listNotifications(user.id, { limit: 50 });

    const notifications = items.map((item) => ({
      id: item.id,
      message: item.message,
      url: item.url,
      read: item.read,
      created_at: item.createdAt,
    }));

    return res.status(200).json({ notifications, unread: unreadCount });
  } catch (err: any) {
    console.error('[notifications] unhandled error', err);
    return res.status(500).json({ error: err?.message ?? 'unexpected' });
  }
}
