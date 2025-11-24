// pages/api/notifications/preferences.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';

const ChannelsEnum = z.enum(['in_app', 'email', 'sms', 'whatsapp']);

const BodySchema = z.object({
  channels: z.array(ChannelsEnum).optional(),
  emailOptIn: z.boolean().optional(),
  smsOptIn: z.boolean().optional(),
  waOptIn: z.boolean().optional(),
  timezone: z.string().optional(),
  quietHoursStart: z.string().optional(), // HH:mm or null
  quietHoursEnd: z.string().optional(),   // HH:mm or null
});

type PreferencesResponse = {
  channels: string[];
  emailOptIn: boolean;
  smsOptIn: boolean;
  waOptIn: boolean;
  timezone: string;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
};

type ErrorResponse = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PreferencesResponse | { ok: true } | ErrorResponse>
) {
  const supabase = getServerClient(req, res);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return res.status(500).json({ error: 'Failed to resolve current user' });
  }

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('notifications_opt_in')
      .select(
        `
        user_id,
        channels,
        sms_opt_in,
        wa_opt_in,
        email_opt_in,
        timezone,
        quiet_hours_start,
        quiet_hours_end
      `
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows (PostgREST)
      console.error('[notifications/preferences] load failed', error);
      return res.status(500).json({ error: 'Failed to load preferences' });
    }

    return res.status(200).json({
      channels: (data?.channels as string[] | null) ?? ['in_app', 'email'],
      emailOptIn: data?.email_opt_in ?? true,
      smsOptIn: data?.sms_opt_in ?? false,
      waOptIn: data?.wa_opt_in ?? false,
      timezone: data?.timezone ?? 'UTC',
      quietHoursStart: data?.quiet_hours_start ?? null,
      quietHoursEnd: data?.quiet_hours_end ?? null,
    });
  }

  if (req.method === 'POST') {
    const parse = BodySchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: 'Invalid body' });
    }

    const payload = parse.data;

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.channels) {
      updatePayload.channels = payload.channels;
    }
    if (payload.emailOptIn !== undefined) {
      updatePayload.email_opt_in = payload.emailOptIn;
    }
    if (payload.smsOptIn !== undefined) {
      updatePayload.sms_opt_in = payload.smsOptIn;
    }
    if (payload.waOptIn !== undefined) {
      updatePayload.wa_opt_in = payload.waOptIn;
    }
    if (payload.timezone !== undefined) {
      updatePayload.timezone = payload.timezone;
    }
    if (payload.quietHoursStart !== undefined) {
      updatePayload.quiet_hours_start = payload.quietHoursStart;
    }
    if (payload.quietHoursEnd !== undefined) {
      updatePayload.quiet_hours_end = payload.quietHoursEnd;
    }

    const { error } = await supabase.from('notifications_opt_in').upsert(
      {
        user_id: user.id,
        ...updatePayload,
      },
      {
        onConflict: 'user_id',
      }
    );

    if (error) {
      console.error('[notifications/preferences] upsert failed', error);
      return res.status(500).json({ error: 'Failed to update preferences' });
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
