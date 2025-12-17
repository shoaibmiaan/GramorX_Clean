// lib/writing/evaluation/types.ts
export type CriteriaKey = 'TR' | 'CC' | 'LR' | 'GRA';

export type WritingEvalInput = {
  attemptId: string;
  userId: string;

  task1: { prompt: string; text: string; minWords: number };
  task2: { prompt: string; text: string; minWords: number };

  meta?: Record<string, unknown>;
};

export type WritingEvalResult = {
  overallBand: number;
  task1Band: number;
  task2Band: number;

  criteria: Record<CriteriaKey, number>;

  shortVerdictTask1?: string;
  shortVerdictTask2?: string;

  criteriaNotes: Partial<Record<CriteriaKey, string[]>>;
  taskNotes: Partial<Record<'task1' | 'task2', string[]>>;

  warnings: string[];
  nextSteps: string[];

  provider: 'rules_v2' | 'ai_v1';
  model: string | null;
  meta: Record<string, unknown>;
};
