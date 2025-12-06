// services/mock/MockStatsService.ts

// Keep types simple so nothing explodes if the shape evolves.
export type MockModuleBreakdown = {
  module: string;
  attempts: number;
  avgBand: number | null;
  bestBand: number | null;
  lastAttemptAt: string | null;
};

export type MockTrendPoint = {
  label: string;      // e.g. "Test 1", "Test 2", date label, etc.
  band: number | null;
  date?: string;
};

export type MockActivityPoint = {
  label: string;      // e.g. "Mon", "Tue", "T1", "T2"
  intensity: number;  // 0–1
};

export type MockStats = {
  totalAttempts: number;
  totalTestsAttempted: number;
  avgBandScore: number | null;
  bestBandScore: number | null;
  lastAttemptAt: string | null;
  moduleBreakdown: MockModuleBreakdown[];
  trend: MockTrendPoint[];
  activity: MockActivityPoint[];
};

export const MockStatsService: any = {
  // ✅ Used by getServerSideProps: safe empty baseline
  getEmptyStats(): MockStats {
    return {
      totalAttempts: 0,
      totalTestsAttempted: 0,
      avgBandScore: null,
      bestBandScore: null,
      lastAttemptAt: null,
      moduleBreakdown: [],
      trend: [],
      activity: [],
    };
  },

  // ✅ Used when you actually have raw stats from DB/API
  buildDashboardSummary(raw: any): MockStats {
    if (!raw) {
      return this.getEmptyStats();
    }

    const base = this.getEmptyStats();

    return {
      ...base,
      totalAttempts: raw.totalAttempts ?? base.totalAttempts,
      totalTestsAttempted: raw.totalTestsAttempted ?? base.totalTestsAttempted,
      avgBandScore: raw.avgBandScore ?? base.avgBandScore,
      bestBandScore: raw.bestBandScore ?? base.bestBandScore,
      lastAttemptAt: raw.lastAttemptAt ?? base.lastAttemptAt,
      moduleBreakdown: raw.moduleBreakdown ?? base.moduleBreakdown,
      trend: raw.trend ?? base.trend,
      activity: raw.activity ?? base.activity,
    };
  },
};
