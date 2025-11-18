import type { ListeningPaper } from '@/data/listening';
import type { ReadingPaper } from '@/data/reading';
import type { MockAttempt } from '@/types/supabase';
import type { MockAttemptStatus, MockModuleId } from '@/types/mock';

type QuestionOption = string;

export type NormalizedQuestion = {
  id: string;
  prompt: string;
  answer: string;
  section?: string;
  options?: QuestionOption[];
};

export type ModuleMockMeta = {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  questionCount?: number;
  sectionCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: string[];
};

export type ListeningMockContent = {
  id: string;
  title: string;
  durationSec: number;
  questions: NormalizedQuestion[];
  paper: ListeningPaper;
};

export type ReadingMockContent = {
  id: string;
  title: string;
  durationSec: number;
  questions: NormalizedQuestion[];
  paper: ReadingPaper;
};

export type WritingMockContent = {
  id: string;
  title: string;
  task1Prompt: string;
  task2Prompt: string;
  durationSec: number;
  minWordsTask1: number;
  minWordsTask2: number;
};

export type SpeakingMockContent = {
  id: string;
  title: string;
  description: string;
  part1Questions: string[];
  part2CueCard: string[];
  part3Questions: string[];
  prepSeconds: number;
  speakSeconds: number;
};

export type ModuleMockContent =
  | { module: 'listening'; content: ListeningMockContent }
  | { module: 'reading'; content: ReadingMockContent }
  | { module: 'writing'; content: WritingMockContent }
  | { module: 'speaking'; content: SpeakingMockContent };

export type ModuleMockHistoryItem = {
  id: string;
  module: MockModuleId;
  mockId: string;
  mockTitle?: string;
  status: MockAttemptStatus;
  startedAt: string;
  submittedAt?: string | null;
  band?: number | null;
  scoreSummary?: Record<string, unknown> | null;
};

export type ModuleMockListResponse = {
  module: MockModuleId;
  items: ModuleMockMeta[];
};

export type MockAttemptRecord = MockAttempt & { band?: number | null };
