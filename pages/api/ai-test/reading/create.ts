// pages/api/ai-test/reading/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';
import type {
  AiReadingTestConfig,
  AiReadingDifficulty,
} from '@/lib/ai-test/reading/types';
import { buildSmartReadingConfig } from '@/lib/ai-test/reading/personalization';
import { generateFullAiReadingTest } from '@/lib/ai-test/reading/generateFullTest';

type Difficulty =
  | 'easy'
  | 'medium'
  | 'hard'
  | 'cambridge_7_plus'
  | 'cambridge_8_plus';

type Mode = 'smart' | 'custom';

type CreateReadingTestBody = {
  title?: string;
  description?: string;
  difficulty?: Difficulty; // optional in smart mode
  targetBand?: number;
  timeMinutes?: number;
  totalQuestions?: number;
  focusTypes?: string[]; // e.g. ['mcq_single', 'tfng']
  mode?: Mode;
};

type Data = {
  testId?: string;
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = getServerClient<Database>({ req, res });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const body = req.body as CreateReadingTestBody | undefined;

  if (!body) {
    return res.status(400).json({ error: 'Missing body' });
  }

  const mode: Mode = body.mode ?? 'custom';

  let config: AiReadingTestConfig;
  let difficulty: AiReadingDifficulty;
  let targetBand: number;

  if (mode === 'smart') {
    // 🔥 Smart mode: infer everything from history
    try {
      const smart = await buildSmartReadingConfig({
        supabase,
        userId: user.id,
        overrides: {
          targetBand: body.targetBand,
        },
      });

      config = smart.config;
      difficulty = smart.difficulty;
      targetBand = smart.config.targetBand;
    } catch (err: any) {
      console.error(
        '[ai-test/reading/create] Smart mode failed, falling back to medium/custom',
        err
      );
      // If personalization fails, fall back to sane defaults.
      difficulty = 'medium';
      config = {
        mode: 'custom',
        focusTypes: body.focusTypes?.length
          ? (body.focusTypes as any)
          : ['mcq_single', 'tfng'],
        targetBand: body.targetBand ?? 6.5,
        timeMinutes: body.timeMinutes && body.timeMinutes > 0
          ? body.timeMinutes
          : 25,
        totalQuestions: body.totalQuestions && body.totalQuestions > 0
          ? body.totalQuestions
          : 13,
      };
      targetBand = config.targetBand;
    }
  } else {
    // 🎯 Custom mode: use the slider inputs from UI
    if (!body.difficulty) {
      return res.status(400).json({
        error: 'difficulty is required in custom mode',
      });
    }

    difficulty = body.difficulty;
    const safeTotalQuestions =
      body.totalQuestions && body.totalQuestions > 0
        ? body.totalQuestions
        : 13;
    const safeTimeMinutes =
      body.timeMinutes && body.timeMinutes > 0
        ? body.timeMinutes
        : 25;
    const focusTypes =
      body.focusTypes && body.focusTypes.length
        ? (body.focusTypes as any)
        : ['mcq_single', 'tfng'];

    targetBand = body.targetBand ?? 6.5;

    config = {
      mode: 'custom',
      focusTypes,
      targetBand,
      timeMinutes: safeTimeMinutes,
      totalQuestions: safeTotalQuestions,
    };
  }

  // Insert row for ai_reading_tests
  const { data: inserted, error: insertError } = await supabase
    .from('ai_reading_tests')
    .insert({
      user_id: user.id,
      title: body.title?.trim() || 'AI Reading Test',
      slug: null, // can add slugify later
      description: body.description?.trim() || null,
      difficulty,
      target_band: targetBand,
      total_questions: config.totalQuestions,
      estimated_duration_minutes: config.timeMinutes,
      config,
      status: 'draft',
      is_system_generated: false,
      is_public: false,
    })
    .select('id')
    .single();

  if (insertError || !inserted) {
    console.error(
      '[ai-test/reading/create] Error inserting ai_reading_tests',
      insertError
    );
    return res.status(500).json({ error: 'Failed to create AI reading test' });
  }

  const testId = inserted.id;

  // Immediately generate full content using AI engine
  const generationResult = await generateFullAiReadingTest({
    supabase,
    testId,
    userId: user.id,
  });

  if (!generationResult.ok) {
    console.error(
      '[ai-test/reading/create] AI generation failed:',
      generationResult.error
    );
    // We still return testId so UI can either show error or allow retry later
    return res.status(200).json({
      testId,
      message: `Test created but AI generation failed: ${generationResult.error}`,
    });
  }

  return res.status(200).json({
    testId,
    message: mode === 'smart'
      ? 'Smart AI reading test created and generated'
      : 'AI reading test created and generated',
  });
}
