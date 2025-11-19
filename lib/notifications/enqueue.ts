import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/types/supabase';

import type { NotificationChannel, NotificationDTO } from './types';
import type { NotificationEventKey } from './catalog';

const FALLBACK_MESSAGE = 'You have a new notification';
const CHANNELS: NotificationChannel[] = ['in_app', 'email', 'whatsapp', 'push'];

export class DuplicateNotificationEventError extends Error {
  constructor(public readonly eventId?: string | null) {
    super('notification_event_duplicate');
    this.name = 'DuplicateNotificationEventError';
  }
}

export type EnqueueNotificationInput = {
  userId: string;
  eventKey: NotificationEventKey | string;
  payload?: Record<string, unknown>;
  channels?: NotificationChannel[];
  channelOverride?: NotificationChannel;
  idempotencyKey?: string | null;
};

export type EnqueueNotificationResult = {
  eventId: string | null;
  notifications: NotificationDTO[];
  skippedChannels: NotificationChannel[];
};

type NotificationRow = Database['notifications'];
type TemplateRow = Database['notification_templates'];
type OptInRow = Database['notifications_opt_in'];
type DeliveryRow = Database['notification_deliveries'];

type TemplateSelection = TemplateRow & {
  event_key?: string | null;
  template_key?: string | null;
  channel?: string | null;
  title_template?: string | null;
  body_template?: string | null;
  subject?: string | null;
  body?: string | null;
};

type OptInSelection = Pick<
  OptInRow,
  'channel' | 'enabled' | 'email_opt_in' | 'wa_opt_in' | 'channels'
>;

type DeliveryInsert = Pick<
  DeliveryRow,
  'event_id' | 'template_id' | 'channel' | 'status' | 'attempt_count' | 'metadata' | 'notification_id'
> & {
  created_at?: string;
  sent_at?: string | null;
  error?: string | null;
};

const LEGACY_MESSAGE_KEYS = ['message', 'body', 'title'];

function normaliseChannel(value: string | null | undefined): NotificationChannel | null {
  if (!value) return null;
  const token = value.trim().toLowerCase();
  if (token === 'sms') return 'whatsapp';
  if (CHANNELS.includes(token as NotificationChannel)) {
    return token as NotificationChannel;
  }
  return null;
}

function fallbackTitle(eventKey: string): string {
  if (!eventKey) return 'GramorX update';
  return eventKey
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function fallbackBody(payload: Record<string, unknown>): string {
  for (const key of LEGACY_MESSAGE_KEYS) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return FALLBACK_MESSAGE;
}

function renderTemplate(
  template: string | null | undefined,
  payload: Record<string, unknown>,
): string | null {
  if (!template) return null;
  const rendered = template.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key) => {
    const parts = String(key).split('.');
    let current: unknown = payload;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[part];
      } else {
        current = undefined;
        break;
      }
    }
    return current == null ? '' : String(current);
  });
  const value = rendered.trim();
  return value.length > 0 ? value : null;
}

function mapRowToDto(row: NotificationRow): NotificationDTO {
  const createdAt = row.created_at ?? new Date().toISOString();
  const readAt =
    (row as Record<string, any>).read_at ??
    ((row as Record<string, any>).read === true || (row as Record<string, any>).is_read === true
      ? createdAt
      : null);
  return {
    id: String(row.id),
    title: (row as Record<string, any>).title ?? null,
    body: (row as Record<string, any>).body ?? null,
    message: (row as Record<string, any>).message ?? ((row as Record<string, any>).body ?? null),
    url: (row as Record<string, any>).url ?? null,
    type: (row as Record<string, any>).type ?? null,
    channel: (row as Record<string, any>).channel ?? null,
    readAt,
    createdAt,
  };
}

async function loadTemplates(
  supabase: SupabaseClient<Database>,
  eventKey: string,
): Promise<TemplateSelection[]> {
  const { data, error } = await supabase
    .from('notification_templates')
    .select('id, event_key, template_key, channel, title_template, body_template, subject, body, default_enabled')
    .or(`event_key.eq.${eventKey},template_key.eq.${eventKey}`);

  if (error) throw error;
  return (data ?? []) as TemplateSelection[];
}

