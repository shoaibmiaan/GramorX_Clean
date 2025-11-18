import type { NextApiHandler } from 'next';

import { createListHandler } from '@/lib/mock/apiFactory';

const handler: NextApiHandler = createListHandler('reading');

export default handler;
