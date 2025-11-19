import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import type { NotificationChannel } from '@/lib/notifications/types';
import { getServerClient } from '@/lib/supabaseServer';

const ChannelEnum = z.enum(['in_app', 'email', 'whatsapp', 'push']);

const UpdateSchema = z.object({
  channel: ChannelEnum,
  enabled: z.boolean(),
  source: z.string().default('web'),
});

type PreferenceItem = {
  channel: NotificationChannel;
  enabled: boolean;
  updatedAt: string;
};

type LegacyPreferences = {
  channels: { email: boolean; whatsapp: boolean };
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  timezone: string;
  email: string | null;
  emailOptIn: boolean;
  whatsappOptIn: boolean;
  smsOptIn: boolean;
  phone: string | null;
  phoneVerified: boolean;
};

type PreferencesResponse = { items: PreferenceItem[]; preferences: LegacyPreferences } | { error: string };

type OptInRow = {
  user_id: string;
  channel: string | null;
  enabled: boolean | null;
  channels: string[] | null;
  email_opt_in: boolean | null;
  wa_opt_in: boolean | null;
  updated_at: string | null;
};

async function fetchPreferenceRows(supabase: ReturnType<typeof getServerClient>, userId: string) {
  const { data, error } = await supabase
    .from('notifications_opt_in')
    .select('user_id, channel, enabled, channels, email_opt_in, wa_opt_in, updated_at')
    .eq('user_id', userId);

  if (error) throw error;
  return (data ?? []) as OptInRow[];
}

function buildPreferences(rows: OptInRow[]): PreferenceItem[] {
  const defaults: Record<NotificationChannel, PreferenceItem> = {
    in_app: { channel: 'in_app', enabled: true, updatedAt: new Date().toISOString() },
    email: { channel: 'email', enabled: true, updatedAt: new Date().toISOString() },
    whatsapp: { channel: 'whatsapp', enabled: false, updatedAt: new Date().toISOString() },
    push: { channel: 'push', enabled: false, updatedAt: new Date().toISOString() },
  };

  if (rows.length === 0) {
    return Object.values(defaults);
  }

  const latest = rows[0];
  const updatedAt = latest?.updated_at ?? new Date().toISOString();
  const array = new Set((latest?.channels ?? []).map((value) => value?.toLowerCase()).filter(Boolean));

  if (typeof latest?.email_opt_in === 'boolean') {
    defaults.email.enabled = latest.email_opt_in;
  } else {
    defaults.email.enabled = array.has('email');
  }

  if (typeof latest?.wa_opt_in === 'boolean') {
    defaults.whatsapp.enabled = latest.wa_opt_in;
  } else {
    defaults.whatsapp.enabled = array.has('whatsapp');
  }

  defaults.push.enabled = array.has('push');
  defaults.in_app.enabled = true;

  (rows ?? []).forEach((row) => {
    const channel = row.channel ? row.channel.toLowerCase() : null;
    if (channel && channel in defaults && typeof row.enabled === 'boolean') {
      defaults[channel as NotificationChannel].enabled = row.enabled;
      defaults[channel as NotificationChannel].updatedAt = row.updated_at ?? updatedAt;
    }
  });

  return Object.values(defaults).map((item) => ({ ...item, updatedAt }));
}

function toLegacyPreferences(items: PreferenceItem[]): LegacyPreferences {
  const map = new Map(items.map((item) => [item.channel, item] as const));
  return {
    channels: {
      email: map.get('email')?.enabled ?? true,
      whatsapp: map.get('whatsapp')?.enabled ?? false,
    },
    quietHoursStart: null,
    quietHoursEnd: null,
    timezone: 'UTC',
    email: null,
    emailOptIn: map.get('email')?.enabled ?? true,
    whatsappOptIn: map.get('whatsapp')?.enabled ?? false,
    smsOptIn: false,
    phone: null,
    phoneVerified: false,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<PreferencesResponse>) {
  const supabase = getServerClient(req, res);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const rows = await fetchPreferenceRows(supabase, user.id);
      const items = buildPreferences(rows);
      return res.status(200).json({ items, preferences: toLegacyPreferences(items) });
    }

    if (req.method === 'POST') {
      const body = UpdateSchema.safeParse(req.body);
      if (!body.success) {
        return res.status(400).json({ error: 'Invalid payload' });
      }

      const payload = body.data;
      const rows = await fetchPreferenceRows(supabase, user.id);
      const current = rows[0] ?? null;
      const channelSet = new Set<string>((current?.channels ?? []).map((value) => value?.toLowerCase()).filter(Boolean));

      if (payload.channel !== 'in_app') {
        if (payload.enabled) channelSet.add(payload.channel);
        else channelSet.delete(payload.channel);
      }

      const upsertPayload = {
        user_id: user.id,
        channel: payload.channel,
        enabled: payload.enabled,
        channels: Array.from(channelSet),
        email_opt_in: payload.channel === 'email' ? payload.enabled : current?.email_opt_in ?? true,
        wa_opt_in: payload.channel === 'whatsapp' ? payload.enabled : current?.wa_opt_in ?? false,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('notifications_opt_in')
        .upsert(upsertPayload, { onConflict: 'user_id' });

      if (upsertError) {
        return res.status(500).json({ error: upsertError.message });
      }

      await supabase.from('notification_consent_events').insert({
        user_id: user.id,
        channel: payload.channel,
        action: payload.enabled ? 'opt_in' : 'opt_out',
        source: payload.source,
        meta: {},
      });

      const nextRows = await fetchPreferenceRows(supabase, user.id);
      const items = buildPreferences(nextRows);
      return res.status(200).json({ items, preferences: toLegacyPreferences(items) });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end('Method Not Allowed');
  } catch (error) {
    console.error('[notifications/preferences] failed', error);
    const message = error instanceof Error ? error.message : 'Operation failed';
    return res.status(500).json({ error: message });
  }
}
