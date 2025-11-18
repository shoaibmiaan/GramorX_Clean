import type { NextApiHandler } from 'next';

import { createStartHandler } from '@/lib/mock/apiFactory';

const handler: NextApiHandler = createStartHandler('writing');

export default handler;
