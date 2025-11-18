import type { NextApiRequest, NextApiResponse } from 'next';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/types/supabase';

export type SendNotificationPayload = {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  type?: string;
  url?: string | null;
};

async function insertNotification(
  client: SupabaseClient<Database>,
  payload: SendNotificationPayload,
) {
  const row = {
    user_id: payload.userId,
    type: payload.type ?? 'generic',
    title: payload.title,
    message: payload.body,
    body: payload.body,
    metadata: payload.data ?? null,
    url: payload.url ?? null,
    read: false,
    created_at: new Date().toISOString(),
  };

  const { error } = await client.from('notifications').insert(row);
  if (error) throw error;
}

export async function sendNotification(
  req: NextApiRequest,
  res: NextApiResponse,
  payload: SendNotificationPayload,
) {
  const supabase = getServerClient(req, res);
  await insertNotification(supabase, payload);
}

export async function sendNotificationWithClient(
  client: SupabaseClient<Database>,
  payload: SendNotificationPayload,
) {
  await insertNotification(client, payload);
}
