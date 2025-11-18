import type { NextApiHandler } from 'next';

import { createHistoryHandler } from '@/lib/mock/apiFactory';

const handler: NextApiHandler = createHistoryHandler('writing');

export default handler;
