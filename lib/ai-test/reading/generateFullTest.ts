// lib/ai-test/reading/generateFullTest.ts

/**
 * Config coming from your AI Reading Test Builder UI / API.
 * Keep it flexible – we don't care about shape too much right now.
 */
export type ReadingAiTestConfig = {
  level?: 'easy' | 'medium' | 'hard';
  topics?: string[];
  passageCount?: number;
  questionsPerPassage?: number;
  targetBand?: number;
  userId?: string;
};

/**
 * Minimal shape of a "generated" reading test.
 * Later we can align this to your real `reading_tests` schema.
 */
export type GeneratedReadingTest = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  passageCount: number;
  questionCount: number;
};

/**
 * Core generator – currently just a stub that returns fake data
 * so the API route can compile and work end-to-end.
 *
 * Later we’ll connect this to:
 *  - OpenAI / Gemini to actually generate passages & questions
 *  - Supabase to insert into `reading_tests`, `reading_passages`, `reading_questions`
 */
export async function generateFullTest(
  config: ReadingAiTestConfig,
): Promise<GeneratedReadingTest> {
  const now = Date.now();
  const level = config.level ?? 'medium';
  const passageCount = config.passageCount ?? 3;
  const questionsPerPassage = config.questionsPerPassage ?? 13;

  const questionCount = passageCount * questionsPerPassage;

  return {
    id: `ai-reading-${now}`,
    slug: `ai-reading-${level}-${now}`,
    title: `AI Reading Test (${level.toUpperCase()})`,
    description:
      'AI-generated IELTS-style reading test. This is a stub result – replace with real AI pipeline.',
    passageCount,
    questionCount,
  };
}

/**
 * Aliases so whatever we imported in create.ts won't break,
 * even if we change naming later.
 */
export async function generateFullReadingTest(
  config: ReadingAiTestConfig,
): Promise<GeneratedReadingTest> {
  return generateFullTest(config);
}

export async function generateReadingFullTest(
  config: ReadingAiTestConfig,
): Promise<GeneratedReadingTest> {
  return generateFullTest(config);
}

// Default export as well, in case the route uses `default` import.
export default generateFullTest;
