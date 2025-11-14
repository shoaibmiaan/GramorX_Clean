// pages/api/ai/vocab/rewrite.ts

import type { NextApiRequest, NextApiResponse } from 'next';

type RewriteResponse = {
  ok: boolean;
  original?: string;
  rewritten?: string;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RewriteResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  const { text } = (req.body ?? {}) as { text?: string };

  if (!text || typeof text !== 'string') {
    return res
      .status(400)
      .json({ ok: false, message: 'Missing "text" in request body' });
  }

  // TODO: Later: hook this to real AI rewrite logic.
  // For now, just echo back the same text so the endpoint is valid.
  const rewritten = text.trim();

  return res.status(200).json({
    ok: true,
    original: text,
    rewritten,
  });
}
