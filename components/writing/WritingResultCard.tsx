// components/writing/WritingResultCard.tsx
// Displays AI scoring summary for a task.

import React from 'react';
import { Card } from '@/components/design-system/Card';
import type { WritingScorePayload, WritingTaskType } from '@/types/writing';

type Props = {
  task: WritingTaskType;
  result: WritingScorePayload;
  essay?: string;
};

const CRITERION_LABELS: Record<string, string> = {
  task_response: 'Task Response',
  coherence_and_cohesion: 'Coherence & Cohesion',
  lexical_resource: 'Lexical Resource',
  grammatical_range: 'Grammatical Range',
};

export const WritingResultCard: React.FC<Props> = ({ task, result, essay }) => {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <header className="flex items-baseline justify-between">
        <h3 className="text-h4 font-semibold text-foreground">{task.toUpperCase()} result</h3>
        <span className="text-h2 font-bold text-primary">{result.overallBand.toFixed(1)}</span>
      </header>
      <p className="text-small text-muted-foreground">{result.feedback.summary}</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        {Object.entries(result.bandScores).map(([criterion, band]) =>
          criterion === 'overall' ? null : (
            <div key={criterion} className="rounded-lg border border-border/60 bg-muted/30 p-3">
              <dt className="text-caption font-medium uppercase text-muted-foreground">
                {CRITERION_LABELS[criterion] ?? criterion}
              </dt>
              <dd className="mt-1 flex items-center justify-between text-small text-foreground">
                <span className="font-semibold">{band.toFixed(1)}</span>
                <span className="text-caption text-muted-foreground">
                  {result.feedback.perCriterion[criterion as keyof typeof result.feedback.perCriterion]?.feedback}
                </span>
              </dd>
            </div>
          ),
        )}
      </dl>
      {essay && (
        <section className="rounded-lg border border-border/60 bg-background/70 p-4">
          <h4 className="text-small font-semibold text-muted-foreground">Essay</h4>
          <p className="mt-2 whitespace-pre-wrap text-small leading-6 text-foreground">{essay}</p>
        </section>
      )}
      <footer className="flex flex-wrap gap-4 text-caption text-muted-foreground">
        <span>Words: {result.wordCount}</span>
        {typeof result.durationSeconds === 'number' && <span>Time: {Math.round(result.durationSeconds / 60)} min</span>}
      </footer>
    </Card>
  );
};

export default WritingResultCard;
