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
    <div className={cn('w-full', focusMode && 'bg-background')}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary-900 text-primary-foreground shadow px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{test.title}</h1>
          {/* @ts-expect-error reading type */}
          {test.description && (
            <p className="mt-0.5 text-[11px] opacity-80">
              {/* @ts-expect-error reading type */}
              {test.description}
            </p>
          )}
          <p className="text-[11px] opacity-75">
            {total} questions ·{' '}
            {/* @ts-expect-error reading type */}
            {test.examType.toUpperCase()} · 60 minutes
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-primary-800/60 rounded-md px-2 py-1 text-[11px]">
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

          {/* Focus toggle */}
          <Button
            size="xs"
            variant={focusMode ? 'secondary' : 'outline'}
            onClick={toggleFocus}
          >
            {focusMode ? 'Focus on' : 'Focus off'}
          </Button>

          <div className="bg-primary-800/70 rounded-md px-4 py-2 text-center">
            <div className="text-[11px] opacity-75">TIME REMAINING</div>
            <TimerProgress total={total} />
          </div>
        </div>
      </header>

      {/* DESKTOP SPLIT: lg+ */}
      <div className="hidden lg:flex gap-4 h-[calc(100vh-140px)] px-4 py-3 overflow-hidden">
        {/* LEFT PASSAGE */}
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

        {/* RIGHT QUESTIONS */}
        <div className="w-[42%] bg-card shadow-sm rounded-lg flex flex-col overflow-hidden">
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
              'flex-1 overflow-y-auto px-4 py-4 space-y-4',
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
                        ? 'rounded-lg ring-1 ring-primary p-1'
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

      {/* MOBILE / TABLET STACKED: < lg */}
      <div className="flex flex-col gap-4 px-4 py-3 lg:hidden">
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

        <Card className="p-3">
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
                  className={
                    isCurrent
                      ? 'rounded-lg ring-1 ring-primary p-1'
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

      {/* FOOTER */}
      <footer className="bg-card border-t px-6 py-3 flex items-center justify-between">
        <Button size="sm" variant="outline" onClick={goPrevQuestion}>
          Previous
        </Button>

        <div className="text-sm text-muted-foreground">
          Question {currentIndex + 1} of {total} · Flagged {flaggedCount}
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

      {/* INSTRUCTIONS OVERLAY */}
      {showOverlay && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <Card className="w-full max-w-lg p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-semibold text-foreground">
              IELTS Reading – Computer Based
            </h2>
            <p className="text-sm text-muted-foreground">
              You have <strong>60 minutes</strong> to answer{' '}
              <strong>{total}</strong> questions based on{' '}
              <strong>{passages.length}</strong> passages.
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>You can highlight text in the passage.</li>
              <li>You can flag questions for review.</li>
              <li>
                Use the dots at the top of the question panel to jump quickly.
              </li>
              <li>Your time will continue even if you switch tabs.</li>
            </ul>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStarted(true)}
              >
                Start test
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
