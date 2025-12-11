// pages/api/mock/writing/attempt.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';
import { withPlan } from '@/lib/withPlan';

// ---------- ZOD BODY SCHEMA ----------

const BodySchema = z.object({
  testId: z.string().uuid(),
  testSlug: z.string().min(1),
  task1Text: z.string().min(1, 'Task 1 response cannot be empty'),
  task2Text: z.string().min(1, 'Task 2 response cannot be empty'),
  autoSubmit: z.boolean().optional(),
});

type Body = z.infer<typeof BodySchema>;

type Data =
  | { attemptId: string }
  | {
      error: string;
      details?: unknown;
    };

// ---------- CORE HANDLER (no plan logic) ----------

async function baseHandler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = BodySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      error: 'Invalid body',
      details: parse.error.flatten(),
    });
  }

  const body: Body = parse.data;

  const supabase = getServerClient<Database>(req, res);

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();

  if (userErr) {
    return res.status(500).json({ error: 'Failed to resolve user session' });
  }

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // ---------- RE-CHECK TEST SERVER-SIDE (no trust on client) ----------
  const { data: testRow, error: testErr } = await supabase
    .from('writing_tests')
    .select('id, slug, is_active')
    .eq('id', body.testId)
    .maybeSingle();

  if (testErr) {
    return res.status(500).json({ error: 'Failed to load Writing test' });
  }

  if (!testRow || !testRow.is_active || testRow.slug !== body.testSlug) {
    return res.status(400).json({ error: 'Invalid or inactive Writing test' });
  }

  // ---------- INSERT ATTEMPT ----------
  // Adjust this shape to match Database['public']['Tables']['attempts_writing']['Insert']
  const insertPayload: Database['public']['Tables']['attempts_writing']['Insert'] = {
    user_id: user.id,
    test_id: testRow.id,
    task1_text: body.task1Text,
    task2_text: body.task2Text,
    auto_submitted: body.autoSubmit ?? false,
    // If your table has more NOT NULL columns (e.g. ai_overall_band), either:
    // - provide defaults here, or
    // - set defaults in Supabase (recommended).
  };

  const { data: attemptRow, error: attemptErr } = await supabase
    .from('attempts_writing')
    .insert(insertPayload)
    .select('id')
    .maybeSingle();

  if (attemptErr || !attemptRow) {
    console.error('attempts_writing insert error', attemptErr);
    return res.status(500).json({
      error: 'Failed to create Writing attempt',
    });
  }

  // In future you can trigger AI scoring here or via DB trigger / background job.

  return res.status(200).json({ attemptId: attemptRow.id });
}

// ---------- EXPORT WITH PLAN GUARD ----------

// Plans: 'free' | 'starter' | 'booster' | 'master'
// allowRoles default is usually admin/teacher; we still pass explicitly.
export default withPlan(
  'free',
  async (req: NextApiRequest, res: NextApiResponse<Data>) => {
    return baseHandler(req, res);
  },
  {
    allowRoles: ['admin', 'teacher'],
  },
);
