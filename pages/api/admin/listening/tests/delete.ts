// pages/api/admin/listening/tests/delete.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import { withPlan } from '@/lib/withPlan';

const Body = z.object({
  id: z.string().uuid(),
});

type Data =
  | { ok: true }
  | { error: string; details?: unknown };

async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
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

  const { id } = parse.data;

  const supabase = getServerClient(req, res);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return res.status(500).json({ error: 'Failed to load auth user' });
  }
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { error } = await supabase
    .from('listening_tests')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(500).json({
      error: 'Failed to delete listening test',
      details: error.message,
    });
  }

  return res.status(200).json({ ok: true });
}

export default withPlan('master', handler, { allowRoles: ['admin'] });
