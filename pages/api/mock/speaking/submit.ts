import type { NextApiHandler } from 'next';

import { createSubmitHandler } from '@/lib/mock/apiFactory';

const handler: NextApiHandler = createSubmitHandler('speaking');

export default handler;
