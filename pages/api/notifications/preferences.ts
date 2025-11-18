import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { NotificationChannel, NotificationsOptIn, Profiles } from '@/types/supabase';
import { Channel, PreferencesBody, type PreferencesBodyInput } from '@/types/notifications';

type PreferencesRow = Pick<
  NotificationsOptIn,
  'channels' | 'email_opt_in' | 'wa_opt_in' | 'quiet_hours_start' | 'quiet_hours_end' | 'timezone'
> & { user_id: string };

type ProfileContact = Pick<Profiles, 'email' | 'phone' | 'phone_verified' | 'timezone'> & { user_id: string };

type PreferencesResponse = PreferencesBodyInput & {
  email: string | null;
  emailOptIn: boolean;
  whatsappOptIn: boolean;
  smsOptIn: boolean;
  phone: string | null;
  phoneVerified: boolean;
};

const ChannelToggleSchema = z.object({
  channel: z.enum(['email', 'in_app']),
  type: z.string().min(1),
  enabled: z.boolean(),
});

function toChannelSet(row?: PreferencesRow | null): Set<NotificationChannel> {
  const next = new Set<NotificationChannel>();
  if (!row) {
    next.add('email');
    return next;
  }

  const channels = (row.channels ?? []) as NotificationChannel[];
  channels.forEach((channel) => {
    if (Channel.safeParse(channel).success) {
      next.add(channel);
    }
  });

  if (row.email_opt_in ?? true) {
    next.add('email');
  }

  if (row.wa_opt_in ?? false) {
    next.add('whatsapp');
  }

  return next;
}

function buildResponse(row: PreferencesRow | null, profile: ProfileContact | null): PreferencesResponse {
  const enabled = toChannelSet(row);
  const parsed = PreferencesBody.parse({
    channels: {
      email: enabled.has('email'),
      whatsapp: enabled.has('whatsapp'),
    },
    quietHoursStart: (row?.quiet_hours_start as string | null) ?? null,
    quietHoursEnd: (row?.quiet_hours_end as string | null) ?? null,
    timezone: row?.timezone ?? profile?.timezone ?? 'UTC',
  });

  const email = profile?.email ? profile.email.trim() : null;
  const phone = profile?.phone ? profile.phone.trim() : null;
  const phoneVerified = profile?.phone_verified === null ? false : Boolean(profile?.phone_verified);

  return {
    ...parsed,
    email: email && email.length > 0 ? email : null,
    emailOptIn: parsed.channels.email,
    whatsappOptIn: parsed.channels.whatsapp,
    smsOptIn: false,
    phone: phone && phone.length > 0 ? phone : null,
    phoneVerified,
  };
}

async function loadPreferences(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
): Promise<PreferencesResponse> {
  const [prefRes, profileRes] = await Promise.all([
    supabase
      .from('notifications_opt_in')
      .select(
        'user_id, channels, email_opt_in, wa_opt_in, quiet_hours_start, quiet_hours_end, timezone',
      )
      .eq('user_id', userId)
      .maybeSingle<PreferencesRow>(),
    supabase
      .from('profiles')
      .select('user_id, email, phone, phone_verified, timezone')
      .eq('user_id', userId)
      .maybeSingle<ProfileContact>(),
  ]);

  if (prefRes.error) {
    throw prefRes.error;
  }

  if (profileRes.error && profileRes.error.code !== 'PGRST116') {
    throw profileRes.error;
  }

  return buildResponse(prefRes.data ?? null, profileRes.data ?? null);
}

function normaliseTime(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildChannelsArray(channels: Record<string, boolean>): string[] {
  const next: string[] = [];
  Object.entries(channels).forEach(([key, enabled]) => {
    if (enabled) {
      next.push(key);
    }
  });
  return next;
}

async function recordConsent(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
  channel: string,
  enabled: boolean,
  metadata: Record<string, any>,
) {
  try {
    await supabase.from('notification_consent_events').insert({
      user_id: userId,
      actor_id: userId,
      channel,
      action: enabled ? 'opt_in' : 'opt_out',
      metadata,
    });
  } catch (error) {
    console.warn('[notifications.preferences] consent log failed', error);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createSupabaseServerClient({ req, res });
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const preferences = await loadPreferences(supabase, user.id);
      return res.status(200).json({ preferences });
    }

    if (req.method === 'POST') {
      const toggleParsed = ChannelToggleSchema.safeParse(req.body);
      if (toggleParsed.success) {
        const payload = toggleParsed.data;

        const { data: existing } = await supabase
          .from('notifications_opt_in')
          .select('channels, email_opt_in')
          .eq('user_id', user.id)
          .maybeSingle();

        const channels = new Set<string>(
          Array.isArray(existing?.channels) ? (existing?.channels as string[]) : [],
        );

        const update: Partial<NotificationsOptIn> & { user_id: string } = { user_id: user.id };

        if (payload.channel === 'in_app') {
          if (payload.enabled) {
            channels.add('in_app');
          } else {
            channels.delete('in_app');
          }
          update.channels = Array.from(channels);
        } else if (payload.channel === 'email') {
          update.email_opt_in = payload.enabled;
        }

        const { error: upsertError } = await supabase
          .from('notifications_opt_in')
          .upsert(update, { onConflict: 'user_id' });

        if (upsertError) {
          return res.status(500).json({ error: upsertError.message });
        }

        await recordConsent(supabase, user.id, payload.channel, payload.enabled, {
          type: payload.type,
        });

        return res.status(200).json({ ok: true });
      }

      const parsed = PreferencesBody.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Invalid payload',
          details: parsed.error.flatten(),
        });
      }

      const body = parsed.data;

      const upsertPayload = {
        user_id: user.id,
        channels: buildChannelsArray(body.channels),
        email_opt_in: body.channels.email ?? false,
        wa_opt_in: body.channels.whatsapp ?? false,
        quiet_hours_start: normaliseTime(body.quietHoursStart ?? null),
        quiet_hours_end: normaliseTime(body.quietHoursEnd ?? null),
        timezone: body.timezone ?? 'UTC',
      };

      const { error: upsertError } = await supabase
        .from('notifications_opt_in')
        .upsert(upsertPayload, { onConflict: 'user_id' });

      if (upsertError) {
        return res.status(500).json({ error: upsertError.message });
      }

      await Promise.all([
        recordConsent(supabase, user.id, 'email', !!body.channels.email, { type: 'bulk_preferences' }),
        recordConsent(
          supabase,
          user.id,
          'whatsapp',
          !!body.channels.whatsapp,
          { type: 'bulk_preferences' },
        ),
      ]);

      const preferences = await loadPreferences(supabase, user.id);
      return res.status(200).json({ preferences });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end('Method Not Allowed');
  } catch (error) {
    console.error('Error in preferences API:', error);
    const message = error instanceof Error ? error.message : 'Operation failed';
    return res.status(500).json({ error: message });
  }
}