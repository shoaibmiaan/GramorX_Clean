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

const DEFAULT_ACTIONS: Record<string, string> = {
  task_response: 'Clarify your position early and address all prompt points directly.',
  coherence_and_cohesion: 'Use clear topic sentences and connect ideas with explicit referencing.',
  lexical_resource: 'Replace repeated words with precise paraphrases and topic-specific vocabulary.',
  grammatical_range: 'Mix simple and complex sentences while keeping verb tenses consistent.',
};

const splitSentences = (text: string) =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

const pickEvidence = (sentences: string[], strengths: string[], improvements: string[]) => {
  if (sentences.length) return sentences.slice(0, 3);
  const fallback = [...strengths, ...improvements].filter(Boolean);
  if (fallback.length) return fallback.slice(0, 3);
  return ['Evidence not detected yet — review your response for concrete examples.', 'Add a short example to support each main idea.'];
};

export const WritingResultCard: React.FC<Props> = ({ task, result, essay }) => {
  const minWords = task === 'task1' ? 150 : 250;
  const wordCountWarning = result.wordCount < minWords;
  const criteria = Object.entries(result.bandScores)
    .filter(([criterion]) => criterion !== 'overall')
    .map(([criterion, band]) => ({
      criterion,
      label: CRITERION_LABELS[criterion] ?? criterion,
      band,
    }))
    .sort((a, b) => a.band - b.band);

  return (
    <Card className="flex flex-col gap-4 p-5">
      <header className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold text-foreground">{task.toUpperCase()} result</h3>
        <span className="text-2xl font-bold text-primary">{result.overallBand.toFixed(1)}</span>
      </header>
      <p className="text-sm text-muted-foreground">{result.feedback.summary}</p>
      <p className="text-xs text-muted-foreground">Priority: focus on the lowest band criteria first.</p>
      <div className="grid gap-3">
        {criteria.map(({ criterion, label, band }) => {
          const feedbackText =
            result.feedback.perCriterion[criterion as keyof typeof result.feedback.perCriterion]?.feedback ?? '';
          const sentences = splitSentences(feedbackText);
          const verdict = sentences.shift() ?? 'Solid foundation with clear areas to improve.';
          const evidence = pickEvidence(sentences, result.feedback.strengths, result.feedback.improvements);
          const action = result.feedback.improvements[0] ?? DEFAULT_ACTIONS[criterion] ?? 'Revise this area next.';

          return (
            <div key={criterion} className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <span className="text-sm font-semibold text-primary">Band {band.toFixed(1)}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{verdict}</p>
              <ul className="mt-2 space-y-1 text-sm text-foreground">
                {evidence.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-border" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm text-foreground">
                <span className="font-semibold">Action:</span> {action}
              </p>
            </div>
          );
        })}
      </div>
      {essay && (
        <section className="rounded-lg border border-border/60 bg-background/70 p-4">
          <h4 className="text-sm font-semibold text-muted-foreground">Essay</h4>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{essay}</p>
        </section>
      )}
      <footer className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>Words: {result.wordCount}</span>
        {wordCountWarning ? (
          <span className="text-destructive">Below IELTS minimum of {minWords} words.</span>
        ) : (
          <span>Meets {minWords}+ word target.</span>
        )}
        {typeof result.durationSeconds === 'number' && <span>Time: {Math.round(result.durationSeconds / 60)} min</span>}
      </footer>
    </Card>
  );
};

export default WritingResultCard;
