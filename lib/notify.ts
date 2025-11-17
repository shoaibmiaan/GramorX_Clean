// lib/notify.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export type NotificationChannel = 'email' | 'whatsapp' | 'sms';

export type NotificationContact = {
  channel: NotificationChannel;
  value: string;
};

/**
 * Tries to find the best contact for a user.
 * 1) Look in a dedicated `notification_contacts` table (if it exists).
 * 2) Fallback to profile email / phone.
 */
export async function getNotificationContactByUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationContact | null> {
  // 1) Custom table (if you have it)
  const { data: customRows } = await supabase
    .from('notification_contacts')
    .select('channel, value')
    .eq('user_id', userId)
    .limit(1);

  if (customRows && customRows.length > 0) {
    const row = customRows[0] as { channel: NotificationChannel; value: string };
    return row;
  }

  // 2) Fallback: use profile / auth user email if available
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, phone')
    .eq('id', userId)
    .single();

  if (profile?.email) {
    return { channel: 'email', value: profile.email as string };
  }

  if (profile?.phone) {
    return { channel: 'whatsapp', value: profile.phone as string };
  }

  return null;
}

const Notify = {
  getNotificationContactByUser,
};

export default Notify;
// lib/notify.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export type NotificationChannel = 'email' | 'whatsapp' | 'sms';

export type NotificationContact = {
  channel: NotificationChannel;
  value: string;
};

/**
 * Tries to find the best contact for a user.
 * 1) Look in a dedicated `notification_contacts` table (if it exists).
 * 2) Fallback to profile email / phone.
 */
export async function getNotificationContactByUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationContact | null> {
  // 1) Custom table (if you have it)
  const { data: customRows } = await supabase
    .from('notification_contacts')
    .select('channel, value')
    .eq('user_id', userId)
    .limit(1);

  if (customRows && customRows.length > 0) {
    const row = customRows[0] as { channel: NotificationChannel; value: string };
    return row;
  }

  // 2) Fallback: use profile / auth user email if available
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, phone')
    .eq('id', userId)
    .single();

  if (profile?.email) {
    return { channel: 'email', value: profile.email as string };
  }

  if (profile?.phone) {
    return { channel: 'whatsapp', value: profile.phone as string };
  }

  return null;
}

const Notify = {
  getNotificationContactByUser,
};

export default Notify;
