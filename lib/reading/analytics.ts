// Analytics helpers for the Reading module.

// Inputs for computing accuracy by question type. Each question must
// include its identifier and the type of question (e.g. TFNG, gap, match).
export type AnalyticsQuestionInput = {
  id: string;
  questionTypeId: string;
};

// Inputs for answers when computing accuracy. Each answer references
// a question ID and whether the user's answer was correct. `correctAnswer`
// and `selectedAnswer` are included for completeness but unused here.
export type AnalyticsAnswerInput = {
  questionId: string;
  isCorrect: boolean;
  correctAnswer: any;
  selectedAnswer: any;
};

// Output shape describing accuracy for a given question type.
export type QuestionTypeAccuracy = {
  questionTypeId: string;
  correct: number;
  total: number;
  // A fraction between 0 and 1 representing correct/total.
  accuracy: number;
};

/**
 * computeAccuracyByQuestionType groups questions by their type and tallies
 * the number of correct answers versus total questions. It returns an
 * array of objects, one per question type, containing the raw counts and
 * the accuracy fraction. If a question appears in the `questions` input
 * but no corresponding answer exists, it is considered unanswered (and
 * therefore incorrect).
 */
export function computeAccuracyByQuestionType(
  questions: AnalyticsQuestionInput[],
  answers: AnalyticsAnswerInput[],
): QuestionTypeAccuracy[] {
  // Build a lookup for answers keyed by question ID.
  const answerMap = new Map<string, AnalyticsAnswerInput>();
  answers.forEach((ans) => {
    answerMap.set(ans.questionId, ans);
  });
  // Tally counts per question type.
  const tally: Record<string, { correct: number; total: number }> = {};
  questions.forEach((q) => {
    if (!tally[q.questionTypeId]) {
      tally[q.questionTypeId] = { correct: 0, total: 0 };
    }
    tally[q.questionTypeId].total += 1;
    const ans = answerMap.get(q.id);
    if (ans && ans.isCorrect) {
      tally[q.questionTypeId].correct += 1;
    }
  });
  return Object.entries(tally).map(([questionTypeId, { correct, total }]) => {
    const accuracy = total > 0 ? correct / total : 0;
    return { questionTypeId, correct, total, accuracy };
  });
}

type AttemptLike = {
  id?: string;
  created_at?: string;
  raw_score?: number | null;
  question_count?: number | null;
  duration_seconds?: number | null;
  section_stats?: Record<string, any> | null;
};

export function computeAttemptsTimeline(attempts: AttemptLike[]) {
  return (attempts ?? []).map((attempt) => {
    const sectionStats = attempt.section_stats ?? {};
    const bandFromStats =
      typeof sectionStats.band_score === "number"
        ? sectionStats.band_score
        : typeof sectionStats.band === "number"
        ? sectionStats.band
        : null;

    const derivedBand =
      bandFromStats != null
        ? bandFromStats
        : attempt.raw_score != null && attempt.question_count
        ? (attempt.raw_score / attempt.question_count) * 9
        : null;

    return {
      attemptId: attempt.id ?? "", // fallback to keep UI stable
      createdAt: attempt.created_at ?? "",
      rawScore: attempt.raw_score ?? null,
      questionCount: attempt.question_count ?? null,
      bandScore: derivedBand,
    };
  });
}

export function computeTimePerQuestionStats(attempts: AttemptLike[]) {
  const aggregates = new Map<string, { total: number; count: number }>();

  (attempts ?? []).forEach((attempt) => {
    const sectionStats = attempt.section_stats ?? {};
    const byType =
      // arrays: [{ questionTypeId, avgSeconds }]
      (Array.isArray(sectionStats.time_per_question)
        ? sectionStats.time_per_question
        : Array.isArray(sectionStats.timePerQuestion)
        ? sectionStats.timePerQuestion
        : Array.isArray(sectionStats.questionTypeTimings)
        ? sectionStats.questionTypeTimings
        : null) ?? null;

    if (Array.isArray(byType)) {
      byType.forEach((entry: any) => {
        const typeId = String(entry?.questionTypeId || entry?.type || "").trim();
        const avg = Number(entry?.avgSeconds ?? entry?.avg ?? entry?.seconds);
        if (!typeId || Number.isNaN(avg)) return;
        const agg = aggregates.get(typeId) ?? { total: 0, count: 0 };
        agg.total += avg;
        agg.count += 1;
        aggregates.set(typeId, agg);
      });
      return;
    }

    // object map form: { tfng: 42, mcq: 30 }
    if (sectionStats && typeof sectionStats.time_per_question === "object") {
      Object.entries(sectionStats.time_per_question as Record<string, any>).forEach(([typeId, value]) => {
        const numeric = Number(value);
        if (!typeId || Number.isNaN(numeric)) return;
        const agg = aggregates.get(typeId) ?? { total: 0, count: 0 };
        agg.total += numeric;
        agg.count += 1;
        aggregates.set(typeId, agg);
      });
    }
  });

  return Array.from(aggregates.entries()).map(([questionTypeId, { total, count }]) => ({
    questionTypeId,
    avgSeconds: count > 0 ? total / count : null,
  }));
}
