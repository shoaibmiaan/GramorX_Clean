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

const ACTION_COPY: Record<keyof typeof CRITERION_LABELS, string> = {
  task_response: 'State a clear position early and fully answer every part of the prompt.',
  coherence_and_cohesion: 'Use clear topic sentences and referencing words (this/these) to link ideas.',
  lexical_resource: 'Swap repeated words for precise synonyms and add accurate collocations.',
  grammatical_range: 'Mix simple and complex sentences while checking subject–verb agreement.',
};

const wordTargetForTask = (task: WritingTaskType) => (task === 'task1' ? 150 : 250);

const splitSentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const criterionEvidence = (feedback: string) => {
  const sentences = splitSentences(feedback);
  const verdict = sentences[0] ?? 'Feedback is still processing for this criterion.';
  const evidence = sentences.slice(1, 3);
  return { verdict, evidence };
};

export const WritingResultCard: React.FC<Props> = ({ task, result, essay }) => {
  const wordTarget = wordTargetForTask(task);
  const underLength = result.wordCount < wordTarget;

  return (
    <Card className="flex flex-col gap-4 p-5">
      <header className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold text-foreground">{task.toUpperCase()} result</h3>
        <span className="text-2xl font-bold text-primary">{result.overallBand.toFixed(1)}</span>
      </header>
      <p className="text-sm text-muted-foreground">{result.feedback.summary}</p>
      <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Task requirement check</p>
        <p className="mt-2">
          Word count: {result.wordCount} / {wordTarget}{' '}
          {underLength ? (
            <span className="font-semibold text-destructive">(Below target — likely band penalty)</span>
          ) : (
            <span className="text-muted-foreground">(Meets target)</span>
          )}
        </p>
        <p className="mt-1">
          {task === 'task1'
            ? 'Task 1 expects an overview plus key comparisons of data or trends.'
            : 'Task 2 expects a clear position with fully developed arguments.'}
        </p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        {Object.entries(result.bandScores).map(([criterion, band]) => {
          if (criterion === 'overall') return null;
          const feedback = result.feedback.perCriterion[criterion as keyof typeof result.feedback.perCriterion]?.feedback ?? '';
          const { verdict, evidence } = criterionEvidence(feedback);
          return (
            <div key={criterion} className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <dt className="text-xs font-semibold uppercase text-muted-foreground">
                {CRITERION_LABELS[criterion] ?? criterion}
              </dt>
              <dd className="mt-2 text-sm text-foreground">
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold">Band {band.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">Criterion score</span>
                </div>
                <p className="mt-2 text-sm text-foreground">{verdict}</p>
                {evidence.length > 0 ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                    {evidence.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
                <p className="mt-3 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">Action:</span>{' '}
                  {ACTION_COPY[criterion as keyof typeof ACTION_COPY]}
                </p>
              </dd>
            </div>
          );
        })}
      </dl>
      {result.feedback.improvements.length > 0 ? (
        <section className="rounded-lg border border-border/60 bg-background/70 p-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Priority fixes</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground">
            {result.feedback.improvements.slice(0, 3).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {essay && (
        <section className="rounded-lg border border-border/60 bg-background/70 p-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Essay</h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{essay}</p>
        </section>
      )}
      <footer className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>Words: {result.wordCount}</span>
        {typeof result.durationSeconds === 'number' && <span>Time: {Math.round(result.durationSeconds / 60)} min</span>}
      </footer>
    </Card>
  );
};

export default WritingResultCard;
