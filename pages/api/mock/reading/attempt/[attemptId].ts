import type { NextApiHandler } from 'next';

import { createAttemptHandler } from '@/lib/mock/apiFactory';

const handler: NextApiHandler = createAttemptHandler('reading');

export default handler;
