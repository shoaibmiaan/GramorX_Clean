import type { NextApiRequest, NextApiResponse } from 'next';

import { mockAnalyticsResponse } from '@/lib/analytics/mockData';
import type { MockAnalyticsResponse } from '@/lib/analytics/mockTypes';

export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse<MockAnalyticsResponse>,
) {
  res.status(200).json(mockAnalyticsResponse);
}
