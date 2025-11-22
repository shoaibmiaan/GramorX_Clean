// lib/hooks/useListeningTestRunner.ts
import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  ListeningAttempt,
  ListeningAttemptAnswer,
  ListeningTest,
  ListeningQuestion,
  ListeningSection,
} from '@/lib/listening/types';
import {
  submitListeningAttempt,
  autosaveListeningMockAttempt,
} from '@/lib/listening/attempts';

type ListeningTestRunnerStatus = 'idle' | 'running' | 'submitting' | 'completed' | 'expired';

type UseListeningTestRunnerOptions = {
  test: ListeningTest;
  /** practice | mock */
  mode: 'practice' | 'mock';
  /** Existing attempt id created on server */
  attemptId: string;
  /** Total duration in seconds (for this attempt) */
  durationSeconds: number;
  /** Optional existing answers (e.g. resume) */
  initialAnswers?: ListeningAttemptAnswer[];
  /** Enable autosave (mock only) */
  enableAutosave?: boolean;
  /** Autosave interval (seconds) */
  autosaveIntervalSeconds?: number;
  /** Called when submit succeeds */
  onSubmitSuccess?: (attempt: ListeningAttempt) => void;
  /** Called when auto-submit happens on timeout */
  onAutoSubmit?: (attempt: ListeningAttempt) => void;
};

