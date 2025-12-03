// components/listening/ListeningExamShell.tsx
import * as React from 'react';
import { useRouter } from 'next/router';

import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Icon } from '@/components/design-system/Icon';
import { ListeningAudioPlayer } from './ListeningAudioPlayer';
import { ListeningQuestionItem } from './ListeningQuestionItem';
import {
  ListeningSidebarProgress,
  type ListeningQuestionProgress,
  type ListeningSectionProgress,
} from './ListeningSidebarProgress';
import { ListeningAutoSubmitModal } from './modals/ListeningAutoSubmitModal';
import { ListeningExitModal } from './modals/ListeningExitModal';
import { ListeningSectionLockedModal } from './modals/ListeningSectionLockedModal';
import { ListeningTimeWarningModal } from './modals/ListeningTimeWarningModal';

import type {
  ListeningQuestion,
  ListeningSection,
  ListeningTest,
} from '@/pages/mock/listening/exam/[slug]';

type AnswerValue = string | string[] | null;

type ListeningExamShellProps = {
  test: ListeningTest;
  sections: ListeningSection[];
  questions: ListeningQuestion[];
};

export const ListeningExamShell: React.FC<ListeningExamShellProps> = ({
  test,
  sections,
  questions,
}) => {
  const router = useRouter();

  const [currentSectionId, setCurrentSectionId] = React.useState<string | null>(
    sections[0]?.id ?? null,
  );

  const sectionQuestions = React.useMemo(
    () =>
      sections.reduce<Record<string, ListeningQuestion[]>>((acc, section) => {
        acc[section.id] = questions
          .filter((q) => q.sectionId === section.id)
          .sort((a, b) => a.questionNo - b.questionNo);
        return acc;
      }, {}),
    [sections, questions],
  );

  const initialQuestionId = React.useMemo(() => {
    if (!currentSectionId) return questions[0]?.id ?? null;
    const firstInSection =
      sectionQuestions[currentSectionId]?.[0]?.id ?? questions[0]?.id ?? null;
    return firstInSection;
  }, [currentSectionId, questions, sectionQuestions]);

  const [currentQuestionId, setCurrentQuestionId] =
    React.useState<string | null>(initialQuestionId);

  const [answers, setAnswers] = React.useState<Record<string, AnswerValue>>({});
  const [flagged, setFlagged] = React.useState<Set<string>>(
    () => new Set(),
  );

  const [remainingSeconds, setRemainingSeconds] = React.useState(
    test.durationMinutes * 60,
  );
  const [hasShownFiveMinWarning, setHasShownFiveMinWarning] =
    React.useState(false);

  const [showExitModal, setShowExitModal] = React.useState(false);
  const [showTimeWarningModal, setShowTimeWarningModal] =
    React.useState(false);
  const [showSectionLockedModal, setShowSectionLockedModal] =
    React.useState(false);
  const [showAutoSubmitModal, setShowAutoSubmitModal] = React.useState(false);

  const [attemptId, setAttemptId] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Global timer
  React.useEffect(() => {
    if (remainingSeconds <= 0 || timerRef.current) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          timerRef.current = null;
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current as NodeJS.Timeout);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 5-minute warning
  React.useEffect(() => {
    if (
      !hasShownFiveMinWarning &&
      remainingSeconds > 0 &&
      remainingSeconds <= 5 * 60
    ) {
      setShowTimeWarningModal(true);
      setHasShownFiveMinWarning(true);
    }
  }, [remainingSeconds, hasShownFiveMinWarning]);

  // Ensure current section + question always valid
  React.useEffect(() => {
    if (!currentSectionId && sections[0]) {
      setCurrentSectionId(sections[0].id);
      return;
    }

    if (!currentSectionId) return;

    const qs = sectionQuestions[currentSectionId] ?? [];
    if (!qs.length) return;

    if (!currentQuestionId || !qs.some((q) => q.id === currentQuestionId)) {
      setCurrentQuestionId(qs[0].id);
    }
  }, [currentSectionId, currentQuestionId, sectionQuestions, sections]);

  const currentQuestion = questions.find((q) => q.id === currentQuestionId);
  const currentSection =
    sections.find((s) => s.id === currentSectionId) ?? null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const seconds = Math.floor(secs % 60)
      .toString()
      .padStart(2, '0');
    return `${mins}:${seconds}`;
  };

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleToggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const clone = new Set(prev);
      if (clone.has(questionId)) clone.delete(questionId);
      else clone.add(questionId);
      return clone;
    });
  };

  const goToQuestion = (questionId: string) => {
    const target = questions.find((q) => q.id === questionId);
    if (!target) return;
    if (target.sectionId !== currentSectionId) {
      setCurrentSectionId(target.sectionId);
    }
    setCurrentQuestionId(questionId);
  };

  const goToNextQuestion = () => {
    if (!currentQuestion) return;
    const qs = sectionQuestions[currentQuestion.sectionId] ?? [];
    const idx = qs.findIndex((q) => q.id === currentQuestion.id);
    if (idx >= 0 && idx + 1 < qs.length) {
      setCurrentQuestionId(qs[idx + 1].id);
      return;
    }

    const sectionIndex = sections.findIndex(
      (section) => section.id === currentQuestion.sectionId,
    );
    if (sectionIndex >= 0 && sectionIndex + 1 < sections.length) {
      const nextSection = sections[sectionIndex + 1];
      const nextQs = sectionQuestions[nextSection.id] ?? [];
      if (nextQs.length) {
        setCurrentSectionId(nextSection.id);
        setCurrentQuestionId(nextQs[0].id);
      }
    }
  };

  const goToPrevQuestion = () => {
    if (!currentQuestion) return;
    const qs = sectionQuestions[currentQuestion.sectionId] ?? [];
    const idx = qs.findIndex((q) => q.id === currentQuestion.id);
    if (idx > 0) {
      setCurrentQuestionId(qs[idx - 1].id);
      return;
    }

    const sectionIndex = sections.findIndex(
      (section) => section.id === currentQuestion.sectionId,
    );
    if (sectionIndex > 0) {
      const prevSection = sections[sectionIndex - 1];
      const prevQs = sectionQuestions[prevSection.id] ?? [];
      if (prevQs.length) {
        setCurrentSectionId(prevSection.id);
        setCurrentQuestionId(prevQs[prevQs.length - 1].id);
      }
    }
  };

  const handleJumpToSection = (sectionId: string) => {
    setCurrentSectionId(sectionId);
    const qs = sectionQuestions[sectionId] ?? [];
    if (qs.length) setCurrentQuestionId(qs[0].id);
  };

  const sidebarSections: ListeningSectionProgress[] = React.useMemo(
    () =>
      sections.map((section) => {
        const qs = sectionQuestions[section.id] ?? [];
        const answered = qs.filter(
          (q) => answers[q.id] !== undefined && answers[q.id] !== null,
        ).length;

        return {
          id: section.id,
          order: section.order,
          label: section.label,
          totalQuestions: qs.length,
          answeredQuestions: answered,
          isCurrent: section.id === currentSectionId,
          isCompleted: qs.length > 0 && answered === qs.length,
          isLocked: false,
        };
      }),
    [sections, sectionQuestions, answers, currentSectionId],
  );

  const sidebarCurrentSectionQuestions: ListeningQuestionProgress[] =
    React.useMemo(() => {
      const qs =
        (currentSectionId && sectionQuestions[currentSectionId]) ?? [];
      return qs.map((question) => ({
        id: question.id,
        questionNo: question.questionNo,
        isAnswered:
          answers[question.id] !== undefined && answers[question.id] !== null,
        isFlagged: flagged.has(question.id),
        isCurrent: question.id === currentQuestionId,
      }));
    }, [currentSectionId, sectionQuestions, answers, flagged, currentQuestionId]);

  const submitAttempt = React.useCallback(
    async (auto: boolean) => {
      if (isSubmitting) return attemptId;

      try {
        setIsSubmitting(true);
        const res = await fetch('/api/listening/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testId: test.id,
            testSlug: test.slug,
            autoSubmit: auto,
            durationSeconds: test.durationMinutes * 60 - remainingSeconds,
            answers: Object.entries(answers).map(([questionId, value]) => {
              const q = questions.find((item) => item.id === questionId);
              return {
                questionId,
                questionNumber: q?.questionNo ?? null,
                section: q?.sectionNo ?? null,
                answer: value,
              };
            }),
          }),
        });

        if (!res.ok) {
          console.error('Failed to submit listening attempt');
          return attemptId;
        }

        const json = (await res.json()) as { attemptId?: string };
        if (json.attemptId) {
          setAttemptId(json.attemptId);
          return json.attemptId;
        }
        return attemptId;
      } catch (err) {
        console.error('Submit attempt error', err);
        return attemptId;
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      answers,
      attemptId,
      isSubmitting,
      questions,
      remainingSeconds,
      test.id,
      test.slug,
    ],
  );

  const handleTimeUp = React.useCallback(async () => {
    const id = await submitAttempt(true);
    if (id) setAttemptId(id);
    setShowAutoSubmitModal(true);
  }, [submitAttempt]);

  const handleExitClick = () => setShowExitModal(true);

  const handleExitConfirm = async () => {
    setShowExitModal(false);
    const id = await submitAttempt(false);
    if (id) {
      router.push(`/mock/listening/result/${id}`);
    } else {
      router.push('/mock/listening');
    }
  };

  const handleExitCancel = () => setShowExitModal(false);

  const handleManualSubmit = async () => {
    const id = await submitAttempt(false);
    if (id) {
      router.push(`/mock/listening/result/${id}`);
    }
  };

  const handleViewResults = () => {
    if (attemptId) {
      router.push(`/mock/listening/result/${attemptId}`);
    } else {
      router.push('/mock/listening');
    }
  };

  const timerTone =
    remainingSeconds <= 120
      ? 'destructive'
      : remainingSeconds <= 5 * 60
      ? 'warning'
      : 'neutral';

  const audioUrl = test.audioUrl ?? null;

  const renderEmptyState = () => (
    <Card className="flex min-h-[240px] items-center justify-center border-dashed border-border/70 bg-muted/40 text-sm text-muted-foreground">
      No listening content available for this test.
    </Card>
  );

  const contentAvailable = sections.length > 0 && questions.length > 0;

  return (
    <>
      <div className="flex h-[calc(100vh-120px)] flex-col overflow-hidden rounded-ds-2xl border border-border/80 bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-background/95 px-4 py-3">
          <div className="flex items-center gap-2">
            <Badge tone="primary" size="sm">
              Listening Mock
            </Badge>
            <div>
              <p className="text-sm font-semibold leading-tight">
                {test.title}
              </p>
              <p className="text-[11px] text-muted-foreground">
                IELTS-style exam · {test.durationMinutes} min ·{' '}
                {test.totalQuestions} questions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-muted/70 px-3 py-1.5 md:flex">
              <Icon
                name="user"
                className="h-3.5 w-3.5 text-muted-foreground"
              />
              <span className="text-[11px] font-medium text-muted-foreground">
                Candidate ID
              </span>
              <span className="text-[11px] font-semibold tabular-nums">
                2025-L-1023
              </span>
            </div>

            <Badge
              tone={timerTone}
              size="lg"
              className="px-3 py-1 text-xs font-mono tracking-tight"
            >
              <Icon name="clock" className="mr-1.5 h-3.5 w-3.5" />
              {formatTime(remainingSeconds)}
            </Badge>

            <Button
              tone="primary"
              size="sm"
              type="button"
              onClick={handleManualSubmit}
              disabled={isSubmitting}
              className="text-xs"
            >
              <Icon name="send" className="mr-1.5 h-3.5 w-3.5" />
              Submit
            </Button>

            <Button
              tone="neutral"
              variant="ghost"
              size="sm"
              type="button"
              onClick={handleExitClick}
              disabled={isSubmitting}
              className="text-xs"
            >
              <Icon name="log-out" className="mr-1.5 h-3.5 w-3.5" />
              Exit
            </Button>
          </div>
        </div>

        {/* Audio */}
        <div className="border-b border-border/70 bg-muted/40 px-4 py-3">
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Icon
                name="headphones"
                className="h-4 w-4 text-muted-foreground"
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Listening audio
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Audio plays once in the real exam — treat this as the real
                  environment.
                </p>
              </div>
            </div>
            {currentSection && (
              <Badge tone="neutral" size="xs">
                Section {currentSection.order}
              </Badge>
            )}
          </div>

          <ListeningAudioPlayer src={audioUrl} />
        </div>

        {/* Body */}
        <div className="flex flex-1 divide-x divide-border/70">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-1 min-h-0">
              <div className="flex min-w-0 flex-1 flex-col px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {currentSection && (
                      <Badge tone="neutral" size="xs">
                        Section {currentSection.order}
                      </Badge>
                    )}
                    {currentQuestion && (
                      <Badge tone="info" size="xs">
                        Question {currentQuestion.questionNo}
                      </Badge>
                    )}
                  </div>
                  {currentQuestion && (
                    <Button
                      tone={
                        flagged.has(currentQuestion.id) ? 'warning' : 'neutral'
                      }
                      variant="ghost"
                      size="xs"
                      type="button"
                      onClick={() =>
                        handleToggleFlag(currentQuestion.id)
                      }
                      className="text-[11px]"
                    >
                      <Icon
                        name="flag"
                        className="mr-1.5 h-3.5 w-3.5"
                      />
                      {flagged.has(currentQuestion.id)
                        ? 'Unflag'
                        : 'Flag'}
                    </Button>
                  )}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pr-2">
                  {contentAvailable && currentQuestion ? (
                    <ListeningQuestionItem
                      question={currentQuestion}
                      value={answers[currentQuestion.id] ?? null}
                      onChange={(val) =>
                        handleAnswerChange(currentQuestion.id, val)
                      }
                    />
                  ) : (
                    renderEmptyState()
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2">
                  <Button
                    tone="neutral"
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={goToPrevQuestion}
                    disabled={!currentQuestion}
                  >
                    <Icon
                      name="arrow-left"
                      className="mr-1.5 h-3.5 w-3.5"
                    />
                    Previous
                  </Button>

                  <Button
                    tone="primary"
                    size="sm"
                    type="button"
                    onClick={goToNextQuestion}
                    disabled={!currentQuestion}
                  >
                    Next
                    <Icon
                      name="arrow-right"
                      className="ml-1.5 h-3.5 w-3.5"
                    />
                  </Button>
                </div>
              </div>

              <div className="hidden w-[260px] flex-col border-l border-border/60 bg-background/80 px-3 py-3 md:flex">
                <Card className="flex-1 border-dashed border-border/60 bg-muted/40 p-3 text-xs text-muted-foreground">
                  <p className="mb-1 font-semibold text-[11px] uppercase tracking-wide">
                    Visuals / diagrams
                  </p>
                  <p>
                    Use this area for maps / tables / diagrams that belong to
                    the current set of questions.
                  </p>
                </Card>
              </div>
            </div>
          </div>

          <ListeningSidebarProgress
            sections={sidebarSections}
            currentSectionId={currentSectionId}
            currentSectionQuestions={sidebarCurrentSectionQuestions}
            onJumpToSection={handleJumpToSection}
            onJumpToQuestion={goToQuestion}
          />
        </div>
      </div>

      <ListeningExitModal
        open={showExitModal}
        onConfirm={handleExitConfirm}
        onCancel={handleExitCancel}
      />
      <ListeningTimeWarningModal
        open={showTimeWarningModal}
        remainingSeconds={remainingSeconds}
        onClose={() => setShowTimeWarningModal(false)}
      />
      <ListeningSectionLockedModal
        open={showSectionLockedModal}
        onClose={() => setShowSectionLockedModal(false)}
      />
      <ListeningAutoSubmitModal
        open={showAutoSubmitModal}
        onViewResults={handleViewResults}
      />
    </>
  );
};
