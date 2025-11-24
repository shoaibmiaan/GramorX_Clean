// pages/api/notifications/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';

import listHandler, {
  type NotificationsListResponse,
} from './list';

type ErrorResponse = { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NotificationsListResponse | ErrorResponse>
) {
  // For now: GET /api/notifications behaves same as /api/notifications/list
  if (req.method === 'GET') {
    return listHandler(req, res);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
