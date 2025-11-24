// lib/listening/types.ts

export const LISTENING_MODULE = 'listening' as const;

export type ListeningModule = typeof LISTENING_MODULE;

export type ListeningDifficulty = 'easy' | 'medium' | 'hard';

export type ListeningMode = 'practice' | 'mock' | 'game';

export type ListeningQuestionType =
  | 'multiple_choice_single'
  | 'multiple_choice_multiple'
  | 'matching'
  | 'map'
  | 'plan'
  | 'form_completion'
  | 'note_completion'
  | 'table_completion'
  | 'diagram_completion'
  | 'short_answer';

export type ListeningSectionNumber = 1 | 2 | 3 | 4;

export interface ListeningQuestionOption {
  id: string;
  /** Label shown to the user (A, B, C, etc. or full text) */
  label: string;
  /** Canonical value used to check correctness */
  value: string;
}

export interface ListeningQuestion {
  id: string;
  testId: string;
  sectionId: string;
  questionNumber: number;
  sectionNumber: ListeningSectionNumber;
  type: ListeningQuestionType;
  prompt: string;
  /** Optional extra text, image or description reference */
  context?: string | null;
  options?: ListeningQuestionOption[];
  /** Canonical correct answers (normalized string array) */
  correctAnswers: string[];
  maxScore: number;
  /** Optional mapping to audio regions (in ms) */
  audioStartMs?: number | null;
  audioEndMs?: number | null;
}

export interface ListeningSection {
  id: string;
  testId: string;
  sectionNumber: ListeningSectionNumber;
  title: string;
  description?: string | null;
  questions: ListeningQuestion[];
}

export interface ListeningTest {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  difficulty: ListeningDifficulty;
  isMock: boolean;
  totalQuestions: number;
  totalScore: number;
  durationSeconds: number;
  audioStorageKey: string | null;
  sections: ListeningSection[];
}

/**
 * Lightweight card for listings.
 */
export interface ListeningTestSummary {
  id: string;
  slug: string;
  title: string;
  difficulty: ListeningDifficulty;
  isMock: boolean;
  totalQuestions: number;
  durationSeconds: number;
  /** Optional band range estimate (e.g. [5.0, 7.0]) */
  estimatedBandRange?: [number, number];
}

export type ListeningAttemptStatus = 'in_progress' | 'submitted' | 'expired' | 'cancelled';

export interface ListeningAttemptAnswer {
  questionId: string;
  /** Raw value(s) provided by user, before normalization */
  value: string | string[];
  /** Filled by evaluation layer */
  isCorrect?: boolean;
  score?: number;
}

export interface ListeningAttempt {
  id: string;
  testId: string;
  userId: string;
  mode: ListeningMode;
  status: ListeningAttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  /** 0–maxScore raw marks */
  rawScore: number | null;
  /** 0–9 band estimation */
  bandScore: number | null;
  timeSpentSeconds: number | null;
  answers: ListeningAttemptAnswer[];
}

/**
 * Analytics structures
 */

export interface ListeningQuestionTypeStats {
  type: ListeningQuestionType;
  attempts: number;
  correct: number;
  accuracy: number; // 0–1
  avgTimeSeconds: number | null;
}

export interface ListeningBandSnapshot {
  attemptId: string;
  testSlug: string;
  attemptedAt: string;
  mode: ListeningMode;
  rawScore: number;
  maxScore: number;
  bandScore: number;
}

export interface ListeningAnalyticsSummary {
  totalAttempts: number;
  completedAttempts: number;
  avgBandScore: number | null;
  bestBandScore: number | null;
  recentAttempts: ListeningBandSnapshot[];
  questionTypeStats: ListeningQuestionTypeStats[];
  totalTimeSeconds: number;
}
