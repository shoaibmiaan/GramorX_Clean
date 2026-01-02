import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import TimerProgress from '@/components/reading/TimerProgress';
import { ReadingPassagePane } from './ReadingPassagePane';
import { ReadingQuestionItem } from './ReadingQuestionItem';
import { QuestionNav } from './QuestionNav';

import type { ReadingTest, ReadingPassage, ReadingQuestion } from '@/lib/reading/types';

import { supabase } from '@/lib/supabaseClient';
import { readingBandFromRaw } from '@/lib/reading/band';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/design-system/Toaster';
import { Icon } from '@/components/design-system/Icon';

// STRICT CBE MODALS
import { ExamConfirmPopup } from '@/components/exam/ExamConfirmPopup';
import { ExamStrictModePopup } from '@/components/exam/ExamStrictModePopup';
import { ExamExitPopup } from '@/components/exam/ExamExitPopup';
import { ExamTimeWarningPopup } from '@/components/exam/ExamTimeWarningPopup';

type Props = {
  // ✅ normalize: allow null so the shell never explodes
  test: ReadingTest | null;
  passages: ReadingPassage[];
  questions: ReadingQuestion[];

  /** Optional: if true, disables submit + instructions (for future review mode) */
  readOnly?: boolean;

  /** NEW: run mode (mock vs drill) */
  mode?: 'mock' | 'speed';

  /** NEW: where “Finish drill” should go (fallback only) */
  finishHref?: string;

  /** Optional: passed by drill pages, safe to ignore here */
  speedLevels?: any;
};

type AnswerValue = string | string[] | Record<string, any> | null;

type FilterStatus = 'all' | 'flagged' | 'unanswered';
type FilterType = 'all' | 'tfng' | 'ynng' | 'mcq' | 'gap' | 'match';
type ZoomLevel = 'sm' | 'md' | 'lg';

// Theme support
type Theme = 'light' | 'dark' | 'system';
const THEME_KEY = 'rx-reading-theme';
const FOCUS_KEY = 'rx-reading-focus';
const ZOOM_KEY = 'rx-reading-zoom';
const ATTEMPT_KEY_PREFIX = 'rx-reading-attempt';

// Split layout support (draggable)
const SPLIT_KEY = 'rx-reading-split-step';

// 7 steps from "passage wide" to "questions wide"
const SPLIT_LAYOUT_CLASSES = [
  'lg:grid-cols-[minmax(0,1.7fr)_10px_minmax(0,1fr)]',
  'lg:grid-cols-[minmax(0,1.5fr)_10px_minmax(0,1fr)]',
  'lg:grid-cols-[minmax(0,1.3fr)_10px_minmax(0,1fr)]',
  'lg:grid-cols-[minmax(0,1.15fr)_10px_minmax(0,1.15fr)]',
  'lg:grid-cols-[minmax(0,1.1fr)_10px_minmax(0,1.3fr)]',
  'lg:grid-cols-[minmax(0,1.0fr)_10px_minmax(0,1.5fr)]',
  'lg:grid-cols-[minmax(0,1.0fr)_10px_minmax(0,1.7fr)]',
] as const;

const splitStepFromRatio = (ratio: number): number => {
  const steps = SPLIT_LAYOUT_CLASSES.length;
  const min = 0.3;
  const max = 0.7;
  const clamped = Math.min(max, Math.max(min, ratio));
  const t = (clamped - min) / (max - min);
  const raw = Math.round(t * (steps - 1));
  return Math.min(steps - 1, Math.max(0, raw));
};

const isAnswered = (value: AnswerValue) => {
  if (!value) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    return Object.values(value).some((v) => (v ?? '').toString().trim() !== '');
  }
  return false;
};

const isUuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

// ✅ normalize + provide safe defaults for UI
const normalizeTest = (test: ReadingTest | null) => {
  const durationSeconds =
    typeof test?.durationSeconds === 'number' && Number.isFinite(test.durationSeconds)
      ? test.durationSeconds
      : 3600;

  const examType = (test as any)?.examType === 'gt' ? 'gt' : 'ac';

  return {
    id: test?.id ?? null,
    title: test?.title ?? 'Reading Mock',
    examType,
    durationSeconds,
  };
};

