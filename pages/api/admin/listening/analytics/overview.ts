// pages/api/admin/listening/analytics/overview.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

import { getServerClient } from '@/lib/supabaseServer';
import { withPlan } from '@/lib/withPlan';

const Query = z.object({
  days: z
    .string()
    .optional()
    .transform((val) => (val ? Number(val) : undefined))
    .refine(
      (val) =>
        val === undefined || (Number.isFinite(val) && val > 0 && val <= 365),
      {
        message: 'days must be between 1 and 365',
      },
    )
    .optional(),
});

type PerTestAnalytics = {
  testId: string;
  slug: string;
  title: string;
  isMock: boolean;
  attempts: number;
  uniqueStudents: number;
  avgBand: number | null;
  avgRawScore: number | null;
};

type Overview = {
  totalAttempts: number;
  totalUniqueStudents: number;
  avgBandOverall: number | null;
};

type Data =
  | {
      overview: Overview;
      perTest: PerTestAnalytics[];
    }
  | { error: string; details?: unknown };

async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const parse = Query.safeParse(req.query);
  if (!parse.success) {
    return res.status(400).json({
      error: 'Invalid query',
      details: parse.error.flatten(),
    });
  }

  const { days } = parse.data;
  const lookbackDays = days ?? 30;

  const supabase = getServerClient(req, res);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return res.status(500).json({ error: 'Failed to load auth user' });
  }
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();
  const from = new Date(now.getTime() - lookbackDays * 24 * 60 * 60 * 1000);
  const fromIso = from.toISOString();

  const { data, error } = await supabase
    .from('attempts_listening')
    .select(
      'id, user_id, test_id, mode, status, raw_score, band_score, created_at, listening_tests(id, slug, title, is_mock)',
    )
    .eq('status', 'submitted')
    .gte('created_at', fromIso);

  if (error) {
    return res.status(500).json({
      error: 'Failed to load listening attempts',
      details: error.message,
    });
  }

  const rows = (data ?? []) as Array<{
    id: string;
    user_id: string;
    test_id: string;
    mode: 'practice' | 'mock';
    status: string;
    raw_score: number | null;
    band_score: number | null;
    created_at: string;
    listening_tests: { id: string; slug: string; title: string; is_mock: boolean } | null;
  }>;

  if (rows.length === 0) {
    return res.status(200).json({
      overview: {
        totalAttempts: 0,
        totalUniqueStudents: 0,
        avgBandOverall: null,
      },
      perTest: [],
    });
  }

  // Global overview
  const totalAttempts = rows.length;
  const uniqueStudents = new Set(rows.map((r) => r.user_id));
  let bandSum = 0;
  let bandCount = 0;

  rows.forEach((r) => {
    if (typeof r.band_score === 'number') {
      bandSum += r.band_score;
      bandCount += 1;
    }
  });

  const avgBandOverall = bandCount > 0 ? bandSum / bandCount : null;

  // Per-test aggregation
  const perTestMap = new Map<string, {
    testId: string;
    slug: string;
    title: string;
    isMock: boolean;
    attempts: number;
    studentSet: Set<string>;
    bandSum: number;
    bandCount: number;
    rawSum: number;
    rawCount: number;
  }>();

  rows.forEach((r) => {
    const t = r.listening_tests;
    if (!t) return;

    const key = t.id;

    if (!perTestMap.has(key)) {
      perTestMap.set(key, {
        testId: t.id,
        slug: t.slug,
        title: t.title,
        isMock: !!t.is_mock,
        attempts: 0,
        studentSet: new Set<string>(),
        bandSum: 0,
        bandCount: 0,
        rawSum: 0,
        rawCount: 0,
      });
    }

    const bucket = perTestMap.get(key)!;
    bucket.attempts += 1;
    bucket.studentSet.add(r.user_id);

    if (typeof r.band_score === 'number') {
      bucket.bandSum += r.band_score;
      bucket.bandCount += 1;
    }
    if (typeof r.raw_score === 'number') {
      bucket.rawSum += r.raw_score;
      bucket.rawCount += 1;
    }
  });

  const perTest: PerTestAnalytics[] = Array.from(perTestMap.values()).map(
    (bucket) => ({
      testId: bucket.testId,
      slug: bucket.slug,
      title: bucket.title,
      isMock: bucket.isMock,
      attempts: bucket.attempts,
      uniqueStudents: bucket.studentSet.size,
      avgBand:
        bucket.bandCount > 0 ? bucket.bandSum / bucket.bandCount : null,
      avgRawScore:
        bucket.rawCount > 0 ? bucket.rawSum / bucket.rawCount : null,
    }),
  );

  // Sort: mock tests first, then others by attempts desc
  perTest.sort((a, b) => {
    if (a.isMock !== b.isMock) {
      return a.isMock ? -1 : 1;
    }
    return b.attempts - a.attempts;
  });

  const overview: Overview = {
    totalAttempts,
    totalUniqueStudents: uniqueStudents.size,
    avgBandOverall,
  };

  return res.status(200).json({ overview, perTest });
}

export default withPlan('master', handler, { allowRoles: ['admin'] });
