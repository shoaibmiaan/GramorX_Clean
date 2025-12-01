// components/reading/ReadingExamShell.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import TimerProgress from '@/components/reading/TimerProgress';
import { ReadingPassagePane } from './ReadingPassagePane';
import { ReadingQuestionItem } from './ReadingQuestionItem';
import { QuestionNav } from './QuestionNav';

import type {
  ReadingTest,
  ReadingPassage,
  ReadingQuestion,
} from '@/lib/reading/types';

import { supabase } from '@/lib/supabaseClient';
import { readingBandFromRaw } from '@/lib/reading/band';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/design-system/Toaster';

type Props = {
  test: ReadingTest;
  passages: ReadingPassage[];
  questions: ReadingQuestion[];
  /** Optional: if true, disables submit + instructions (for future review mode) */
  readOnly?: boolean;
};

type AnswerValue = string | string[] | Record<string, any> | null;

type FilterStatus = 'all' | 'flagged' | 'unanswered';
type FilterType = 'all' | 'tfng' | 'ynng' | 'mcq' | 'gap' | 'match';
type ZoomLevel = 'sm' | 'md' | 'lg';

const FOCUS_KEY = 'rx-reading-focus';
const ZOOM_KEY = 'rx-reading-zoom';

const isAnswered = (value: AnswerValue) => {
  if (!value) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    return Object.values(value).some((v) => (v ?? '').toString().trim() !== '');
  }
  return false;
};

