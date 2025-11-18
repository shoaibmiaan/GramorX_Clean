import * as React from 'react';
import { useRouter } from 'next/router';

import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { MockShell } from '@/components/mock/MockShell';
import { QuestionNavigator } from '@/components/mock/QuestionNavigator';
import type { MockModuleId } from '@/types/mock';

import type { ModuleRunPageProps } from '../pageBuilders';
import type { NormalizedQuestion } from '@/lib/mock/types';

const questionLabel = (index: number) => String(index + 1).padStart(2, '0');

export const ModuleRunView: React.FC<ModuleRunPageProps> = ({ module, attemptId, mock, content }) => {
  const router = useRouter();
  const [remainingSeconds, setRemainingSeconds] = React.useState(mock.durationMinutes * 60);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const questions =
    module === 'listening' || module === 'reading'
      ? (content.content as any).questions ?? []
      : [];

  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [writingTask1, setWritingTask1] = React.useState('');
  const [writingTask2, setWritingTask2] = React.useState('');
  const [speakingNotes, setSpeakingNotes] = React.useState('');

  React.useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => (prev <= 0 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navigatorItems = (questions as NormalizedQuestion[]).map((question, index) => ({
    id: question.id,
    label: questionLabel(index),
    section: question.section,
  }));

  const answeredMap = navigatorItems.reduce<Record<string, boolean>>((acc, item) => {
    acc[item.id] = Boolean(answers[item.id]);
    return acc;
  }, {});

  const handleSubmit = async () => {
    setError(null);
    try {
      setSubmitting(true);
      let payload: Record<string, unknown> = { attemptId };
      if (module === 'writing') {
        payload = { ...payload, task1Text: writingTask1, task2Text: writingTask2 };
      } else if (module === 'speaking') {
        payload = { ...payload, transcript: speakingNotes };
      } else {
        payload = { ...payload, answers };
      }
      const res = await fetch(`/api/mock/${module}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error('Failed to submit attempt');
      }
      router.push(`/mock/${module}/submitted?attemptId=${attemptId}`);
    } catch (err) {
      console.error(err);
      setError('Could not submit this mock. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: NormalizedQuestion) => (
    <Card key={question.id} className="rounded-ds-3xl border border-border/60 bg-card/70 p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{question.section}</span>
        <Badge tone="neutral" size="sm">
          Q{question.id.split('-').pop()}
        </Badge>
      </div>
      <p className="mt-2 text-sm text-foreground">{question.prompt}</p>
      {Array.isArray(question.options) && question.options.length ? (
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {question.options.map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-2 rounded-2xl border border-border/60 px-3 py-2">
              <input
                type="radio"
                name={question.id}
                className="accent-primary"
                checked={answers[question.id] === option}
                onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option }))}
              />
              <span className="text-sm text-foreground">{option}</span>
            </label>
          ))}
        </div>
      ) : (
        <textarea
          className="mt-3 w-full rounded-2xl border border-border/60 bg-background/40 p-3 text-sm"
          value={answers[question.id] ?? ''}
          onChange={(event) => setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))}
        />
      )}
    </Card>
  );

  const renderBody = () => {
    if (module === 'writing') {
      return (
        <div className="space-y-4">
          <Card className="rounded-ds-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
            <h3 className="font-semibold">Task 1</h3>
            <textarea
              className="mt-3 min-h-[220px] w-full rounded-2xl border border-border/60 bg-background/40 p-3 text-sm"
              value={writingTask1}
              onChange={(event) => setWritingTask1(event.target.value)}
              placeholder="Summarise the data here..."
            />
          </Card>
          <Card className="rounded-ds-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
            <h3 className="font-semibold">Task 2</h3>
            <textarea
              className="mt-3 min-h-[280px] w-full rounded-2xl border border-border/60 bg-background/40 p-3 text-sm"
              value={writingTask2}
              onChange={(event) => setWritingTask2(event.target.value)}
              placeholder="Write your essay response here..."
            />
          </Card>
        </div>
      );
    }

    if (module === 'speaking') {
      const script = content.content as any;
      return (
        <div className="space-y-4">
          <Card className="rounded-ds-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
            <h3 className="font-semibold">Cue card</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-muted-foreground">
              {(script.part2CueCard ?? []).map((line: string) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </Card>
          <Card className="rounded-ds-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
            <h3 className="font-semibold">Notes / transcript</h3>
            <textarea
              className="mt-2 min-h-[260px] w-full rounded-2xl border border-border/60 bg-background/40 p-3 text-sm"
              value={speakingNotes}
              onChange={(event) => setSpeakingNotes(event.target.value)}
              placeholder="Record key ideas or paste your transcript after speaking."
            />
          </Card>
        </div>
      );
    }

    return <div className="space-y-4">{(questions as NormalizedQuestion[]).map(renderQuestion)}</div>;
  };

  return (
    <MockShell
      module={module}
      title={mock.title}
      description={mock.description}
      timer={{ totalSeconds: mock.durationMinutes * 60, remainingSeconds }}
      onSubmit={handleSubmit}
      submitLabel="Submit mock"
      isSubmitting={submitting}
      sidebar={
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>Mock ID: {mock.id}</p>
          <p>Attempt: {attemptId.slice(0, 8)}…</p>
          {error ? <p className="text-red-500">{error}</p> : null}
        </div>
      }
      navigator={
        module === 'listening' || module === 'reading' ? (
          <QuestionNavigator items={navigatorItems} answered={answeredMap} />
        ) : null
      }
    >
      {renderBody()}
    </MockShell>
  );
};

export default ModuleRunView;
