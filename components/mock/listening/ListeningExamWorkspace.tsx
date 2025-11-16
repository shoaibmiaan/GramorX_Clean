// components/mock/listening/ListeningExamWorkspace.tsx
import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';

export type ListeningQuestionOption = {
  id: string;
  label: string; // A, B, C...
  text: string;
};

export type ListeningQuestionType = 'single-choice' | 'text';

export type ListeningQuestion = {
  id: string;
  prompt: string;
  type: ListeningQuestionType;
  options?: ListeningQuestionOption[];
  section: number; // 1–4
  order: number;   // within section
  timestampSeconds?: number; // when this question should unlock
};

export type ListeningExamWorkspaceProps = {
  testId: string;
  title: string;
  audioUrl: string;
  durationSeconds?: number | null;
  questions: ListeningQuestion[];
  onComplete: (payload: {
    answers: Record<string, string>;
    durationSeconds: number;
    startedAt: string;
  }) => void;
};

export const ListeningExamWorkspace: React.FC<ListeningExamWorkspaceProps> = ({
  testId,
  title,
  audioUrl,
  durationSeconds,
  questions,
  onComplete,
}) => {
  const [audioPosition, setAudioPosition] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const startedAtRef = React.useRef<string | null>(null);

  // Start timer on first play
  const handlePlay = () => {
    if (!startedAtRef.current) {
      startedAtRef.current = new Date().toISOString();
    }
  };

  const handleTimeUpdate: React.ReactEventHandler<HTMLAudioElement> = (event) => {
    const el = event.currentTarget;
    setAudioPosition(el.currentTime);
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleFinish = () => {
    if (!startedAtRef.current) {
      startedAtRef.current = new Date().toISOString();
    }

    const startedAt = startedAtRef.current;
    const now = new Date();
    const startedDate = new Date(startedAt);
    const elapsedSeconds = Math.max(
      1,
      Math.round((now.getTime() - startedDate.getTime()) / 1000),
    );

    setIsSubmitting(true);
    onComplete({
      answers,
      durationSeconds: elapsedSeconds,
      startedAt,
    });
  };

  const unlockedQuestions = React.useMemo(() => {
    return questions
      .slice()
      .sort((a, b) =>
        a.section === b.section ? a.order - b.order : a.section - b.section,
      )
      .filter((q) => {
        if (q.timestampSeconds == null) return true;
        return q.timestampSeconds <= audioPosition + 0.25;
      });
  }, [questions, audioPosition]);

  const sections = React.useMemo(() => {
    const bySection = new Map<number, ListeningQuestion[]>();
    unlockedQuestions.forEach((q) => {
      const list = bySection.get(q.section) ?? [];
      list.push(q);
      bySection.set(q.section, list);
    });
    return Array.from(bySection.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([section, qs]) => ({ section, questions: qs }));
  }, [unlockedQuestions]);

  const formattedDuration =
    durationSeconds && durationSeconds > 0
      ? `${Math.floor(durationSeconds / 60)} min`
      : 'Approx. 30 min';

  return (
    <Card className="mx-auto max-w-5xl p-0 md:p-0">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="font-slab text-lg md:text-xl">{title}</h2>
          <p className="text-xs text-muted-foreground md:text-sm">
            IELTS-style Listening mock • {formattedDuration}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="neutral" size="sm">
            Timer
          </Badge>
          {/* simple placeholder for now; you can later replace with real countdown */}
          <span className="text-sm font-semibold tabular-nums">00:00</span>
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[2fr,1.6fr]">
        {/* Left: Audio */}
        <div className="border-b border-border/60 md:border-b-0 md:border-r">
          <div className="px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recording
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              The recording plays once. Questions unlock as the audio progresses.
            </p>

            <div className="mt-4 rounded-ds-lg border border-border/60 bg-muted/40 px-4 py-4">
              <audio
                ref={audioRef}
                src={audioUrl}
                controls
                className="w-full"
                onPlay={handlePlay}
                onTimeUpdate={handleTimeUpdate}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Do not pause too often. In the real test, you only hear each part once.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Questions */}
        <div className="px-6 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Questions
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Answer as you listen. New questions appear when their part of the audio starts.
          </p>

          <div className="mt-4 space-y-5 max-h-[60vh] overflow-y-auto rounded-ds-lg border border-border/70 bg-card/70 p-4">
            {sections.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Questions will appear here as the recording progresses.
              </p>
            )}

            {sections.map(({ section, questions: qs }) => (
              <div key={section} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground">
                    Section {section}
                  </h3>
                </div>

                {qs.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-ds-md border border-border/80 bg-background/70 p-3"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {q.order}. {q.prompt}
                    </p>

                    {q.type === 'single-choice' && q.options && (
                      <div className="mt-2 space-y-1">
                        {q.options.map((opt) => (
                          <label
                            key={opt.id}
                            className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"
                          >
                            <input
                              type="radio"
                              name={q.id}
                              value={opt.id}
                              checked={answers[q.id] === opt.id}
                              onChange={() => handleAnswerChange(q.id, opt.id)}
                              className="h-4 w-4"
                            />
                            <span className="font-semibold">{opt.label}.</span>
                            <span>{opt.text}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'text' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={answers[q.id] ?? ''}
                          onChange={(e) =>
                            handleAnswerChange(q.id, e.target.value)
                          }
                          className="w-full rounded-ds-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-end">
            <Button
              onClick={handleFinish}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting…' : 'Finish test & go to review'}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
