import * as React from 'react';

import { supabase } from '@/lib/supabaseClient';

type AnswerValue = string | string[] | Record<string, any> | null;

type Params = {
  questions: { id: string }[];
  testId?: string | null;
  attemptId?: string | null;
  readOnly?: boolean;
  debounceMs?: number;
};

const DEFAULT_DEBOUNCE_MS = 450;

const getAutosaveKey = (testId?: string | null) =>
  testId ? `reading:autosave:${testId}` : 'reading:autosave:local';

export const useReadingExamController = ({
  questions,
  testId,
  attemptId,
  readOnly = false,
  debounceMs = DEFAULT_DEBOUNCE_MS,
}: Params) => {
  const [activeQuestionId, setActiveQuestionId] = React.useState<string | null>(
    questions[0]?.id ?? null,
  );
  const [answers, setAnswers] = React.useState<Record<string, AnswerValue>>({});
  const [flags, setFlags] = React.useState<Record<string, boolean>>({});

  const autosaveKey = React.useMemo(() => getAutosaveKey(testId ?? attemptId ?? undefined), [testId, attemptId]);
  const debounceRef = React.useRef<number | null>(null);
  const lastSavedPayload = React.useRef<string>('');

  // hydrate on mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(autosaveKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { answers?: Record<string, AnswerValue>; flags?: Record<string, boolean>; activeQuestionId?: string };
      if (parsed?.answers) setAnswers(parsed.answers);
      if (parsed?.flags) setFlags(parsed.flags);
      if (parsed?.activeQuestionId) setActiveQuestionId(parsed.activeQuestionId);
    } catch {
      // ignore malformed payloads
    }
  }, [autosaveKey]);

  // keep activeQuestionId aligned with incoming questions
  React.useEffect(() => {
    if (activeQuestionId) return;
    if (questions[0]?.id) setActiveQuestionId(questions[0].id);
  }, [activeQuestionId, questions]);

  const persistLocal = React.useCallback(
    (nextAnswers: Record<string, AnswerValue>, nextFlags: Record<string, boolean>, nextActive: string | null) => {
      if (typeof window === 'undefined') return;
      try {
        window.localStorage.setItem(
          autosaveKey,
          JSON.stringify({ answers: nextAnswers, flags: nextFlags, activeQuestionId: nextActive }),
        );
      } catch {
        // ignore storage errors
      }
    },
    [autosaveKey],
  );

  const persistRemote = React.useCallback(
    async (nextAnswers: Record<string, AnswerValue>, nextFlags: Record<string, boolean>, nextActive: string | null) => {
      if (!attemptId || readOnly) return;

      const payload = { answers: nextAnswers, flags: nextFlags, activeQuestionId: nextActive };
      const payloadStr = JSON.stringify(payload);
      if (payloadStr === lastSavedPayload.current) return;

      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) return;

      await supabase
        .from('exam_events')
        .insert({
          attempt_id: attemptId,
          user_id: data.user.id,
          event_type: 'reading_autosave',
          payload,
          occurred_at: new Date().toISOString(),
        })
        .catch(() => undefined);

      lastSavedPayload.current = payloadStr;
    },
    [attemptId, readOnly],
  );

  const flushAutosave = React.useCallback(
    (state?: { answers?: Record<string, AnswerValue>; flags?: Record<string, boolean>; active?: string | null }) => {
      const nextAnswers = state?.answers ?? answers;
      const nextFlags = state?.flags ?? flags;
      const nextActive = state?.active ?? activeQuestionId;
      persistLocal(nextAnswers, nextFlags, nextActive);
      void persistRemote(nextAnswers, nextFlags, nextActive);
    },
    [activeQuestionId, answers, flags, persistLocal, persistRemote],
  );

  const scheduleAutosave = React.useCallback(
    (nextAnswers: Record<string, AnswerValue>, nextFlags: Record<string, boolean>, nextActive: string | null) => {
      if (typeof window === 'undefined') return;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => flushAutosave({ answers: nextAnswers, flags: nextFlags, active: nextActive }), debounceMs) as unknown as number;
    },
    [debounceMs, flushAutosave],
  );

  const setAnswer = React.useCallback(
    (questionId: string, value: AnswerValue) => {
      setAnswers((prev) => {
        const next = { ...prev, [questionId]: value };
        scheduleAutosave(next, flags, activeQuestionId);
        return next;
      });
    },
    [activeQuestionId, flags, scheduleAutosave],
  );

  const toggleFlag = React.useCallback(
    (questionId: string) => {
      setFlags((prev) => {
        const next = { ...prev, [questionId]: !prev[questionId] };
        scheduleAutosave(answers, next, activeQuestionId);
        return next;
      });
    },
    [activeQuestionId, answers, scheduleAutosave],
  );

  // flush on blur/unmount
  React.useEffect(() => {
    const handleBlur = () => flushAutosave();
    if (typeof window === 'undefined') return;
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('blur', handleBlur);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      flushAutosave();
    };
  }, [flushAutosave]);

  return {
    activeQuestionId,
    setActiveQuestionId,
    answers,
    setAnswer,
    flags,
    toggleFlag,
    flushAutosave,
  } as const;
};

export type ReadingExamController = ReturnType<typeof useReadingExamController>;