const ReadingExamShellInner: React.FC<Props> = ({
  test,
  passages,
  questions,
  readOnly = false,
}) => {
  const { toast } = useToast();

  if (!questions.length || !passages.length) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        This Reading test does not have passages or questions configured yet.
      </Card>
    );
  }

  // ===== CORE STATE =====
  const [answers, setAnswers] = React.useState<Record<string, AnswerValue>>({});
  const [flags, setFlags] = React.useState<Record<string, boolean>>({});

  const [statusFilter, setStatusFilter] =
    React.useState<FilterStatus>('all');
  const [typeFilter, setTypeFilter] = React.useState<FilterType>('all');

  const [currentPassageIdx, setCurrentPassageIdx] = React.useState(0);
  const [currentQuestionId, setCurrentQuestionId] = React.useState(
    questions[0]?.id ?? null,
  );

  const [focusMode, setFocusMode] = React.useState(false);
  const [zoom, setZoom] = React.useState<ZoomLevel>('md');

  const [timeExpired, setTimeExpired] = React.useState(false);

  // per-passage highlights
  const [highlightsByPassage, setHighlightsByPassage] = React.useState<
    Record<string, string[]>
  >({});

  const [started, setStarted] = React.useState(readOnly);

  const questionRefs =
    React.useRef<Record<string, HTMLDivElement | null>>({});

  const startTimeRef = React.useRef<number>(Date.now());
  const submitting = React.useRef(false);

  // ===== HYDRATE PREFS =====
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const focusRaw = window.localStorage.getItem(FOCUS_KEY);
    if (focusRaw === '1') setFocusMode(true);

    const zoomRaw = window.localStorage.getItem(ZOOM_KEY) as ZoomLevel | null;
    if (zoomRaw === 'sm' || zoomRaw === 'md' || zoomRaw === 'lg') {
      setZoom(zoomRaw);
    }
  }, []);

  const toggleFocus = () => {
    setFocusMode((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(FOCUS_KEY, next ? '1' : '0');
      }
      return next;
    });
  };

  const changeZoom = (level: ZoomLevel) => {
    setZoom(level);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ZOOM_KEY, level);
    }
  };

  const handleStart = () => {
    startTimeRef.current = Date.now();
    setStarted(true);
    setTimeExpired(false);
  };

  const handleTimeExpire = () => {
    if (timeExpired) return;
    setTimeExpired(true);
    toast({
      variant: 'warning',
      title: 'Time is up',
      description:
        'The 60-minute window for this IELTS Reading mock has ended.',
    });
  };

  const handleStart = () => {
    startTimeRef.current = Date.now();
    setStarted(true);
    setTimeExpired(false);
  };

  // ===== PASSAGE / QUESTION MAPS =====
  const passageIndexById = React.useMemo(() => {
    const m: Record<string, number> = {};
    passages.forEach((p, idx) => {
      // @ts-expect-error reading type shape
      m[p.id as string] = idx;
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

  const currentPassage = passages[currentPassageIdx];

  // ===== COUNTERS =====
  const total = questions.length;
  const answeredCount = React.useMemo(
    () => questions.filter((q) => isAnswered(answers[q.id])).length,
    [questions, answers],
  );
  const unansweredCount = total - answeredCount;

  const flaggedCount = React.useMemo(
    () => Object.values(flags).filter(Boolean).length,
    [flags],
  );

  // ===== FILTERED QUESTIONS (current passage + filters) =====
  const visibleQuestions = React.useMemo(() => {
    return questions.filter((q) => {
      // only show current passage
      // @ts-expect-error reading type
      if (q.passageId && q.passageId !== currentPassage.id) return false;

      // type filter
      // @ts-expect-error reading type
      const type = (q.questionTypeId ?? 'all') as FilterType;
      if (typeFilter !== 'all' && type !== typeFilter) return false;

      // status filter
      const val = answers[q.id];
      const isA = isAnswered(val);
      const isF = flags[q.id] ?? false;

      if (statusFilter === 'flagged' && !isF) return false;
      if (statusFilter === 'unanswered' && isA) return false;

      return true;
    });
  }, [questions, currentPassage, answers, flags, statusFilter, typeFilter]);

  // ===== JUMP QUESTION =====
  const handleJump = (id: string) => {
    setCurrentQuestionId(id);
    const q = questionsById[id];

    // passage sync
    // @ts-expect-error reading type
    if (q && q.passageId) {
      // @ts-expect-error reading type
      const idx = passageIndexById[q.passageId as string];
      if (typeof idx === 'number') setCurrentPassageIdx(idx);
    }

    const el = questionRefs.current[id];
    if (el && typeof window !== 'undefined') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ===== PASSAGE NAV =====
  const goNextPassage = () => {
    setCurrentPassageIdx((idx) =>
      idx + 1 < passages.length ? idx + 1 : idx,
    );
  };
  const goPrevPassage = () => {
    setCurrentPassageIdx((idx) => (idx > 0 ? idx - 1 : idx));
  };

  // ===== ANSWERS / FLAGS =====
  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleFlag = (questionId: string) => {
    setFlags((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // ===== HIGHLIGHTS (per passage) =====
  const currentHighlights =
    highlightsByPassage[currentPassage.id] ?? [];

  const handleAddHighlight = (passageId: string, text: string) => {
    if (!text.trim()) return;
    setHighlightsByPassage((prev) => {
      const existing = prev[passageId] ?? [];
      if (existing.includes(text)) return prev;
      return {
        ...prev,
        [passageId]: [...existing, text],
      };
    });
  };

  const handleClearHighlights = (passageId: string) => {
    setHighlightsByPassage((prev) => ({
      ...prev,
      [passageId]: [],
    }));
  };

  // ===== SUBMIT =====
  const handleSubmit = async () => {
    if (readOnly) return;
    if (submitting.current) return;
    submitting.current = true;

    try {
      if (answeredCount === 0) {
        toast({
          variant: 'destructive',
          title: 'Cannot submit yet',
          description: 'Answer at least one question before submitting.',
        });
        submitting.current = false;
        return;
      }

      if (unansweredCount > 0 && typeof window !== 'undefined') {
        const ok = window.confirm(
          `You still have ${unansweredCount} unanswered question${
            unansweredCount > 1 ? 's' : ''
          }. Submit anyway?`,
        );
        if (!ok) {
          submitting.current = false;
          return;
        }
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch user', userError);
      }
      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Not signed in',
          description: 'You must be logged in to submit this mock.',
        });
        submitting.current = false;
        return;
      }

      let correct = 0;
      for (const q of questions) {
        const userA = answers[q.id];
        // @ts-expect-error reading type
        const correctA = q.correctAnswer;

        let ok = false;
        if (typeof correctA === 'string') {
          ok = userA === correctA;
        } else if (Array.isArray(correctA)) {
          ok =
            Array.isArray(userA) &&
            correctA.every((x) => userA.includes(x));
        }
        if (ok) correct++;
      }

      const band = readingBandFromRaw(correct, total);
      const durationSec = Math.floor(
        (Date.now() - startTimeRef.current) / 1000,
      );

      const { data: attemptRow, error: attemptError } = await supabase
        .from('reading_attempts')
        .insert({
          user_id: user.id,
          // @ts-expect-error reading type
          test_id: test.id,
          status: 'completed',
          duration_seconds: durationSec,
          raw_score: correct,
          band_score: band,
          section_stats: {},
          meta: {
            flags,
            answers,
            highlights: highlightsByPassage,
          },
        })
        .select()
        .maybeSingle();

      if (attemptError || !attemptRow) {
        // eslint-disable-next-line no-console
        console.error('Failed to insert reading_attempt', attemptError);

        toast({
          variant: 'destructive',
          title: 'Failed to submit attempt',
          description:
            attemptError?.message ??
            'Something went wrong while saving your attempt. Please try again.',
        });

        submitting.current = false;
        return;
      }

      const attemptId: string = (attemptRow as any).id;
      if (typeof window !== 'undefined') {
        window.location.href = `/mock/reading/result/${attemptId}`;
      }
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Unexpected error during reading submit', err);

      toast({
        variant: 'destructive',
        title: 'Unexpected error',
        description:
          err?.message ??
          'An unexpected error occurred while submitting your attempt.',
      });
    } finally {
      submitting.current = false;
    }
  };

  // ===== NAV helpers =====
  const currentIndex =
    questions.findIndex((q) => q.id === currentQuestionId) ?? 0;

  const currentQuestion =
    currentQuestionId && questionsById[currentQuestionId]
      ? questionsById[currentQuestionId]
      : null;

  const currentFlagged = currentQuestionId
    ? !!flags[currentQuestionId]
    : false;

  const goPrevQuestion = () => {
    if (currentIndex <= 0) return;
    handleJump(questions[currentIndex - 1].id);
  };

  const goNextQuestion = () => {
    if (currentIndex + 1 >= questions.length) return;
    handleJump(questions[currentIndex + 1].id);
  };

  // ===== INSTRUCTIONS MODAL =====
  const showOverlay = !started && !readOnly;

  return (
    <div
      className={cn(
        'min-h-[80vh] w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#f0f2f5] shadow-lg',
        focusMode && 'bg-background',
      )}
    >
      {/* Header */}
      <header className="bg-[#0a2e5c] text-white shadow-md px-5 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">{test.title}</h1>
          {/* @ts-expect-error reading type */}
          {test.description && (
            <p className="mt-0.5 text-[11px] text-white/80">
              {/* @ts-expect-error reading type */}
              {test.description}
            </p>
          )}
          <p className="text-[11px] text-white/75">
            {total} questions ·{' '}
            {/* @ts-expect-error reading type */}
            {test.examType.toUpperCase()} · 60 minutes
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[11px]">
            <span className="opacity-80 mr-1">Zoom</span>
            <Button
              size="xs"
              variant={zoom === 'sm' ? 'secondary' : 'ghost'}
              onClick={() => changeZoom('sm')}
            >
              S
            </Button>
            <Button
              size="xs"
              variant={zoom === 'md' ? 'secondary' : 'ghost'}
              onClick={() => changeZoom('md')}
            >
              M
            </Button>
            <Button
              size="xs"
              variant={zoom === 'lg' ? 'secondary' : 'ghost'}
              onClick={() => changeZoom('lg')}
            >
              L
            </Button>
          </div>

          <Button
            size="xs"
            variant={focusMode ? 'secondary' : 'outline'}
            onClick={toggleFocus}
          >
            {focusMode ? 'Focus view' : 'Standard view'}
          </Button>

          <div className="bg-white/10 rounded-lg px-3 py-2 text-center">
            <TimerProgress
              total={total}
              answered={answeredCount}
              durationSeconds={test.durationSeconds ?? 3600}
              isActive={started && !timeExpired}
              onExpire={handleTimeExpire}
            />
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col gap-4 p-4 lg:p-6 overflow-hidden">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] flex-1 overflow-hidden">
          {/* LEFT: Passage */}
          <div className="min-h-0 flex flex-col">
            <ReadingPassagePane
              passage={currentPassage}
              totalPassages={passages.length}
              currentPassageIndex={currentPassageIdx}
              onPrev={goPrevPassage}
              onNext={goNextPassage}
              highlights={currentHighlights}
              onAddHighlight={(text) => handleAddHighlight(currentPassage.id, text)}
              onClearHighlights={() => handleClearHighlights(currentPassage.id)}
              zoom={zoom}
            />
          </div>

          {/* RIGHT: Questions */}
          <div className="min-h-0 flex flex-col bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50 text-slate-800">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  Questions {currentPassageIdx + 1}
                </p>
                <p className="text-sm font-semibold">Answer the items for this passage</p>
              </div>

              {currentQuestion && (
                <Button
                  size="sm"
                  variant={currentFlagged ? 'soft' : 'outline'}
                  tone={currentFlagged ? 'warning' : 'default'}
                  onClick={() => toggleFlag(currentQuestion.id)}
                >
                  {currentFlagged ? 'Unmark review' : 'Mark for review'}
                </Button>
              )}
            </div>

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

            <div
              className={cn(
                'flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white',
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
                      className={
                        isCurrent
                          ? 'rounded-lg ring-1 ring-[#0a2e5c] p-1 bg-slate-50'
                          : 'p-1'
                      }
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
      </div>

      {/* Footer */}
      <footer className="bg-white border-t px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={goPrevQuestion}
            disabled={currentIndex <= 0}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={goNextQuestion}
            disabled={currentIndex + 1 >= total}
          >
            Next
          </Button>
        </div>

        <div className="hidden md:flex items-center gap-3 text-sm text-slate-600">
          <span>
            Question {currentIndex + 1} of {total}
          </span>
          <span>Answered {answeredCount}</span>
          <span>Marked {flaggedCount}</span>
        </div>

        <Button
          size="sm"
          variant="primary"
          onClick={handleSubmit}
          disabled={readOnly}
        >
          {readOnly ? 'Review only' : 'Submit'}
        </Button>
      </footer>

      {/* Instructions Overlay */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl p-8 space-y-5 shadow-2xl">
            <div className="border-b pb-3">
              <h2 className="text-xl font-semibold text-slate-900">
                IELTS Computer-Based Reading Test
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                You have 60 minutes to complete {total} questions across{' '}
                {passages.length} passages.
              </p>
            </div>
            <div className="space-y-3 text-sm text-slate-700">
              <p className="font-semibold">Instructions:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Use the Highlight button to mark important text.</li>
                <li>Click Mark for review to flag a question for later.</li>
                <li>Navigate via the colored dots or the Previous/Next buttons.</li>
                <li>The timer mirrors the official IELTS computer-based layout.</li>
              </ul>
              <p>
                When you are ready, start the clock and begin answering. You can
                change answers anytime before submitting.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="primary" size="sm" onClick={handleStart}>
                Start Reading Test
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export const ReadingExamShell = ReadingExamShellInner;
export default ReadingExamShellInner;
