import { strict as assert } from 'node:assert';
import { resolve } from 'node:path';

const envPath = resolve(__dirname, '../../lib/env.ts');
require.cache[envPath] = { exports: { env: {} } };

const mockRows = [
  { id: '1', title: 'Welcome to GramorX!', created_at: new Date().toISOString(), read_at: null },
];

const supabaseClient = {
  auth: {
    getUser: async () => ({ data: { user: { id: 'user1' } } }),
  },
  from: (table: string) => {
    if (table === 'notifications') {
      return {
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: () => ({
                lt: () => ({ data: mockRows, error: null }),
                then: (resolveFn: any) => resolveFn({ data: mockRows, error: null }),
              }),
            }),
          }),
        }),
      } as any;
    }
    return {
      select: () => ({ eq: () => ({ is: () => ({ count: 1, error: null }) }) }),
    } as any;
  },
};

require.cache[require.resolve('../../lib/supabaseServer')] = {
  exports: { getServerClient: () => supabaseClient },
};

const handler = require('../../pages/api/notifications/list').default;

(async () => {
  const res = {
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      this.body = data;
      return data;
    },
    statusCode: 200 as number | undefined,
    body: undefined as any,
  };

  await handler({ method: 'GET', headers: {}, query: {} } as any, res as any);
  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.items));
  assert.equal(res.body.items[0].title, 'Welcome to GramorX!');
  console.log('notifications list API tested');
})();
