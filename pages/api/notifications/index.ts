// pages/api/notifications/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { NotificationService } from '@/lib/notificationService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createSupabaseServerClient({ req, res });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const service = new NotificationService(supabase);

  if (req.method === 'GET') {
    try {
      const result = await service.listNotifications(user.id);
      return res.status(200).json({ notifications: result.items, unread: result.unreadCount });
    } catch (error) {
      console.error('[notifications:index] list failed', error);
      const message = error instanceof Error ? error.message : 'failed_to_load';
      return res.status(500).json({ error: message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      await service.markAllAsRead(user.id);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('[notifications:index] markAll failed', error);
      const message = error instanceof Error ? error.message : 'failed_to_update';
      return res.status(500).json({ error: message });
    }
  }

  res.setHeader('Allow', 'GET, PATCH');
  return res.status(405).json({ error: 'method_not_allowed' });
}
