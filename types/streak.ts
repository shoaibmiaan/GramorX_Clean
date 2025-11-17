export type StreakSummary = {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  timezone: string;
  next_milestone_days: number;
  streak_broken_recently: boolean;
  shields: number;
};

export type StreakDay = {
  date: string;
  count: number;
  isStreakDay: boolean;
};

export type StreakTokenSummary = {
  availableTokens: number;
  estimatedUsdValue: number;
  nextTokenInDays: number;
  lastUpdatedAt: string | null;
  lastClaimedAt: string | null;
};
