import type { NextApiHandler } from 'next';

import { createAttemptHandler } from '@/lib/mock/apiFactory';

const handler: NextApiHandler = createAttemptHandler('speaking');

export default handler;
