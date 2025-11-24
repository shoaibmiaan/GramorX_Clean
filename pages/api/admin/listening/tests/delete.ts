// pages/api/admin/listening/tests/delete.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { getServerClient } from '@/lib/supabaseServer';

const BodySchema = z.object({
  id: z.string().uuid(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = BodySchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid body' });
  const { id } = parse.data;

  const supabase = getServerClient({ req, res });

  // TODO: admin guard
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { error } = await supabase.from('listening_tests').delete().eq('id', id);

  if (error) {
    console.error('[admin/listening/tests/delete] failed', error);
    return res.status(500).json({ error: 'Failed to delete test' });
  }

  return res.status(200).json({ ok: true });
}
