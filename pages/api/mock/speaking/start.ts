import type { NextApiHandler } from 'next';

import { createStartHandler } from '@/lib/mock/apiFactory';

const handler: NextApiHandler = createStartHandler('speaking');

export default handler;