async function loadPreferences(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Record<NotificationChannel, boolean>> {
  const defaults: Record<NotificationChannel, boolean> = {
    in_app: true,
    email: true,
    whatsapp: false,
    push: false,
  };

  const { data, error } = await supabase
    .from('notifications_opt_in')
    .select('channel, enabled, email_opt_in, wa_opt_in, channels')
    .eq('user_id', userId);

  if (error) throw error;
  const rows = (data ?? []) as OptInSelection[];

  if (rows.length === 0) {
    return defaults;
  }

  for (const row of rows) {
    const channel = normaliseChannel((row.channel as string | null) ?? null);
    if (channel) {
      if (typeof row.enabled === 'boolean') {
        defaults[channel] = row.enabled;
      }
      continue;
    }

    if (typeof row.email_opt_in === 'boolean') {
      defaults.email = row.email_opt_in;
    }
    if (typeof row.wa_opt_in === 'boolean') {
      defaults.whatsapp = row.wa_opt_in;
    }
    const array = Array.isArray(row.channels) ? (row.channels as string[]) : [];
    array
      .map((value) => normaliseChannel(value))
      .filter((value): value is NotificationChannel => Boolean(value))
      .forEach((value) => {
        if (value !== 'in_app') {
          defaults[value] = true;
        }
      });
  }

  return defaults;
}

function resolveRequestedChannels(
  input: EnqueueNotificationInput,
  templates: TemplateSelection[],
): NotificationChannel[] {
  const set = new Set<NotificationChannel>();
  if (input.channelOverride) {
    set.add(input.channelOverride);
  }
  (input.channels ?? [])
    .map((value) => normaliseChannel(value))
    .filter((value): value is NotificationChannel => Boolean(value))
    .forEach((value) => set.add(value));

  if (set.size === 0) {
    templates
      .map((tpl) => normaliseChannel((tpl.channel as string | null) ?? null))
      .filter((value): value is NotificationChannel => Boolean(value))
      .forEach((value) => set.add(value));
  }

  set.add('in_app');
  return Array.from(set.values()).filter((value) => CHANNELS.includes(value));
}

async function insertDelivery(
  supabase: SupabaseClient<Database>,
  payload: DeliveryInsert,
): Promise<void> {
  const insertPayload = {
    ...payload,
    created_at: payload.created_at ?? new Date().toISOString(),
  } satisfies Partial<DeliveryRow>;
  const { error } = await supabase.from('notification_deliveries').insert(insertPayload);
  if (error) throw error;
}

export async function enqueueNotification(
  supabase: SupabaseClient<Database>,
  input: EnqueueNotificationInput,
): Promise<EnqueueNotificationResult> {
  const payload = input.payload ?? {};
  const now = new Date().toISOString();

  const { data: eventRow, error: eventError } = await supabase
    .from('notification_events')
    .insert({
      user_id: input.userId,
      event_key: input.eventKey,
      payload,
      idempotency_key: input.idempotencyKey ?? null,
      created_at: now,
    })
    .select('id')
    .single<{ id: string }>();

  if (eventError) {
    const pgError = eventError as PostgrestError;
    if (pgError?.code === '23505' && input.idempotencyKey) {
      const { data: existing } = await supabase
        .from('notification_events')
        .select('id')
        .eq('idempotency_key', input.idempotencyKey)
        .maybeSingle<{ id: string }>();
      throw new DuplicateNotificationEventError(existing?.id ?? null);
    }
    throw eventError;
  }

  const eventId = eventRow?.id ?? null;
  const templates = await loadTemplates(supabase, input.eventKey);
  const preferences = await loadPreferences(supabase, input.userId);
  const channels = resolveRequestedChannels(input, templates);

  const notifications: NotificationDTO[] = [];
  const skipped: NotificationChannel[] = [];

  for (const channel of channels) {
    if (channel !== 'in_app' && preferences[channel] === false) {
      skipped.push(channel);
      continue;
    }

    const template = templates.find(
      (tpl) => normaliseChannel((tpl.channel as string | null) ?? null) === channel,
    );

    const renderedTitle =
      renderTemplate(template?.title_template ?? template?.subject, payload) ?? fallbackTitle(input.eventKey);
    const renderedBody =
      renderTemplate(template?.body_template ?? template?.body, payload) ?? fallbackBody(payload);

    if (channel === 'in_app') {
      const insertPayload = {
        user_id: input.userId,
        type: input.eventKey,
        title: renderedTitle,
        body: renderedBody,
        message: renderedBody,
        url: (payload.url as string | undefined) ?? null,
        channel,
        meta: payload,
        read: false,
        is_read: false,
        read_at: null,
        sent_at: now,
        template_id: template?.id ?? null,
        created_at: now,
      } as Partial<NotificationRow>;

      const { data: notificationRow, error: notificationError } = await supabase
        .from('notifications')
        .insert(insertPayload)
        .select('*')
        .single<NotificationRow>();

      if (notificationError) throw notificationError;
      notifications.push(mapRowToDto(notificationRow));

      await insertDelivery(supabase, {
        event_id: eventId!,
        template_id: template?.id ?? null,
        channel,
        status: 'sent',
        attempt_count: 1,
        metadata: { payload },
        notification_id: notificationRow.id as string,
        created_at: now,
        sent_at: now,
        error: null,
      });
      continue;
    }

    await insertDelivery(supabase, {
      event_id: eventId!,
      template_id: template?.id ?? null,
      channel,
      status: 'queued',
      attempt_count: 0,
      metadata: { payload },
      notification_id: null,
      created_at: now,
      sent_at: null,
      error: null,
    });
  }

  return {
    eventId,
    notifications,
    skippedChannels: skipped,
  };
}
