// pages/api/mock/writing/start.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';

type ApiOk = { attemptId: string; startedAt: string };
type ApiErr = { error: string; details?: unknown };

const Body = z.object({
  testId: z.string().min(1),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>,
) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const parse = Body.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid body', details: parse.error.flatten() });

  const supabase = getServerClient(req, res);
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  const user = auth.user;

  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized', details: authErr ?? null });

  const { testId } = parse.data;

  // 1) Reuse an active attempt if it exists
  const { data: existing, error: existingErr } = await supabase
    .from('writing_attempts')
    .select('id, started_at, status')
    .eq('user_id', user.id)
    .eq('test_id', testId)
    .in('status', ['created', 'in_progress']) // ✅ removed "draft"
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingErr) return res.status(500).json({ error: 'Failed to lookup attempt', details: existingErr });

  if (existing?.id && existing.started_at) {
    return res.status(200).json({
      attemptId: String(existing.id),
      startedAt: String(existing.started_at),
    });
  }

  // 2) Create a new attempt
  const startedAt = new Date().toISOString();

  const { data: created, error: createErr } = await supabase
    .from('writing_attempts')
    .insert({
      user_id: user.id,
      test_id: testId,
      status: 'in_progress',
      started_at: startedAt,
    })
    .select('id, started_at')
    .single();

  if (createErr || !created?.id || !created?.started_at) {
    return res.status(500).json({ error: 'Failed to start attempt', details: createErr ?? null });
  }

  return res.status(200).json({
    attemptId: String(created.id),
    startedAt: String(created.started_at),
  });
}
