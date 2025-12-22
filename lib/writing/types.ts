// lib/writing/types.ts
// Shared types for Writing result surfaces. Keep these strict (no any).

export type BandScore = number;

export type CriteriaKey = 'TR' | 'CC' | 'LR' | 'GRA';

export type WarningType =
  | 'task1_under_length'
  | 'task2_under_length'
  | 'off_topic'
  | 'memorised_language'
  | string;

export type WarningItem = {
  type: WarningType;
  message: string;
  taskNumber?: 1 | 2;
  severity?: 'low' | 'medium' | 'high';
};

export type CriteriaScore = {
  key: CriteriaKey;
  band: BandScore;
  notes: string[];
};

export type TaskEvaluation = {
  taskNumber: 1 | 2;
  band: BandScore;
  shortVerdict?: string;
};

export type WritingEvaluation = {
  attemptId: string;
  overallBand: BandScore;
  task1: TaskEvaluation;
  task2: TaskEvaluation;
  criteria: Record<CriteriaKey, CriteriaScore>;
  warnings: WarningType[];
  warningNotes?: string[];
  nextSteps: string[];
};

export type FeedbackBlock = {
  taskNumber: 1 | 2;
  title: string;
  issues: string[];
  impact: string[];
  fixes: string[];
  examples: string[];
  criteria: CriteriaKey[];
};

export type BandReasoningItem = {
  taskNumber: 1 | 2;
  criteria: CriteriaKey;
  text: string;
};

export type ImprovementRow = {
  taskNumber: 1 | 2;
  criteria?: CriteriaKey;
  before: string;
  after: string;
};

export type TaskLabel = 'Task 1' | 'Task 2';

export type WritingAnswer = {
  taskNumber: 1 | 2;
  label: TaskLabel;
  text: string;
  wordCount: number;
};

export type WritingAttemptMeta = {
  attemptId: string;
  testTitle: string;
  testSlug: string | null;
  submittedAt: string | null;
  autoSubmitted: boolean;
  status: string;
};

export const formatBandScore = (band: BandScore | null | undefined) => {
  if (typeof band !== 'number' || !Number.isFinite(band)) return '—';
  const fixed = Math.round(band * 2) / 2;
  return fixed % 1 === 0 ? `${fixed.toFixed(0)}.0` : `${fixed.toFixed(1)}`;
};

export const hasSubmittedStatus = (statusRaw: string | null | undefined) => {
  const s = (statusRaw ?? '').toLowerCase().trim();
  return ['submitted', 'complete', 'completed', 'evaluating', 'queued', 'done', 'finished'].includes(s);
};
