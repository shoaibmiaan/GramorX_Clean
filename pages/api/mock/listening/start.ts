import type { NextApiHandler } from 'next';

import { createStartHandler } from '@/lib/mock/apiFactory';

const handler: NextApiHandler = createStartHandler('listening');

export default handler;
