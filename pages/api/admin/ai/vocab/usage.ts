// pages/api/admin/ai/vocab/usage.ts

import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  ok: boolean;
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  // TODO: Later we can hook this to Supabase usage stats.
  return res.status(200).json({
    ok: true,
    message:
      'AI vocab usage endpoint is currently a stub on this branch (no Supabase auth helpers needed).',
  });
}