type UseListeningTestRunnerReturn = {
  status: ListeningTestRunnerStatus;
  timeLeft: number;
  totalDuration: number;
  currentSection: ListeningSection | null;
  currentQuestion: ListeningQuestion | null;
  currentSectionIndex: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  answers: Record<string, ListeningAttemptAnswer>;
  start: () => void;
  goToQuestion: (sectionIndex: number, questionIndex: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  setAnswer: (questionId: string, value: string | string[]) => void;
  submit: () => Promise<ListeningAttempt | null>;
};

function flattenQuestions(test: ListeningTest): { sectionIndex: number; questionIndex: number; question: ListeningQuestion }[] {
  const result: { sectionIndex: number; questionIndex: number; question: ListeningQuestion }[] = [];
  test.sections.forEach((section, sIdx) => {
    section.questions.forEach((q, qIdx) => {
      result.push({ sectionIndex: sIdx, questionIndex: qIdx, question: q });
    });
  });
  return result;
}

/**
 * Central hook to control the listening test run page:
 * - manages timer
 * - manages navigation
 * - collects answers
 * - calls submit + optional autosave for mock
 */
export function useListeningTestRunner(options: UseListeningTestRunnerOptions): UseListeningTestRunnerReturn {
  const {
    test,
    mode,
    attemptId,
    durationSeconds,
    initialAnswers,
    enableAutosave = mode === 'mock',
    autosaveIntervalSeconds = 30,
    onSubmitSuccess,
    onAutoSubmit,
  } = options;

  const [status, setStatus] = useState<ListeningTestRunnerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(durationSeconds);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [answers, setAnswers] = useState<Record<string, ListeningAttemptAnswer>>(() => {
    const map: Record<string, ListeningAttemptAnswer> = {};
    if (initialAnswers && initialAnswers.length > 0) {
      for (const a of initialAnswers) {
        map[a.questionId] = a;
      }
    }
    return map;
  });

  const flatQuestions = useMemo(() => flattenQuestions(test), [test]);
  const totalQuestions = flatQuestions.length;

  const currentSection: ListeningSection | null =
    test.sections[currentSectionIndex] ?? null;

  const currentQuestion: ListeningQuestion | null =
    currentSection?.questions[currentQuestionIndex] ?? null;

  const start = useCallback(() => {
    if (status === 'idle') {
      setStatus('running');
    }
  }, [status]);

  const goToQuestion = useCallback(
    (sectionIndex: number, questionIndex: number) => {
      const safeSectionIndex = Math.min(
        Math.max(sectionIndex, 0),
        test.sections.length - 1,
      );
      const section = test.sections[safeSectionIndex];
      if (!section) return;

      const safeQuestionIndex = Math.min(
        Math.max(questionIndex, 0),
        section.questions.length - 1,
      );

      setCurrentSectionIndex(safeSectionIndex);
      setCurrentQuestionIndex(safeQuestionIndex);
    },
    [test.sections],
  );

  const nextQuestion = useCallback(() => {
    const section = test.sections[currentSectionIndex];
    if (!section) return;

    if (currentQuestionIndex < section.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      return;
    }

    // Move to next section
    if (currentSectionIndex < test.sections.length - 1) {
      const nextSectionIndex = currentSectionIndex + 1;
      const nextSection = test.sections[nextSectionIndex];
      if (nextSection && nextSection.questions.length > 0) {
        setCurrentSectionIndex(nextSectionIndex);
        setCurrentQuestionIndex(0);
      }
    }
  }, [currentSectionIndex, currentQuestionIndex, test.sections]);

  const prevQuestion = useCallback(() => {
    const section = test.sections[currentSectionIndex];
    if (!section) return;

    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      return;
    }

    // Move to previous section last question
    if (currentSectionIndex > 0) {
      const prevSectionIndex = currentSectionIndex - 1;
      const prevSection = test.sections[prevSectionIndex];
      if (prevSection && prevSection.questions.length > 0) {
        setCurrentSectionIndex(prevSectionIndex);
        setCurrentQuestionIndex(prevSection.questions.length - 1);
      }
    }
  }, [currentSectionIndex, currentQuestionIndex, test.sections]);

  const setAnswer = useCallback(
    (questionId: string, value: string | string[]) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          questionId,
          value,
        },
      }));
    },
    [],
  );

  // Timer
  useEffect(() => {
    if (status !== 'running') return;
    if (timeLeft <= 0) return;

    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(id);
    };
  }, [status, timeLeft]);

  // Auto-expire + auto-submit when time finishes
  useEffect(() => {
    if (status === 'running' && timeLeft === 0) {
      setStatus('expired');
      // fire auto-submit
      void (async () => {
        try {
          const attempt = await submitInternal(true);
          if (attempt && onAutoSubmit) {
            onAutoSubmit(attempt);
          }
        } catch {
          // swallow; page can show toast based on expired state
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, timeLeft]);

  // Autosave (mock only)
  useEffect(() => {
    if (!enableAutosave || mode !== 'mock') return;
    if (status !== 'running') return;

    const intervalMs = autosaveIntervalSeconds * 1000;

    const id = window.setInterval(() => {
      const payloadAnswers: ListeningAttemptAnswer[] = Object.values(answers);
      // Best-effort, ignore errors
      void autosaveListeningMockAttempt({
        attemptId,
        answers: payloadAnswers,
        timeSpentSeconds: durationSeconds - timeLeft,
      }).catch(() => undefined);
    }, intervalMs);

    return () => {
      window.clearInterval(id);
    };
  }, [
    enableAutosave,
    mode,
    status,
    autosaveIntervalSeconds,
    answers,
    attemptId,
    durationSeconds,
    timeLeft,
  ]);

  const submitInternal = useCallback(
    async (fromTimeout = false): Promise<ListeningAttempt | null> => {
      if (status === 'submitting' || status === 'completed') return null;

      setStatus('submitting');

      const payloadAnswers: ListeningAttemptAnswer[] = Object.values(answers);

      try {
        const attempt = await submitListeningAttempt(mode, {
          attemptId,
          answers: payloadAnswers,
          timeSpentSeconds: durationSeconds - timeLeft,
        });

        setStatus('completed');
        if (!fromTimeout && onSubmitSuccess) {
          onSubmitSuccess(attempt);
        }

        return attempt;
      } catch (error) {
        // revert to running if manual submit failed
        setStatus((prev) => (prev === 'submitting' ? 'running' : prev));
        throw error;
      }
    },
    [
      answers,
      attemptId,
      durationSeconds,
      mode,
      onSubmitSuccess,
      timeLeft,
      status,
    ],
  );

  const submit = useCallback(async () => submitInternal(false), [submitInternal]);

  return {
    status,
    timeLeft,
    totalDuration: durationSeconds,
    currentSection,
    currentQuestion,
    currentSectionIndex,
    currentQuestionIndex,
    totalQuestions,
    answers,
    start,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    setAnswer,
    submit,
  };
}
