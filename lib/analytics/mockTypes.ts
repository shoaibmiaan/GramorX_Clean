export type ModuleId = 'listening' | 'reading' | 'writing' | 'speaking';

export type MockAttemptSummary = {
  id: string;
  module: ModuleId;
  testSlug: string;
  attemptId: string;
  startedAt: string;
  completedAt: string | null;
  bandScore: number | null;
  rawScore?: number | null;
  durationSeconds?: number | null;
};

export type BandTrajectoryPoint = {
  date: string;
  module: ModuleId | 'overall';
  bandScore: number;
};

export type ModulePerformanceSummary = {
  module: ModuleId;
  attempts: number;
  avgBand: number | null;
  bestBand: number | null;
  lastAttemptDate: string | null;
};

export type WeakAreaInsight = {
  module: ModuleId;
  label: string;
  accuracy: number;
  attempts: number;
};

export type TimeUsageSummary = {
  module: ModuleId;
  avgTimePerQuestionSeconds: number | null;
  avgTimePerTestMinutes: number | null;
};

export type MockAnalyticsResponse = {
  bandTrajectory: BandTrajectoryPoint[];
  modules: ModulePerformanceSummary[];
  weakAreas: WeakAreaInsight[];
  timeUsage: TimeUsageSummary[];
  recentAttempts: MockAttemptSummary[];
};
