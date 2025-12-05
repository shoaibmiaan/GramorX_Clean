// lib/listening/types.ts

export type ListeningTest = {
  id: string;
  slug: string;
  title: string;
  description: string | null;

  // mapped from DB: listening_tests.audio_url
  audioUrl: string | null;

  // we derive this from duration_minutes in the page
  durationSeconds: number;

  // mapped from DB: listening_tests.questions
  totalQuestions: number;

  // optional extras if you want them later
  level: string | null; // DB: level
  transcript: string | null; // DB: transcript
  isPublished: boolean;

  createdAt: string;
  updatedAt: string | null;
};

export type ListeningSection = {
  id: string;
  testId: string;
  testSlug: string | null;

  orderNo: number;

  // DB: listening_sections.audio_url, or fallback to test.audioUrl
  audioUrl: string | null;

  title: string | null;
  transcript: string | null;

  startMs?: number | null;
  endMs?: number | null;

  startSec: number | null;
  endSec: number | null;

  createdAt: string;
  updatedAt: string | null;
};

export type ListeningQuestion = {
  id: string;
  testId: string;
  testSlug: string;

  sectionId: string | null;
  sectionNo: number | null;

  questionNumber: number;
  qno?: number | null;

  questionType: string | null;
  type: string | null;

  prompt: string | null;
  questionText: string | null;

  options: unknown[];

  correctAnswer: unknown;
  answerKey: unknown;

  matchLeft: unknown[];
  matchRight: unknown[];

  explanation: string | null;

  createdAt: string;
  updatedAt: string | null;
};

export type ListeningQuestionType = {
  id: string;
  key: string;
  label: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string | null;
};

// lib/listening/types.ts

export type ListeningTest = {
  id: string;
  slug: string;
  title: string;
  description: string | null;

  // legacy: full URL stored in DB (old bucket)
  audioUrl: string | null;

  // NEW: object path inside listening-audio-v2 bucket
  // e.g. 'ielts-listening-full-011.mp3'
  audioObjectPath?: string | null;

  // we derive this from duration_minutes in the page
  durationSeconds: number;

  // mapped from DB: listening_tests.questions
  totalQuestions: number;

  // ...rest of your fields stay as-is
};
