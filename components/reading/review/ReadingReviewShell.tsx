import * as React from 'react';

import type {
  ReadingTest,
  ReadingPassage,
  ReadingQuestion,
} from '@/lib/reading/types';
import { ReadingReviewSummaryBar } from './ReadingReviewSummaryBar';
import { ReadingReviewQuestionItem } from './ReadingReviewQuestionItem';
import { Card } from '@/components/design-system/Card';

type ReviewAnswer = {
  questionId: string;
  isCorrect: boolean;
  selectedAnswer: string | string[] | null;
};

type AttemptSummary = {
  id: string;
  rawScore: number | null;
  bandScore: number | null;
  questionCount: number | null;
  createdAt: string;
  durationSeconds: number | null;
};

type ReadingReviewShellProps = {
  test: ReadingTest;
  passages: ReadingPassage[];
  questions: ReadingQuestion[];
  attempt: AttemptSummary;
  answers: ReviewAnswer[];
};

/**
 * Review shell: top summary + per-passage grouped questions.
 */
export const ReadingReviewShell: React.FC<ReadingReviewShellProps> = ({
  test,
  passages,
  questions,
  attempt,
  answers,
}) => {
  const answerMap = React.useMemo(() => {
    const map = new Map<string, ReviewAnswer>();
    answers.forEach((a) => map.set(a.questionId, a));
    return map;
  }, [answers]);

  const totalQuestions =
    attempt.questionCount ?? test.totalQuestions ?? questions.length;

  const correctCount = React.useMemo(
    () => answers.filter((a) => a.isCorrect).length,
    [answers],
  );

  const groupedByPassage = React.useMemo(() => {
    const byId = new Map<string | null, ReadingQuestion[]>();
    questions.forEach((q) => {
      const key = ((q as any).passageId ?? null) as string | null;
      if (!byId.has(key)) byId.set(key, []);
      byId.get(key)!.push(q);
    });
    return byId;
  }, [questions]);

  const passageById = React.useMemo(() => {
    const m = new Map<string, ReadingPassage>();
    passages.forEach((p) => m.set((p as any).id as string, p));
    return m;
  }, [passages]);

  return (
    <div className="space-y-6">
      <ReadingReviewSummaryBar
        testTitle={test.title}
        bandScore={attempt.bandScore}
        rawScore={attempt.rawScore}
        totalQuestions={totalQuestions}
        correctCount={correctCount}
        createdAt={attempt.createdAt}
        durationSeconds={attempt.durationSeconds ?? undefined}
      />

      {[...groupedByPassage.entries()]
        .sort(([aKey], [bKey]) => {
          if (!aKey && !bKey) return 0;
          if (!aKey) return -1;
          if (!bKey) return 1;
          const aPassage = passageById.get(aKey);
          const bPassage = passageById.get(bKey);
          return (aPassage?.passageOrder ?? 0) - (bPassage?.passageOrder ?? 0);
        })
        .map(([passageId, qs]) => {
          const passage = passageId ? passageById.get(passageId) : null;

          return (
            <div key={passageId ?? 'no-passage'} className="space-y-3">
              {passage && (
                <Card className="px-4 py-2 text-xs bg-surface-subtle border border-border/70">
                  <p className="font-medium">
                    Passage {passage.passageOrder}
                    {passage.title ? `: ${passage.title}` : ''}
                  </p>
                </Card>
              )}

              <div className="space-y-2">
                {qs.map((q) => {
                  const ans = answerMap.get(q.id);
                  return (
                    <ReadingReviewQuestionItem
                      key={q.id}
                      question={q}
                      userAnswer={ans?.selectedAnswer ?? null}
                      isCorrect={ans?.isCorrect ?? false}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default ReadingReviewShell;
