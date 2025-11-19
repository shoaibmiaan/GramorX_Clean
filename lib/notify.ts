// lib/notify.ts
// Unified notification helpers wired to the v2 pipeline.

import type { NextApiRequest, NextApiResponse } from 'next';
import type { SupabaseClient } from '@supabase/supabase-js';

import { enqueueNotification, DuplicateNotificationEventError } from '@/lib/notifications/enqueue';
import type { NotificationChannel } from '@/lib/notifications/types';
import { supabaseService } from '@/lib/supabaseServer';
import type { Database } from '@/types/supabase';

export type NotificationContact = {
  channel: NotificationChannel;
  value: string;
};

export type LegacyQueuePayload = {
  user_id: string;
  event_key: string;
  payload?: Record<string, unknown>;
  channels?: string[];
  idempotency_key?: string | null;
};

export type LegacyQueueResult =
  | { ok: true; id: string | null }
  | { ok: false; reason: 'duplicate'; message?: string; id?: string | null }
  | { ok: false; reason: 'error'; message: string };

function normalizeLegacyChannel(value: string | null | undefined): NotificationChannel | null {
  if (!value) return null;
  const token = value.trim().toLowerCase();
  if (token === 'sms') return 'whatsapp';
  if (token === 'in_app' || token === 'email' || token === 'whatsapp' || token === 'push') {
    return token;
  }
  return null;
}

/**
 * Tries to find the best contact for a user.
 * 1) Look in a dedicated `notification_contacts` table (if it exists).
 * 2) Fallback to profile email / phone.
 */
export async function getNotificationContactByUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<NotificationContact | null> {
  const { data: customRows } = await supabase
    .from('notification_contacts')
    .select('channel, value')
    .eq('user_id', userId)
    .limit(1);

  if (customRows && customRows.length > 0) {
    const row = customRows[0] as { channel: NotificationChannel; value: string };
    return row;
  }

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

export async function queueNotificationEvent(payload: LegacyQueuePayload): Promise<LegacyQueueResult> {
  const supabase = supabaseService<Database>();
  try {
    const channels = (payload.channels ?? [])
      .map((value) => normalizeLegacyChannel(value))
      .filter((value): value is NotificationChannel => Boolean(value));

    const result = await enqueueNotification(supabase, {
      userId: payload.user_id,
      eventKey: payload.event_key,
      payload: payload.payload,
      channels: channels.length ? channels : undefined,
      idempotencyKey: payload.idempotency_key,
    });

    return { ok: true, id: result.eventId };
  } catch (error) {
    if (error instanceof DuplicateNotificationEventError) {
      return { ok: false, reason: 'duplicate', message: error.message, id: error.eventId ?? undefined };
    }
    const message = error instanceof Error ? error.message : 'Failed to enqueue notification';
    console.error('[notify] queueNotificationEvent failed', error);
    return { ok: false, reason: 'error', message };
  }
}

export async function dispatchPending(
  _req?: NextApiRequest,
  res?: NextApiResponse,
): Promise<void | { ok: true }> {
  if (res) {
    return res.status(200).json({ ok: true });
  }
  return { ok: true };
}

export async function notify(
  userIdOrEvent: string,
  eventOrContact: NotificationContact | string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const eventKey = typeof eventOrContact === 'string' ? eventOrContact : 'generic_notification';
  const userId = (payload.user_id as string | undefined) ?? userIdOrEvent;
  if (!userId) return;
  await queueNotificationEvent({ user_id: userId, event_key: eventKey, payload });
}

export async function enqueueEvent(
  _req: NextApiRequest,
  res: NextApiResponse,
  body: LegacyQueuePayload,
): Promise<void> {
  const result = await queueNotificationEvent(body);
  if (result.ok) {
    res.status(200).json({ id: result.id });
    return;
  }
  if (result.reason === 'duplicate') {
    res.status(409).json({ error: result.message ?? 'duplicate', id: result.id ?? null });
    return;
  }
  res.status(500).json({ error: result.message });
}

const Notify = {
  notify,
  enqueueEvent,
  queueNotificationEvent,
  dispatchPending,
  getNotificationContact,
  getNotificationContactByUser,
};

export default Notify;
