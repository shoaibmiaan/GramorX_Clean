import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';
import type { BaseNotificationPayload, NotificationEventType, NotificationRecord } from './types';
import { renderNotification } from './render';

export type PublishClient = SupabaseClient<Database>;

export async function publishNotificationEvent(
  supabase: PublishClient,
  params: {
    type: NotificationEventType;
    userId: string;
    payload?: BaseNotificationPayload;
  },
): Promise<NotificationRecord> {
  const rendered = renderNotification(params.type, params.payload);
  const row = {
    user_id: params.userId,
    message: rendered.body,
    title: rendered.title,
    type: params.type,
    url: rendered.url ?? null,
    read: false,
    metadata: params.payload ?? null,
  };

  const { data, error } = await supabase
    .from('notifications')
    .insert(row)
    .select('id, user_id, message, url, read, created_at, updated_at, title, type, metadata')
    .single<NotificationRecord>();

  if (error || !data) {
    throw error ?? new Error('Failed to insert notification');
  }

  // Log event when table exists but swallow errors to avoid blocking UX
  void supabase
    .from('notification_events')
    .insert({
      user_id: params.userId,
      event_key: params.type,
      idempotency_key: params.payload?.attemptId ?? null,
    })
    .then(() => undefined)
    .catch(() => undefined);

  return data;
}
