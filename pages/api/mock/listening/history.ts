import type { NextApiHandler } from 'next';

import { createHistoryHandler } from '@/lib/mock/apiFactory';

const handler: NextApiHandler = createHistoryHandler('listening');

export default handler;
