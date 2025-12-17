// pages/api/writing/submit.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

type Db = Database['public'];

const Body = z.object({
  attemptId: z.string().uuid(),
  autoSubmitted: z.boolean().optional(),
});

type Ok = {
  ok: true;
  attemptId: string;
  submittedAt: string;
};

type Err = {
  error: string;
  details?: unknown;
  got?: unknown;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Ok | Err>) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rawBody: unknown = req.body;
  const maybeParsed: unknown =
    typeof rawBody === 'string'
      ? (() => {
          try {
            return JSON.parse(rawBody) as unknown;
          } catch {
            return rawBody;
          }
        })()
      : rawBody;

  const parse = Body.safeParse(maybeParsed);
  if (!parse.success) {
    return res.status(400).json({
      error: 'Invalid body',
      details: parse.error.flatten(),
      got: maybeParsed,
    });
  }

  const { attemptId } = parse.data;

  const supabase = getServerClient(req, res);

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) return res.status(401).json({ error: 'Unauthorized' });
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // Load attempt + verify ownership
  const attemptRes = await supabase
    .from('writing_attempts')
    .select('id,user_id,status,submitted_at')
    .eq('id', attemptId)
    .maybeSingle();

  if (attemptRes.error) return res.status(500).json({ error: attemptRes.error.message });
  if (!attemptRes.data) return res.status(404).json({ error: 'Attempt not found' });
  if (attemptRes.data.user_id !== user.id) return res.status(403).json({ error: 'Forbidden' });

  // Already submitted → return OK
  if (attemptRes.data.submitted_at) {
    return res.status(200).json({
      ok: true,
      attemptId,
      submittedAt: new Date(attemptRes.data.submitted_at).toISOString(),
    });
  }

  const nowIso = new Date().toISOString();

  const updateRes = await supabase
    .from('writing_attempts')
    .update({
      status: 'submitted',
      submitted_at: nowIso,
    } satisfies Partial<Db['Tables']['writing_attempts']['Update']>)
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .select('id,submitted_at')
    .maybeSingle();

  if (updateRes.error) return res.status(500).json({ error: updateRes.error.message });
  if (!updateRes.data?.submitted_at) return res.status(500).json({ error: 'Submit failed' });

  return res.status(200).json({
    ok: true,
    attemptId,
    submittedAt: new Date(updateRes.data.submitted_at).toISOString(),
  });
}
