import type { NextApiHandler } from 'next';

import { createListHandler } from '@/lib/mock/apiFactory';

const handler: NextApiHandler = createListHandler('speaking');

export default handler;
