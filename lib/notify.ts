// lib/notify.ts
// Notification helpers for GramorX (email / WhatsApp / SMS)

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

/**
 * Legacy helper – right now just proxies to getNotificationContactByUser.
 */
export async function getNotificationContact(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationContact | null> {
  return getNotificationContactByUser(supabase, userId);
}

/**
 * Queue a notification event.
 * Currently a no-op stub so builds & cron routes don’t crash.
 */
export async function queueNotificationEvent(
  _supabase: SupabaseClient,
  _userId: string,
  _payload: unknown,
): Promise<void> {
  // TODO: implement notification queueing (insert into notification_events table)
}

/**
 * Dispatch pending queued notifications.
 * Also a stub for now.
 */
export async function dispatchPending(
  _supabase: SupabaseClient,
): Promise<void> {
  // TODO: implement dispatcher that reads pending events and sends them
}

/**
 * High-level notify helper.
 * For now it just queues the event.
 */
export async function notify(
  supabase: SupabaseClient,
  userId: string,
  payload: unknown,
): Promise<void> {
  await queueNotificationEvent(supabase, userId, payload);
}

/**
 * Alias to keep older imports happy.
 */
export async function enqueueEvent(
  supabase: SupabaseClient,
  userId: string,
  payload: unknown,
): Promise<void> {
  await queueNotificationEvent(supabase, userId, payload);
}

// Default object export – matches older usage like `Notify.notify(...)`
const Notify = {
  notify,
  enqueueEvent,
  queueNotificationEvent,
  dispatchPending,
  getNotificationContact,
  getNotificationContactByUser,
};

export default Notify;
