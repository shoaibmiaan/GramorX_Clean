import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabaseServer';

const Body = z.object({
  attemptId: z.string().uuid(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ ok: true } | { error: string; details?: unknown }>,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = Body.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      error: 'Invalid body',
      details: parse.error.flatten(),
    });
  }

  const supabase = getServerClient(req, res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { attemptId } = parse.data;

  const { error } = await supabase
    .from('listening_attempts')
    .update({
      audio_started_at: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .is('audio_started_at', null);

  if (error) {
    console.error('[play-ping] update error', error);
    return res.status(500).json({ error: 'Failed to log audio start' });
  }

  return res.status(200).json({ ok: true });
}
