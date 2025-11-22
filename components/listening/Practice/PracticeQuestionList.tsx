// components/listening/Practice/PracticeQuestionList.tsx
import * as React from 'react';

import type { ListeningQuestion, ListeningAttemptAnswer } from '@/lib/listening/types';
import PracticeAnswerInput from '@/components/listening/Practice/PracticeAnswerInput';
import { Card } from '@/components/design-system/Card';

type Props = {
  questions: ListeningQuestion[];
  answers: Record<string, ListeningAttemptAnswer | undefined>;
  onChangeAnswer: (questionId: string, value: string | string[]) => void;
};

const PracticeQuestionList: React.FC<Props> = ({ questions, answers, onChangeAnswer }) => {
  if (!questions.length) {
    return (
      <Card className="border-border bg-card/60 p-4 text-sm text-muted-foreground">
        No questions configured for this practice test yet.
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {questions.map((question) => {
        const answer = answers[question.id];
        return (
          <Card
            key={question.id}
            className="border-border bg-card/60 p-4 sm:p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Question {question.questionNumber}{' '}
                  <span className="font-normal normal-case">
                    · Section {question.sectionNumber}
                  </span>
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {question.prompt}
                </p>
                {question.context && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {question.context}
                  </p>
                )}
              </div>
              <p className="shrink-0 text-[11px] text-muted-foreground">
                {question.maxScore} mark{question.maxScore !== 1 ? 's' : ''}
              </p>
            </div>

            <PracticeAnswerInput
              question={question}
              answer={answer}
              onChangeAnswer={onChangeAnswer}
            />
          </Card>
        );
      })}
    </div>
  );
};

export default PracticeQuestionList;
