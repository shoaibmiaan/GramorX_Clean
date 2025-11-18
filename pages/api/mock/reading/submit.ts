import type { NextApiHandler } from 'next';

import { createSubmitHandler } from '@/lib/mock/apiFactory';

const handler: NextApiHandler = createSubmitHandler('reading');

export default handler;