const ReadingExamShellInner: React.FC<Props> = ({
  test,
  passages,
  questions,
  readOnly = false,
  mode = 'mock',
  finishHref = '/mock/reading/drill',
}) => {
  const toast = useToast();
  const t = React.useMemo(() => normalizeTest(test), [test]);

  const isDrill = mode === 'speed';

  // ===== THEME / SYSTEM DARK =====
  const [theme, setTheme] = React.useState<Theme>('system');
  const [systemPrefersDark, setSystemPrefersDark] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.localStorage.getItem(THEME_KEY) as Theme | null;
    if (saved && ['light', 'dark', 'system'].includes(saved)) setTheme(saved);
  }, []);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    setSystemPrefersDark(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  React.useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    const effectiveDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);
    root.classList.add(effectiveDark ? 'dark' : 'light');
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme, systemPrefersDark]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light'));
  };

  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);

  // ===== CORE STATE (MUST BE BEFORE ANY CONDITIONAL UI) =====
  const [answers, setAnswers] = React.useState<Record<string, AnswerValue>>({});
  const [flags, setFlags] = React.useState<Record<string, boolean>>({});

  const [statusFilter, setStatusFilter] = React.useState<FilterStatus>('all');
  const [typeFilter, setTypeFilter] = React.useState<FilterType>('all');

  const [currentPassageIdx, setCurrentPassageIdx] = React.useState(0);
  const [currentQuestionId, setCurrentQuestionId] = React.useState<string | null>(null);

  const [focusMode, setFocusMode] = React.useState(false);
  const [zoom, setZoom] = React.useState<ZoomLevel>('md');

  const [highlightsByPassage, setHighlightsByPassage] = React.useState<Record<string, string[]>>({});

  const [started, setStarted] = React.useState(readOnly);
  const [attemptId, setAttemptId] = React.useState<string | null>(null);

  const questionRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const startTimeRef = React.useRef<number | null>(null);
  const submitting = React.useRef(false);
  const savingDraft = React.useRef(false);

  // strict CBE modals
  const [showSubmitConfirm, setShowSubmitConfirm] = React.useState(false);
  const [showExitPopup, setShowExitPopup] = React.useState(false);
  const [showTimeWarning, setShowTimeWarning] = React.useState(false);
  const [timeWarningShown, setTimeWarningShown] = React.useState(false);

  // ✅ FIX: never read from test directly; use normalized
  const durationSeconds = t.durationSeconds;
  const [remainingSeconds, setRemainingSeconds] = React.useState<number>(durationSeconds);

  React.useEffect(() => {
    setRemainingSeconds(durationSeconds);
  }, [durationSeconds]);

  // ✅ set initial currentQuestionId when questions arrive
  React.useEffect(() => {
    if (!currentQuestionId && questions.length > 0) {
      setCurrentQuestionId(questions[0].id);
    }
  }, [currentQuestionId, questions]);

  // ✅ content guard (NO early return; we render fallback UI later)
  const hasContent = questions.length > 0 && passages.length > 0;

  // ===== SPLIT LAYOUT STATE (DRAGGABLE) =====
  // IMPORTANT: must be before any conditional return (we have none now)
  const [splitStep, setSplitStep] = React.useState<number>(3);
  const layoutContainerRef = React.useRef<HTMLDivElement | null>(null);
  const splitDragActiveRef = React.useRef(false);
  const splitBoundsRef = React.useRef<{ left: number; width: number } | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(SPLIT_KEY);
    if (!raw) return;
    const parsed = Number(raw);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed < SPLIT_LAYOUT_CLASSES.length) {
      setSplitStep(parsed);
    }
  }, []);

  const handleSplitMouseMove = (event: MouseEvent) => {
    if (!splitDragActiveRef.current) return;
    const bounds = splitBoundsRef.current;
    if (!bounds) return;

    const relativeX = event.clientX - bounds.left;
    if (relativeX <= 0 || relativeX >= bounds.width) return;

    const ratio = relativeX / bounds.width;
    const step = splitStepFromRatio(ratio);

    setSplitStep((prev) => {
      if (prev === step) return prev;
      if (typeof window !== 'undefined') window.localStorage.setItem(SPLIT_KEY, String(step));
      return step;
    });
  };

  const handleSplitMouseUp = () => {
    if (!splitDragActiveRef.current) return;
    splitDragActiveRef.current = false;
    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', handleSplitMouseMove);
      window.removeEventListener('mouseup', handleSplitMouseUp);
    }
  };

  const handleSplitMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window === 'undefined') return;
    if (!layoutContainerRef.current) return;

    const rect = layoutContainerRef.current.getBoundingClientRect();
    splitBoundsRef.current = { left: rect.left, width: rect.width };
    splitDragActiveRef.current = true;

    window.addEventListener('mousemove', handleSplitMouseMove);
    window.addEventListener('mouseup', handleSplitMouseUp);

    event.preventDefault();
  };

  React.useEffect(() => {
    return () => {
      if (typeof window === 'undefined') return;
      window.removeEventListener('mousemove', handleSplitMouseMove);
      window.removeEventListener('mouseup', handleSplitMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== HYDRATE PREFS =====
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const focusRaw = window.localStorage.getItem(FOCUS_KEY);
    if (focusRaw === '1') setFocusMode(true);

    const zoomRaw = window.localStorage.getItem(ZOOM_KEY) as ZoomLevel | null;
    if (zoomRaw === 'sm' || zoomRaw === 'md' || zoomRaw === 'lg') setZoom(zoomRaw);
  }, []);

  const toggleFocus = () => {
    setFocusMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') window.localStorage.setItem(FOCUS_KEY, next ? '1' : '0');
      return next;
    });
  };

  const changeZoom = (level: ZoomLevel) => {
    setZoom(level);
    if (typeof window !== 'undefined') window.localStorage.setItem(ZOOM_KEY, level);
  };

  // internal countdown for time warning popup
  React.useEffect(() => {
    if (readOnly || !started) return;
    if (typeof window === 'undefined') return;

    const interval = window.setInterval(() => {
      setRemainingSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [started, readOnly]);

  React.useEffect(() => {
    if (readOnly || !started || timeWarningShown) return;
    const minutesLeft = Math.floor(remainingSeconds / 60);
    if (minutesLeft <= 5) {
      setShowTimeWarning(true);
      setTimeWarningShown(true);
    }
  }, [remainingSeconds, readOnly, started, timeWarningShown]);

  // ===== PASSAGE / QUESTION MAPS =====
  const passageIndexById = React.useMemo(() => {
    const m: Record<string, number> = {};
    passages.forEach((p, idx) => {
      m[(p as any).id as string] = idx;
    });
    return m;
  }, [passages]);

  const questionsById = React.useMemo(() => {
    const m: Record<string, ReadingQuestion> = {};
    questions.forEach((q) => {
      m[q.id] = q;
    });
    return m;
  }, [questions]);

  // ✅ SAFE current passage + id
  const currentPassage = passages[currentPassageIdx] ?? passages[0] ?? null;
  const currentPassageId = isUuid((currentPassage as any)?.id) ? ((currentPassage as any).id as string) : null;

  // ===== COUNTERS =====
  const total = questions.length;

  const answeredCount = React.useMemo(
    () => questions.filter((q) => isAnswered(answers[q.id])).length,
    [questions, answers],
  );
  const unansweredCount = total - answeredCount;

  const flaggedCount = React.useMemo(() => Object.values(flags).filter(Boolean).length, [flags]);

  // ===== FILTERED QUESTIONS =====
  const visibleQuestions = React.useMemo(() => {
    // If we have no current passage, show nothing (safe)
    if (!currentPassageId) return [];

    return questions.filter((q) => {
      // only show current passage
      if ((q as any).passageId && (q as any).passageId !== currentPassageId) return false;

      // type filter
      const type = ((q as any).questionTypeId ?? 'all') as FilterType;
      if (typeFilter !== 'all' && type !== typeFilter) return false;

      const val = answers[q.id];
      const isA = isAnswered(val);
      const isF = flags[q.id] ?? false;

      if (statusFilter === 'flagged' && !isF) return false;
      if (statusFilter === 'unanswered' && isA) return false;

      return true;
    });
  }, [questions, currentPassageId, answers, flags, statusFilter, typeFilter]);

  // ===== JUMP / NAV =====
  const handleJump = (id: string) => {
    setCurrentQuestionId(id);
    const q = questionsById[id];

    if (q && (q as any).passageId) {
      const idx = passageIndexById[(q as any).passageId as string];
      if (typeof idx === 'number') setCurrentPassageIdx(idx);
    }

    const el = questionRefs.current[id];
    if (el && typeof window !== 'undefined') el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    void saveDraft();
  };

  const goNextPassage = () => {
    setCurrentPassageIdx((idx) => (idx + 1 < passages.length ? idx + 1 : idx));
    void saveDraft();
  };
  const goPrevPassage = () => {
    setCurrentPassageIdx((idx) => (idx > 0 ? idx - 1 : idx));
    void saveDraft();
  };

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleFlag = (questionId: string) => {
    setFlags((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // ===== HIGHLIGHTS =====
  const currentHighlights = currentPassageId ? highlightsByPassage[currentPassageId] ?? [] : [];

  const handleAddHighlight = (passageId: string, text: string) => {
    if (!text.trim()) return;
    setHighlightsByPassage((prev) => {
      const existing = prev[passageId] ?? [];
      if (existing.includes(text)) return prev;
      return { ...prev, [passageId]: [...existing, text] };
    });
  };

  const handleClearHighlights = (passageId: string) => {
    setHighlightsByPassage((prev) => ({ ...prev, [passageId]: [] }));
  };

  const attemptStorageKey = React.useMemo(() => {
    const testId = t.id ?? 'unknown';
    return `${ATTEMPT_KEY_PREFIX}:${testId}`;
  }, [t.id]);

  const hydrateFromAttempt = React.useCallback((meta: any) => {
    if (!meta || typeof meta !== 'object') return;
    if (meta.answers && typeof meta.answers === 'object') {
      setAnswers(meta.answers as Record<string, AnswerValue>);
    }
    if (meta.flags && typeof meta.flags === 'object') {
      setFlags(meta.flags as Record<string, boolean>);
    }
    if (meta.highlights && typeof meta.highlights === 'object') {
      setHighlightsByPassage(meta.highlights as Record<string, string[]>);
    }
  }, []);

  const saveDraft = React.useCallback(
    async (overrides?: { durationSeconds?: number }) => {
      if (readOnly || isDrill || !started) return;
      if (!attemptId) return;
      if (savingDraft.current) return;

      savingDraft.current = true;
      try {
        const durationSecondsOverride = overrides?.durationSeconds;
        const durationSecondsSafe =
          typeof durationSecondsOverride === 'number'
            ? durationSecondsOverride
            : startTimeRef.current
            ? Math.floor((Date.now() - startTimeRef.current) / 1000)
            : 0;

        const { error } = await supabase
          .from('reading_attempts')
          .update({
            status: 'in_progress',
            duration_seconds: durationSecondsSafe,
            meta: { flags, answers, highlights: highlightsByPassage },
          })
          .eq('id', attemptId);

        if (error) {
          console.warn('Failed to auto-save reading attempt', error);
        }
      } finally {
        savingDraft.current = false;
      }
    },
    [answers, flags, highlightsByPassage, attemptId, isDrill, readOnly, started],
  );

  React.useEffect(() => {
    if (readOnly || isDrill || !started) return;
    if (!t.id) return;
    if (attemptId) return;
    if (typeof window === 'undefined') return;

    const ensureAttempt = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const storedId = window.localStorage.getItem(attemptStorageKey);
        if (storedId) {
          const { data: existing, error } = await supabase
            .from('reading_attempts')
            .select('id, user_id, status, submitted_at, duration_seconds, meta')
            .eq('id', storedId)
            .maybeSingle();

          if (!error && existing && existing.user_id === user.id && !existing.submitted_at) {
            setAttemptId(existing.id);
            hydrateFromAttempt(existing.meta);
            if (typeof existing.duration_seconds === 'number') {
              startTimeRef.current = Date.now() - existing.duration_seconds * 1000;
              setRemainingSeconds((prev) =>
                Math.max(0, durationSeconds - existing.duration_seconds),
              );
            }
            return;
          }

          window.localStorage.removeItem(attemptStorageKey);
        }

        const { data: created, error: createError } = await supabase
          .from('reading_attempts')
          .insert({
            user_id: user.id,
            test_id: t.id,
            status: 'in_progress',
            started_at: new Date().toISOString(),
            duration_seconds: 0,
            meta: { flags: {}, answers: {}, highlights: {} },
          })
          .select('id')
          .maybeSingle();

        if (createError || !created) {
          console.warn('Failed to create reading attempt', createError);
          return;
        }

        setAttemptId(created.id as string);
        window.localStorage.setItem(attemptStorageKey, created.id as string);
      } catch (error) {
        console.warn('Failed to initialize reading attempt', error);
      }
    };

    void ensureAttempt();
  }, [
    attemptId,
    attemptStorageKey,
    durationSeconds,
    hydrateFromAttempt,
    isDrill,
    readOnly,
    started,
    t.id,
  ]);

  React.useEffect(() => {
    if (readOnly || isDrill || !started) return;
    if (!attemptId) return;
    const interval = window.setInterval(() => {
      void saveDraft();
    }, 20000);

    return () => window.clearInterval(interval);
  }, [attemptId, isDrill, readOnly, saveDraft, started]);

  const computeScore = () => {
    let correct = 0;

    for (const q of questions) {
      const userA = answers[q.id];
      const correctA = (q as any).correctAnswer;

      let ok = false;
      if (typeof correctA === 'string') ok = userA === correctA;
      else if (Array.isArray(correctA)) {
        ok = Array.isArray(userA) && correctA.every((x) => (userA as string[]).includes(x));
      }
      if (ok) correct++;
    }

    const accuracy = total > 0 ? Number(((correct / total) * 100).toFixed(2)) : 0;
    return { correct, accuracy };
  };

  // ===== SUBMIT (CORE) =====
  const submitToServer = async () => {
    if (readOnly) return;
    if (submitting.current) return;

    submitting.current = true;

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) console.error('Failed to fetch user', userError);

      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Not signed in',
          description: 'You must be logged in to submit.',
        });
        submitting.current = false;
        return;
      }

      const startedAt = startTimeRef.current ?? Date.now();
      const durationSec = Math.floor((Date.now() - startedAt) / 1000);

      const { correct, accuracy } = computeScore();

      // ✅ DRILL SAVE (separate table)
      if (isDrill) {
        const baseTestId = isUuid(t.id) ? t.id : null;
        const passageId = isUuid(currentPassageId) ? currentPassageId : null;

        const { data: drillRow, error: drillError } = await supabase
          .from('reading_drill_attempts')
          .insert({
            user_id: user.id,
            drill_type: 'speed',
            base_test_id: baseTestId,
            passage_id: passageId,
            question_count: total,
            duration_seconds: durationSec,
            raw_score: correct,
            accuracy,
            status: 'submitted',
            meta: {
              flags,
              answers,
              highlights: highlightsByPassage,
              mode: 'speed',
              duration_seconds_config: durationSeconds,
              finished_at: new Date().toISOString(),
            },
          })
          .select('id')
          .maybeSingle();

        if (drillError || !drillRow) {
          console.error('Failed to insert reading_drill_attempts', drillError);
          toast({
            variant: 'destructive',
            title: 'Failed to save drill result',
            description: drillError?.message || 'Your drill finished but result could not be saved.',
          });

          if (typeof window !== 'undefined') window.location.href = finishHref;
          submitting.current = false;
          return;
        }

        const drillAttemptId = (drillRow as any).id as string;

        toast({
          variant: 'default',
          title: 'Speed drill saved',
          description: `Score: ${correct}/${total} • Accuracy: ${accuracy}%`,
        });

        if (typeof window !== 'undefined') {
          window.location.href = `/mock/reading/drill/result/${drillAttemptId}`;
        }

        submitting.current = false;
        return;
      }

      // ✅ MOCK SAVE (existing table)
      if (!t.id) {
        toast({
          variant: 'destructive',
          title: 'Missing test data',
          description: 'This run is missing its test payload. Go back and start the mock again.',
        });
        submitting.current = false;
        return;
      }

      const band = readingBandFromRaw(correct, total);

      const metaPayload = { flags, answers, highlights: highlightsByPassage };
      const basePayload = {
        status: 'submitted',
        duration_seconds: durationSec,
        raw_score: correct,
        band_score: band,
        section_stats: {},
        meta: metaPayload,
        submitted_at: new Date().toISOString(),
      };

      let attemptRow: any = null;
      let attemptError: any = null;

      if (attemptId) {
        const updateRes = await supabase
          .from('reading_attempts')
          .update(basePayload)
          .eq('id', attemptId)
          .select()
          .maybeSingle();
        attemptRow = updateRes.data;
        attemptError = updateRes.error;
      } else {
        const insertRes = await supabase
          .from('reading_attempts')
          .insert({
            user_id: user.id,
            test_id: t.id,
            started_at: new Date().toISOString(),
            ...basePayload,
          })
          .select()
          .maybeSingle();
        attemptRow = insertRes.data;
        attemptError = insertRes.error;
      }

      if (attemptError || !attemptRow) {
        console.error('Failed to submit reading_attempt', attemptError);
        const message = attemptError?.message ?? '';

        if (message.includes('uq_reading_attempt_in_progress')) {
          toast({
            variant: 'destructive',
            title: 'Attempt already in progress',
            description:
              'You already have an active attempt for this test. Refresh the page or open it from your attempts history.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Failed to submit attempt',
            description: message || 'Something went wrong while saving your attempt. Please try again.',
          });
        }

        submitting.current = false;
        return;
      }

      const resolvedAttemptId: string = (attemptRow as any).id;
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(attemptStorageKey);
        window.location.href = `/mock/reading/result/${resolvedAttemptId}`;
      }
    } catch (err: any) {
      console.error('Unexpected error during reading submit', err);
      toast({
        variant: 'destructive',
        title: 'Unexpected error',
        description: err?.message ?? 'An unexpected error occurred while submitting.',
      });
    } finally {
      submitting.current = false;
    }
  };

  // ===== SUBMIT BUTTON HANDLER =====
  const handleSubmitClick = () => {
    if (readOnly) return;

    // Drill can be finished even with unanswered – still saves what you did
    if (!isDrill) {
      if (answeredCount === 0) {
        toast({
          variant: 'destructive',
          title: 'Cannot submit yet',
          description: 'Answer at least one question before submitting.',
        });
        return;
      }

      if (unansweredCount > 0) {
        setShowSubmitConfirm(true);
        return;
      }
    }

    void submitToServer();
  };

  // ===== NAV helpers =====
  const currentIndex = Math.max(0, questions.findIndex((q) => q.id === currentQuestionId));

  const goPrevQuestion = () => {
    if (currentIndex <= 0) return;
    handleJump(questions[currentIndex - 1].id);
  };

  const goNextQuestion = () => {
    if (currentIndex + 1 >= questions.length) return;
    handleJump(questions[currentIndex + 1].id);
  };

  const handleStartTest = () => {
    startTimeRef.current = Date.now();
    setStarted(true);
  };

  const handleExit = () => {
    if (typeof window !== 'undefined') window.location.href = isDrill ? finishHref : '/mock/reading';
  };

  // ===== LABELS =====
  const examTypeLabel =
    t.examType === 'gt' ? 'IELTS Reading · General Training' : 'IELTS Reading · Academic';

  const durationMinutes = Math.round(durationSeconds / 60);
  const remainingMinutesSafe = Math.max(0, Math.floor(remainingSeconds / 60));

  // ✅ When no content, render a safe “empty state” inside the shell
  if (!hasContent) {
    return (
      <div className="h-[100dvh] max-h-[100dvh] w-full bg-background text-foreground flex items-center justify-center p-4">
        <Card className="p-6 text-sm text-muted-foreground max-w-xl w-full">
          This Reading test does not have passages or questions configured yet.
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'h-[100dvh] max-h-[100dvh] w-full bg-background text-foreground flex flex-col overflow-hidden',
        focusMode && 'ring-2 ring-primary/40',
      )}
    >
      {/* TOP EXAM BAR (CBE-PLUS) */}
      <div
        className={cn(
          'flex items-center justify-between gap-3 border-b border-border/70 px-3 py-2 sm:px-4 sm:py-2 shadow-sm',
          isDark
            ? 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950'
            : 'bg-gradient-to-r from-blue-50 via-white to-blue-50',
        )}
      >
        {/* Left: exam meta */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-primary/80">
            <span className="inline-flex items-center gap-1">
              <Icon name="BookOpen" className="h-3.5 w-3.5" />
              {isDrill ? 'Reading Drill · Speed' : examTypeLabel}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Icon name="FileText" className="h-3.5 w-3.5" />
              {total} Q
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-muted-foreground">
              <Icon name="Layers" className="h-3.5 w-3.5" />
              {passages.length} passages
            </span>
            <span className="hidden md:inline-flex items-center gap-1 text-muted-foreground">
              <Icon name="Clock" className="h-3.5 w-3.5" />
              {durationMinutes} min
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="line-clamp-1 font-medium text-foreground">{t.title}</span>
            <span className="hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-1">
              <Icon name="CheckCircle2" className="h-3.5 w-3.5" />
              {answeredCount}/{total} answered
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <Icon name="Flag" className="h-3.5 w-3.5" />
              {flaggedCount} flagged
            </span>
          </div>
        </div>

        {/* Right: controls + timer */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="outline"
              className="h-7 px-2 text-[11px]"
              onClick={() => setShowExitPopup(true)}
              disabled={readOnly}
            >
              <Icon name="LogOut" className="mr-1 h-3.5 w-3.5" />
              Exit
            </Button>

            <Button size="xs" variant="ghost" onClick={toggleTheme} className="h-7 w-7">
              <Icon name={isDark ? 'Moon' : 'Sun'} className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1 rounded-full border border-primary/50 bg-background/80 px-2 py-0.5 shadow-sm">
              <span className="mr-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Zoom
              </span>
              <Button
                size="xs"
                variant={zoom === 'sm' ? 'secondary' : 'ghost'}
                className="h-6 px-1.5 text-[10px]"
                onClick={() => changeZoom('sm')}
              >
                S
              </Button>
              <Button
                size="xs"
                variant={zoom === 'md' ? 'secondary' : 'ghost'}
                className="h-6 px-1.5 text-[10px]"
                onClick={() => changeZoom('md')}
              >
                M
              </Button>
              <Button
                size="xs"
                variant={zoom === 'lg' ? 'secondary' : 'ghost'}
                className="h-6 px-1.5 text-[10px]"
                onClick={() => changeZoom('lg')}
              >
                L
              </Button>

              <span className="mx-1 h-4 w-px bg-border/60" />

              <Button
                size="xs"
                variant={focusMode ? 'primary' : 'outline'}
                className="h-6 px-2 text-[10px] font-semibold"
                onClick={toggleFocus}
              >
                {focusMode ? 'Focus on' : 'Focus mode'}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-semibold tracking-wide text-primary/80 uppercase">
                Time remaining
              </span>
              <div className="mt-0.5 text-sm font-semibold tabular-nums">
                <TimerProgress total={total} />
              </div>
              <span className="mt-0.5 text-[10px] text-muted-foreground">
                ~{remainingMinutesSafe} minutes left
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BODY AREA */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          ref={layoutContainerRef}
          className={cn(
            'hidden lg:grid flex-1 gap-4 px-4 py-3 overflow-hidden',
            SPLIT_LAYOUT_CLASSES[splitStep],
          )}
        >
          <ReadingPassagePane
            passage={currentPassage as any}
            totalPassages={passages.length}
            currentPassageIndex={currentPassageIdx}
            onPrev={goPrevPassage}
            onNext={goNextPassage}
            highlights={currentHighlights}
            onAddHighlight={(text) => currentPassageId && handleAddHighlight(currentPassageId, text)}
            onClearHighlights={() => currentPassageId && handleClearHighlights(currentPassageId)}
            zoom={zoom}
          />

          <div
            className="hidden lg:flex items-center justify-center cursor-col-resize select-none"
            onMouseDown={handleSplitMouseDown}
            aria-hidden="true"
          >
            <div className="relative h-[80%] w-px bg-border/60">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/70 bg-background/90 px-1.5 py-2 shadow-sm flex items-center justify-center">
                <Icon name="GripVertical" className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="bg-card/95 shadow-sm rounded-lg flex flex-col overflow-hidden border border-border/60">
            <div id="reading-question-nav">
              <QuestionNav
                questions={questions}
                answers={answers}
                flags={flags}
                currentQuestionId={currentQuestionId}
                onJump={handleJump}
                statusFilter={statusFilter}
                typeFilter={typeFilter}
                setStatusFilter={setStatusFilter}
                setTypeFilter={setTypeFilter}
              />
            </div>

            <div
              className={cn(
                'flex-1 overflow-y-auto px-4 py-4 space-y-4',
                isDark ? 'bg-background/80' : 'bg-white',
                zoom === 'sm' && 'text-xs',
                zoom === 'md' && 'text-sm',
                zoom === 'lg' && 'text-base',
              )}
            >
              {visibleQuestions.length === 0 ? (
                <Card className="p-4 text-sm text-muted-foreground">
                  No questions match the current filters for this passage.
                </Card>
              ) : (
                visibleQuestions.map((q) => {
                  const isCurrent = q.id === currentQuestionId;
                  const isFlagged = !!flags[q.id];
                  const val = answers[q.id] ?? null;

                  return (
                    <div
                      key={q.id}
                      ref={(el) => {
                        questionRefs.current[q.id] = el;
                      }}
                      className={cn(
                        'rounded-lg transition ring-0',
                        isCurrent
                          ? isDark
                            ? 'ring-1 ring-primary/70 bg-primary/10'
                            : 'ring-2 ring-blue-500 bg-blue-50'
                          : 'hover:bg-muted/50',
                      )}
                    >
                      <ReadingQuestionItem
                        question={q}
                        value={val}
                        onChange={(v) => handleAnswerChange(q.id, v)}
                        isFlagged={isFlagged}
                        onToggleFlag={() => toggleFlag(q.id)}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* MOBILE / TABLET STACKED */}
        <div className="flex flex-col gap-4 px-4 py-3 lg:hidden overflow-y-auto">
          <ReadingPassagePane
            passage={currentPassage as any}
            totalPassages={passages.length}
            currentPassageIndex={currentPassageIdx}
            onPrev={goPrevPassage}
            onNext={goNextPassage}
            highlights={currentHighlights}
            onAddHighlight={(text) => currentPassageId && handleAddHighlight(currentPassageId, text)}
            onClearHighlights={() => currentPassageId && handleClearHighlights(currentPassageId)}
            zoom={zoom}
          />

          <Card className="p-3 border-border/70 bg-card/95 shadow-sm" id="reading-question-nav">
            <QuestionNav
              questions={questions}
              answers={answers}
              flags={flags}
              currentQuestionId={currentQuestionId}
              onJump={handleJump}
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              setStatusFilter={setStatusFilter}
              setTypeFilter={setTypeFilter}
            />
          </Card>

          <div
            className={cn(
              'space-y-3',
              zoom === 'sm' && 'text-xs',
              zoom === 'md' && 'text-sm',
              zoom === 'lg' && 'text-base',
            )}
          >
            {visibleQuestions.length === 0 ? (
              <Card className="p-4 text-sm text-muted-foreground">
                No questions match the current filters for this passage.
              </Card>
            ) : (
              visibleQuestions.map((q) => {
                const isCurrent = q.id === currentQuestionId;
                const isFlagged = !!flags[q.id];
                const val = answers[q.id] ?? null;

                return (
                  <div
                    key={q.id}
                    ref={(el) => {
                      questionRefs.current[q.id] = el;
                    }}
                    className={cn(
                      'rounded-lg transition ring-0',
                      isCurrent
                        ? isDark
                          ? 'ring-1 ring-primary/70 bg-primary/10'
                          : 'ring-2 ring-blue-500 bg-blue-50'
                        : 'p-0',
                    )}
                  >
                    <ReadingQuestionItem
                      question={q}
                      value={val}
                      onChange={(v) => handleAnswerChange(q.id, v)}
                      isFlagged={isFlagged}
                      onToggleFlag={() => toggleFlag(q.id)}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM EXAM ACTION BAR */}
      <div className="border-t border-border/70 bg-card/95 px-3 py-2 sm:px-4 sm:py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
          <span className="font-semibold text-foreground">
            Question {currentIndex + 1} of {total}
          </span>
          <span>•</span>
          <span>
            {answeredCount} answered, {unansweredCount} remaining
          </span>
          {flaggedCount > 0 && (
            <>
              <span>•</span>
              <span>{flaggedCount} flagged</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 justify-end">
          <Button size="sm" variant="secondary" disabled={currentIndex <= 0} onClick={goPrevQuestion}>
            <Icon name="ArrowLeft" className="mr-1 h-4 w-4" />
            Previous
          </Button>

          {readOnly ? (
            <Button size="sm" variant="secondary" disabled>
              Review only
            </Button>
          ) : (
            <Button size="sm" variant="primary" onClick={handleSubmitClick}>
              {isDrill ? 'Finish drill' : 'Submit attempt'}
            </Button>
          )}
        </div>
      </div>

      {/* STRICT MODE POPUP */}
      {!readOnly && <ExamStrictModePopup open={!started} onAcknowledge={handleStartTest} />}

      {/* SUBMIT CONFIRM POPUP (mock only) */}
      {!isDrill && (
        <ExamConfirmPopup
          open={showSubmitConfirm}
          unanswered={unansweredCount}
          onCancel={() => setShowSubmitConfirm(false)}
          onConfirm={() => {
            setShowSubmitConfirm(false);
            void submitToServer();
          }}
        />
      )}

      {/* EXIT TEST POPUP */}
      <ExamExitPopup
        open={showExitPopup}
        unanswered={unansweredCount}
        onCancel={() => setShowExitPopup(false)}
        onExit={handleExit}
      />

      {/* TIME WARNING POPUP */}
      <ExamTimeWarningPopup
        open={showTimeWarning}
        remainingMinutes={remainingMinutesSafe}
        onClose={() => setShowTimeWarning(false)}
        onJumpToNav={() => {
          if (typeof document !== 'undefined') {
            const el = document.getElementById('reading-question-nav');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
      />
    </div>
  );
};

export const ReadingExamShell = ReadingExamShellInner;
export default ReadingExamShellInner;
