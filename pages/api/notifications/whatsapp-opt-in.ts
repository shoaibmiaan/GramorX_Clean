import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { buildWhatsAppTaskMessage, dispatchWhatsAppTask } from '@/lib/tasks/whatsapp';

const BodySchema = z.object({
  consent: z.boolean(),
  sendTest: z.boolean().optional(),
  message: z.string().max(600).optional(),
});

type ResponseBody = { ok: boolean; error?: string };

function parseFunctionsError(error: unknown) {
  if (!error) return 'Failed to invoke WhatsApp task dispatcher';
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && 'message' in (error as Record<string, unknown>)) {
    return String((error as Record<string, unknown>).message);
  }
  return 'Failed to invoke WhatsApp task dispatcher';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseBody>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const parseResult = BodySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ ok: false, error: 'Invalid request body' });
  }

  const { consent, sendTest = false, message } = parseResult.data;

  const supabase = createSupabaseServerClient({ req, res });
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  try {
    const { data: existing } = await supabase
      .from('notifications_opt_in')
      .select('channels, email_opt_in, wa_opt_in')
      .eq('user_id', user.id)
      .maybeSingle<{ channels: string[] | null; email_opt_in: boolean | null; wa_opt_in: boolean | null }>();

    const channels = new Set((existing?.channels ?? []).map((entry) => entry?.toLowerCase()).filter(Boolean));
    if (consent) channels.add('whatsapp');
    else channels.delete('whatsapp');

    const upsertPayload = {
      user_id: user.id,
      channel: 'whatsapp',
      enabled: consent,
      channels: Array.from(channels),
      email_opt_in: existing?.email_opt_in ?? true,
      wa_opt_in: consent,
      updated_at: new Date().toISOString(),
    };

    const { error: optInError } = await supabase
      .from('notifications_opt_in')
      .upsert(upsertPayload, { onConflict: 'user_id' });

    if (optInError) {
      return res.status(500).json({ ok: false, error: optInError.message });
    }

    await supabase.from('notification_consent_events').insert({
      user_id: user.id,
      channel: 'whatsapp',
      action: consent ? 'opt_in' : 'opt_out',
      source: 'whatsapp_opt_in_api',
      meta: { sendTest },
    });

    if (consent && sendTest) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('notification_channels, full_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        return res.status(500).json({ ok: false, error: profileError.message });
      }

      const confirmationMessage =
        message?.trim() ||
        buildWhatsAppTaskMessage('optInConfirmation', {
          userName: profile?.full_name ?? undefined,
        });

      const response = await dispatchWhatsAppTask(supabase, {
        userId: user.id,
        type: 'test',
        message: confirmationMessage,
        metadata: {
          source: 'api/notifications/whatsapp-opt-in',
          trigger: 'sendTest',
        },
      });

      if (response.error) {
        return res.status(502).json({ ok: false, error: parseFunctionsError(response.error) });
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error in WhatsApp opt-in API:', error);
    const messageText = error instanceof Error ? error.message : 'Operation failed';
    return res.status(500).json({ ok: false, error: messageText });
  }
}
