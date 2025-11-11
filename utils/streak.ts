export type StudyPlan = { daysPerWeek: number; minutesPerDay: number };

export function coerceStudyPlan(input: any): StudyPlan {
  const d = Number(input?.daysPerWeek ?? 3);
  const m = Number(input?.minutesPerDay ?? 20);
  return {
    daysPerWeek: Number.isFinite(d) && d > 0 && d <= 7 ? d : 3,
    minutesPerDay: Number.isFinite(m) && m > 0 && m <= 180 ? m : 20,
  };
}

export function buildCompletionHistory(entries: Array<{ date: string; completed?: boolean }>) {
  // Normalize to {date, completed} with defaults; caller can aggregate.
  return (entries ?? []).map(e => ({
    date: String(e?.date ?? ""),
    completed: Boolean(e?.completed),
  }));
}
