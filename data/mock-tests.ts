// data/mock-tests.ts
export type MockTest = {
  slug: string;
  title: string;
  skill: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | 'Full';
  description: string;
  href: string;
};

export const mockTests: readonly MockTest[] = [
  {
    slug: 'listening-practice',
    title: 'Listening — Practice Sets',
    skill: 'Listening',
    description: 'Timed Parts 1–4 with auto-marking and transcripts.',
    href: '/mock/listening',
  },
  {
    slug: 'reading-academic',
    title: 'Reading — Academic',
    skill: 'Reading',
    description: 'Passages with all question types and AI explanations.',
    href: '/mock/reading',
  },
  {
    slug: 'writing-tasks',
    title: 'Writing — Tasks 1 & 2',
    skill: 'Writing',
    description: 'AI band breakdown, highlights, and model answers.',
    href: '/writing/mock',
  },
  {
    slug: 'speaking-simulator',
    title: 'Speaking — Simulator',
    skill: 'Speaking',
    description: 'Record, auto-transcribe, and get instant feedback.',
    href: '/mock/speaking',
  },
  {
    slug: 'full-mock',
    title: 'Full Mock Exam',
    skill: 'Full',
    description: 'Full 4-module exam flow with focus mode and review.',
    href: '/mock/full',
  },
] as const;
