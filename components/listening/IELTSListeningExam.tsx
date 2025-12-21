// components/listening/IELTSListeningExam.tsx
import * as React from 'react';
import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';

import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';

import SaveButton from '@/components/listening/SaveButton';
import {
  ListeningSidebarProgress,
  type ListeningSectionProgress,
  type ListeningQuestionProgress,
} from '@/components/listening/ListeningSidebarProgress';
import { ListeningAudioPlayer } from '@/components/listening/ListeningAudioPlayer';

import type {
  ListeningTest,
  ListeningSection,
  ListeningQuestion,
} from '@/lib/listening/types';

type ExamStatus = 'starting' | 'active' | 'submitting' | 'finished';

type Props = {
  test: ListeningTest;
  sections: ListeningSection[];
  questions: ListeningQuestion[];
  candidateId: string;
};

type AnswerState = {
  value: string;
  timestamp?: number;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type ReviewItem = {
  id: string;
  qNum: number;
  isAnswered: boolean;
  isFlagged: boolean;
};

// small, DS-style theme toggle for exam room
const ExamThemeToggle: React.FC = () => {
  const { theme, setTheme, systemTheme } = useTheme();
  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  const isDark = effectiveTheme === 'dark';

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <Button
      type="button"
      size="xs"
      variant="ghost"
      className="inline-flex items-center gap-1 rounded-full text-[11px]"
      onClick={handleToggle}
    >
      <Icon name={isDark ? 'Sun' : 'Moon'} className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">
        {isDark ? 'Light' : 'Dark'}
      </span>
    </Button>
  );
};

const IELTSListeningExam: React.FC<Props> = ({
  test,
  sections,
  questions,
  candidateId,
}) => {
  const router = useRouter();

  // -------- BASIC TEST METADATA --------
  const totalQuestions = questions.length || (test as any).totalQuestions || 40;
  const durationSeconds =
    (test as any).durationSeconds ?? (test as any).duration_seconds ?? 40 * 60;

  // -------- DEBUG AUDIO LOGGING --------
  React.useEffect(() => {
    console.log('Exam Audio Debug:', {
      testTitle: test.title,
      audioUrl: test.audioUrl,
      audioUrlExists: !!test.audioUrl,
      sectionsCount: sections.length,
      // Log if sections have their own audio URLs (they shouldn't for IELTS)
      sectionsWithAudio: sections.filter(s => !!s.audioUrl).length
    });
  }, [test, sections]);

  // -------- EXAM STATE --------
  const [status, setStatus] = React.useState<ExamStatus>('starting');
  const [timeLeft, setTimeLeft] = React.useState<number>(durationSeconds);

  const [answers, setAnswers] = React.useState<Record<string, AnswerState>>({});
  const [flagged, setFlagged] = React.useState<Set<string>>(new Set());

  const [currentSectionIndex, setCurrentSectionIndex] = React.useState(0);
  const [splitPercent, setSplitPercent] = React.useState(65);

  const splitContainerRef = React.useRef<HTMLDivElement | null>(null);

  // -------- SAVE STATE (for SaveButton) --------
  const [saveState, setSaveState] = React.useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);

  // -------- REVIEW UI STATE --------
  const [showReviewPanel, setShowReviewPanel] = React.useState(false);
  const [reviewFlaggedOnly, setReviewFlaggedOnly] = React.useState(false);

  const [showExitConfirm, setShowExitConfirm] = React.useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = React.useState(false);

  // -------- DEBUG STATE --------
  const [showDebug, setShowDebug] = React.useState(false);

  // -------- SORT QUESTIONS --------
  const sortedQuestions = React.useMemo(
    () =>
      [...questions].sort((a, b) => {
        const aNo =
          (a as any).questionNumber ??
          (a as any).qno ??
          (a as any).order_no ??
          0;
        const bNo =
          (b as any).questionNumber ??
          (b as any).qno ??
          (b as any).order_no ??
          0;
        return aNo - bNo;
      }),
    [questions],
  );

  const hasSections = sections.length > 0;
  const currentSection = hasSections ? sections[currentSectionIndex] : null;

  // -------- SECTION QUESTIONS --------
  const sectionQuestions = React.useMemo(() => {
    if (hasSections && currentSection) {
      return sortedQuestions.filter((q) => {
        const sectionId = (q as any).sectionId ?? (q as any).section_id ?? null;
        const sectionNo = (q as any).sectionNo ?? (q as any).section_no ?? null;
        const secOrder =
          (currentSection as any).orderNo ??
          (currentSection as any).order_no ??
          null;

        if (sectionId && sectionId === (currentSection as any).id) return true;
        if (sectionNo != null && secOrder != null && sectionNo === secOrder)
          return true;
        return false;
      });
    }

    // fallback: split into 4 virtual sections by number
    const start = currentSectionIndex * 10 + 1;
    const end = start + 9;
    return sortedQuestions.filter((q, idx) => {
      const qNum =
        (q as any).questionNumber ??
        (q as any).qno ??
        (q as any).order_no ??
        idx + 1;
      return qNum >= start && qNum <= end;
    });
  }, [hasSections, currentSection, currentSectionIndex, sortedQuestions]);

  const sectionStart =
    sectionQuestions[0] &&
    ((sectionQuestions[0] as any).questionNumber ??
      (sectionQuestions[0] as any).qno ??
      (sectionQuestions[0] as any).order_no ??
      currentSectionIndex * 10 + 1);

  const sectionEnd =
    sectionQuestions[sectionQuestions.length - 1] &&
    ((sectionQuestions[sectionQuestions.length - 1] as any).questionNumber ??
      (sectionQuestions[sectionQuestions.length - 1] as any).qno ??
      (sectionQuestions[sectionQuestions.length - 1] as any).order_no ??
      sectionStart +
        Math.max(sectionQuestions.length - 1, 0));

  const answeredCount = React.useMemo(
    () =>
      Object.values(answers).filter((a) => a.value && a.value.trim().length > 0)
        .length,
    [answers],
  );
  const flaggedCount = flagged.size;

  // -------- TIMER --------
  React.useEffect(() => {
    if (status !== 'active') return;

    const id = window.setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          window.clearInterval(id);
          void submitAttempt(true);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // -------- REFRESH WARNING (beforeunload) --------
  React.useEffect(() => {
    if (status !== 'active') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [status]);

  // -------- LOCAL STORAGE (LOAD) --------
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const keyBase = `listening-mock-${(test as any).id ?? test.slug}`;

    try {
      const storedAnswers = window.localStorage.getItem(`${keyBase}:answers`);
      const storedFlagged = window.localStorage.getItem(`${keyBase}:flagged`);

      if (storedAnswers) {
        const parsed = JSON.parse(storedAnswers) as Record<string, AnswerState>;
        setAnswers(parsed);
      }
      if (storedFlagged) {
        const parsed = JSON.parse(storedFlagged) as string[];
        setFlagged(new Set(parsed));
      }
    } catch {
      // ignore
    }
  }, [test]);

  // -------- LOCAL STORAGE (AUTO-SAVE) --------
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!Object.keys(answers).length && !flagged.size) return;

    const keyBase = `listening-mock-${(test as any).id ?? test.slug}`;

    const id = window.setInterval(() => {
      try {
        setSaveState('saving');
        window.localStorage.setItem(
          `${keyBase}:answers`,
          JSON.stringify(answers),
        );
        window.localStorage.setItem(
          `${keyBase}:flagged`,
          JSON.stringify(Array.from(flagged)),
        );
        setLastSavedAt(new Date());
        setSaveState('saved');
      } catch (err) {
        console.error('Local save failed', err);
        setSaveState('error');
      }
    }, 4000);

    return () => window.clearInterval(id);
  }, [answers, flagged, test]);

  // -------- ANSWERS / FLAGS --------
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { value, timestamp: Date.now() },
    }));
  };

  const toggleFlag = (questionId: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const goToQuestion = (q: ListeningQuestion, indexFallback: number) => {
    if (hasSections) {
      const sectionId = (q as any).sectionId ?? (q as any).section_id ?? null;
      const sectionNo = (q as any).sectionNo ?? (q as any).section_no ?? null;

      if (sectionId) {
        const idx = sections.findIndex((s) => (s as any).id === sectionId);
        if (idx >= 0) setCurrentSectionIndex(idx);
      } else if (sectionNo != null) {
        const idx = sections.findIndex((s) => {
          const order =
            (s as any).orderNo ?? (s as any).order_no ?? sections.indexOf(s) + 1;
          return order === sectionNo;
        });
        if (idx >= 0) setCurrentSectionIndex(idx);
      }
    } else {
      const qNum =
        (q as any).questionNumber ??
        (q as any).qno ??
        (q as any).order_no ??
        indexFallback + 1;
      const virtualIndex = Math.floor((qNum - 1) / 10);
      setCurrentSectionIndex(virtualIndex);
    }

    const qNum =
      (q as any).questionNumber ??
      (q as any).qno ??
      (q as any).order_no ??
      indexFallback + 1;
    const el = document.getElementById(`question-${qNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // -------- SUBMIT --------
  const submitAttempt = async (auto: boolean) => {
    if (status === 'submitting' || status === 'finished') return;
    setStatus('submitting');

    let score = 0;
    sortedQuestions.forEach((q, idx) => {
      const userValue = answers[(q as any).id]?.value
        ?.trim()
        .toLowerCase();
      const correct =
        typeof (q as any).correctAnswer === 'string'
          ? (q as any).correctAnswer.trim().toLowerCase()
          : null;
      if (userValue && correct && userValue === correct) score++;
    });

    const payload = {
      testId: (test as any).id ?? null,
      testSlug: test.slug as string,
      rawScore: score,
      totalQuestions,
      durationSeconds,
      autoSubmitted: auto,
      answers: sortedQuestions.map((q, idx) => ({
        questionId: (q as any).id,
        questionNumber:
          (q as any).questionNumber ??
          (q as any).qno ??
          (q as any).order_no ??
          idx + 1,
        section: (q as any).sectionNo ?? (q as any).section_no ?? null,
        value: answers[(q as any).id]?.value ?? '',
        flagged: flagged.has((q as any).id),
      })),
    };

    try {
      const res = await fetch('/api/listening/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let redirectUrl: string | null = null;
      if (res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { redirectUrl?: string; attemptId?: string }
          | null;
        if (data?.redirectUrl) redirectUrl = data.redirectUrl;
        else if (data?.attemptId)
          redirectUrl = `/mock/listening/results/${data.attemptId}`;
      }

      if (!redirectUrl) {
        redirectUrl = `/mock/listening/${test.slug}/results?score=${score}&total=${totalQuestions}`;
      }

      setStatus('finished');
      await router.push(redirectUrl);
    } catch (err) {
      console.error('submit failed', err);
      setStatus('finished');
      await router.push(
        `/mock/listening/${test.slug}/results?score=${score}&total=${totalQuestions}`,
      );
    }
  };

  // -------- SPLIT DRAG --------
  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const container = splitContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startX = e.clientX;
    const startSplit = splitPercent;

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      const deltaPercent = (delta / rect.width) * 100;
      let next = startSplit + deltaPercent;
      if (next < 35) next = 35;
      if (next > 75) next = 75;
      setSplitPercent(next);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const formatClock = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    const mm = m < 10 ? `0${m}` : `${m}`;
    const ss = s < 10 ? `0${s}` : `${s}`;
    return `${mm}:${ss}`;
  };

  // -------- SIDEBAR PROGRESS DATA --------
  const sectionsProgress: ListeningSectionProgress[] = React.useMemo(() => {
    if (!sections.length) {
      const virtual: ListeningSectionProgress[] = [];
      const perSection = Math.ceil(totalQuestions / 4);
      for (let i = 0; i < 4; i++) {
        const start = i * perSection + 1;
        const end = Math.min((i + 1) * perSection, totalQuestions);
        const qs = sortedQuestions.filter((q, idx) => {
          const qNum =
            (q as any).questionNumber ??
            (q as any).qno ??
            (q as any).order_no ??
            idx + 1;
          return qNum >= start && qNum <= end;
        });

        const answeredInSec = qs.filter((q) => {
          const val = answers[(q as any).id]?.value ?? '';
          return !!val && val.trim().length > 0;
        }).length;

        virtual.push({
          id: `virtual-${i + 1}`,
          order: i + 1,
          label: `Section ${i + 1}`,
          totalQuestions: qs.length,
          answeredQuestions: answeredInSec,
          isCurrent: currentSectionIndex === i,
          isCompleted: answeredInSec === qs.length && qs.length > 0,
          isLocked: false,
        });
      }
      return virtual;
    }

    return sections.map((sec, idx) => {
      const secId = (sec as any).id;
      const order =
        (sec as any).orderNo ?? (sec as any).order_no ?? idx + 1;

      const qs = sortedQuestions.filter((q) => {
        const sectionId = (q as any).sectionId ?? (q as any).section_id ?? null;
        const sectionNo = (q as any).sectionNo ?? (q as any).section_no ?? null;

        if (sectionId && sectionId === secId) return true;
        if (sectionNo != null && sectionNo === order) return true;
        return false;
      });

      const answeredInSec = qs.filter((q) => {
        const val = answers[(q as any).id]?.value ?? '';
        return !!val && val.trim().length > 0;
      }).length;

      return {
        id: secId ?? `section-${order}`,
        order,
        label: (sec as any).title ?? `Section ${order}`,
        totalQuestions: qs.length,
        answeredQuestions: answeredInSec,
        isCurrent: currentSectionIndex === idx,
        isCompleted: answeredInSec === qs.length && qs.length > 0,
        isLocked: false,
      } as ListeningSectionProgress;
    });
  }, [sections, sortedQuestions, answers, totalQuestions, currentSectionIndex]);

  const currentSectionProgress =
    sectionsProgress[currentSectionIndex] ?? null;

  const currentSectionQuestionsProgress: ListeningQuestionProgress[] =
    React.useMemo(
      () =>
        sectionQuestions.map((q, idx) => {
          const qNum =
            (q as any).questionNumber ??
            (q as any).qno ??
            (q as any).order_no ??
            (sectionStart ?? 1) + idx;
          const val = answers[(q as any).id]?.value ?? '';
          const isAnswered = !!val && val.trim().length > 0;
          const isFlagged = flagged.has((q as any).id);

          return {
            id: (q as any).id,
            questionNo: qNum,
            isAnswered,
            isFlagged,
            isCurrent: false,
          };
        }),
      [sectionQuestions, answers, flagged, sectionStart],
    );

  // -------- REVIEW ITEMS (popup list) --------
  const reviewItems: ReviewItem[] = React.useMemo(
    () =>
      sortedQuestions
        .map((q, idx) => {
          const id = (q as any).id as string;
          const qNum =
            (q as any).questionNumber ??
            (q as any).qno ??
            (q as any).order_no ??
            idx + 1;
          const val = answers[id]?.value ?? '';
          const isAnswered = !!val && val.trim().length > 0;
          const isFlagged = flagged.has(id);
          return { id, qNum, isAnswered, isFlagged };
        })
        .filter((item) =>
          reviewFlaggedOnly ? item.isFlagged : true,
        ),
    [sortedQuestions, answers, flagged, reviewFlaggedOnly],
  );

  // -------- DIRECT AUDIO TEST --------
  const testDirectAudio = React.useCallback(() => {
    if (!test.audioUrl) {
      console.error('No audio URL to test');
      alert('No audio URL found for this test.');
      return;
    }

    console.log('Testing audio URL:', test.audioUrl);

    const audio = new Audio(test.audioUrl);
    audio.preload = 'metadata';

    audio.addEventListener('loadedmetadata', () => {
      console.log('Direct audio test - loaded:', {
        duration: audio.duration,
        readyState: audio.readyState,
        durationFormatted: `${Math.floor(audio.duration / 60)}:${Math.floor(audio.duration % 60).toString().padStart(2, '0')}`
      });
      alert(`Audio loaded successfully! Duration: ${Math.floor(audio.duration / 60)}:${Math.floor(audio.duration % 60).toString().padStart(2, '0')}`);
    });

    audio.addEventListener('error', (e) => {
      console.error('Direct audio test - error:', audio.error);
      alert(`Audio error: ${audio.error?.message || 'Unknown error'}. Check console for details.`);
    });

    audio.addEventListener('canplay', () => {
      console.log('Audio can play');
      audio.play().then(() => {
        console.log('Direct audio test - playing successfully');
        alert('Audio is playing!');
      }).catch(err => {
        console.error('Direct audio test - play failed:', err);
        alert(`Play failed: ${err.message}. This might be due to browser autoplay policies.`);
      });
    });

    // Load the audio
    audio.load();
  }, [test.audioUrl]);

  // -------- RENDER --------
  if (status === 'finished') return null;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-muted/40">
      {/* TOP BAR */}
      <header className="border-b border-border/60 bg-background/95 text-foreground backdrop-blur">
        <div className="flex h-10 items-center justify-between px-4 text-[11px] sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center justify-center rounded-sm bg-primary/10 px-2 py-[2px] text-[11px] font-semibold tracking-[0.16em] text-primary">
              IELTS
            </span>
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Listening</span>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
              <span>Academic</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SaveButton
              state={saveState}
              lastSavedAt={lastSavedAt}
              className="hidden sm:flex"
            />
            <ExamThemeToggle />
            <span className="hidden items-center gap-1 text-muted-foreground sm:inline-flex">
              Candidate ID:
              <span className="font-semibold text-foreground">
                {candidateId}
              </span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Time left</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-[2px] font-mono text-[11px]">
                <Icon name="Timer" className="h-3.5 w-3.5" />
                {formatClock(timeLeft)}
              </span>
            </div>
          </div>
        </div>
        {/* thin brand stripe so blue is there but not heavy */}
        <div className="h-[3px] w-full bg-primary" />
      </header>

      {/* MAIN BODY */}
      <main className="min-h-0 flex-1">
        <div
          ref={splitContainerRef}
          className="flex h-full min-h-0 w-full"
        >
          {/* LEFT: QUESTIONS */}
          <section
            className="flex h-full min-h-0 flex-col border-r border-border bg-background"
            style={{ flexBasis: `${splitPercent}%` }}
          >
            {/* Section header + next/prev controls */}
            <div className="border-b border-border/60 bg-card/70 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-caption font-semibold text-primary">
                    SECTION {currentSectionIndex + 1}
                  </p>
                  {sectionStart && sectionEnd && (
                    <p className="text-[11px] text-muted-foreground">
                      Questions {sectionStart}–{sectionEnd}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    • Answer all questions. • You will hear each section once
                    only.
                  </p>
                  <p className="mt-1 text-[11px] text-primary/80">
                    🔊 One continuous audio file will play for all sections.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {currentSectionIndex > 0 && (
                    <Button
                      size="xs"
                      variant="outline"
                      className="rounded-full text-[11px]"
                      onClick={() =>
                        setCurrentSectionIndex(currentSectionIndex - 1)
                      }
                    >
                      <Icon
                        name="ArrowLeft"
                        className="mr-1 h-3.5 w-3.5"
                      />
                      Previous section
                    </Button>
                  )}
                  {currentSectionIndex < sectionsProgress.length - 1 && (
                    <Button
                      size="xs"
                      variant="outline"
                      className="rounded-full text-[11px]"
                      onClick={() =>
                        setCurrentSectionIndex(currentSectionIndex + 1)
                      }
                    >
                      Next section
                      <Icon
                        name="ArrowRight"
                        className="ml-1 h-3.5 w-3.5"
                      />
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-1 px-4 pb-2 text-[11px] text-muted-foreground">
                Questions for the current section are shown below. Use the
                sidebar to jump quickly.
              </div>
            </div>

            {/* Question list */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                {sectionQuestions.map((q, idx) => {
                  const qNum =
                    (q as any).questionNumber ??
                    (q as any).qno ??
                    (q as any).order_no ??
                    (sectionStart ?? 1) + idx;
                  const value = answers[(q as any).id]?.value ?? '';
                  const isFlagged = flagged.has((q as any).id);
                  const label =
                    (q as any).questionText ??
                    (q as any).prompt ??
                    (q as any).body ??
                    '';
                  const type =
                    (q as any).questionType ??
                    (q as any).type ??
                    'form_completion';
                  const isMCQ =
                    type === 'multiple_choice' ||
                    type === 'mcq' ||
                    type === 'single_choice';

                  return (
                    <div
                      key={(q as any).id}
                      id={`question-${qNum}`}
                      className="rounded-lg border border-border/70 bg-muted/40 px-3 py-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-full bg-primary/10 px-2 py-[2px] font-mono text-[11px] font-semibold text-primary">
                            {qNum}
                          </span>
                          {type && (
                            <span className="rounded-full bg-muted px-2 py-[1px] text-[10px] text-muted-foreground">
                              {String(type).replace('_', ' ')}
                            </span>
                          )}
                          {isFlagged && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-warning">
                              <Icon name="Flag" className="h-3.5 w-3.5" />
                              Flagged
                            </span>
                          )}
                        </div>
                        <Button
                          size="xs"
                          variant="ghost"
                          className="h-7 rounded-full px-2 text-[11px]"
                          onClick={() => toggleFlag((q as any).id)}
                          disabled={status !== 'active'}
                        >
                          <Icon
                            name={isFlagged ? 'FlagOff' : 'Flag'}
                            className="mr-1 h-3.5 w-3.5"
                          />
                          {isFlagged ? 'Unflag' : 'Flag'}
                        </Button>
                      </div>

                      {label && (
                        <p className="mb-2 text-small text-foreground">{label}</p>
                      )}

                      {isMCQ ? (
                        <div className="mt-2 space-y-1">
                          {Array.isArray((q as any).options) &&
                            (q as any).options.map((opt: any, i: number) => {
                              const optVal = String(opt);
                              return (
                                <label
                                  key={i}
                                  className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-2 py-1 text-small hover:bg-muted"
                                >
                                  <input
                                    type="radio"
                                    className="h-3.5 w-3.5"
                                    name={`q-${(q as any).id}`}
                                    value={optVal}
                                    disabled={status !== 'active'}
                                    checked={value === optVal}
                                    onChange={(e) =>
                                      handleAnswerChange(
                                        (q as any).id,
                                        e.target.value,
                                      )
                                    }
                                  />
                                  <span>{optVal}</span>
                                </label>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="mt-2 space-y-1">
                          <label className="text-[11px] text-muted-foreground">
                            Write your answer:
                          </label>
                          <input
                            type="text"
                            className="h-9 w-full rounded-md border border-border bg-background px-3 text-small text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                            value={value}
                            disabled={status !== 'active'}
                            onChange={(e) =>
                              handleAnswerChange(
                                (q as any).id,
                                e.target.value,
                              )
                            }
                            placeholder="Type your answer here"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* DRAG HANDLE */}
          <div
            className="hidden w-[4px] cursor-col-resize bg-border/70 md:block"
            onMouseDown={handleDragStart}
          />

          {/* RIGHT: AUDIO + PROGRESS */}
          <aside
            className="hidden h-full min-h-0 flex-col bg-muted/40 px-4 py-4 md:flex"
            style={{ flexBasis: `${100 - splitPercent}%` }}
          >
            <div className="flex h-full flex-col gap-3 overflow-hidden">
              {/* Audio Player - Using Test Audio URL */}
              <div className="rounded-lg border border-border bg-card/95 px-3 py-3 shadow-sm">
                <div className="mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon name="Headphones" className="h-4 w-4 text-muted-foreground" />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        IELTS Listening Audio
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-[1px] text-[10px] text-primary">
                      One File
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground/80">
                    One continuous audio file for all 4 sections. Plays once only.
                  </p>
                </div>

                <ListeningAudioPlayer
                  src={test.audioUrl}
                />

                <div className="mt-3 pt-3 border-t border-border/50">
                  <p className="text-[10px] text-muted-foreground">
                    <strong>Note:</strong> This is a continuous IELTS Listening test.
                    The audio will play from beginning to end without stopping between sections.
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="flex-1 rounded-lg border border-border bg-card px-3 py-3 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Notes
                  </p>
                  <Icon
                    name="PenSquare"
                    className="h-3.5 w-3.5 text-muted-foreground"
                  />
                </div>
                <textarea
                  className="h-full min-h-[100px] w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-small text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                  placeholder="Use this area for rough notes."
                />
              </div>

              {/* Debug Panel (Development Only) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="rounded-lg border border-destructive/30 bg-card/80 px-3 py-3 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-destructive">
                      Audio Debug
                    </p>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setShowDebug(!showDebug)}
                    >
                      {showDebug ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                  {showDebug && (
                    <div className="space-y-2">
                      <div className="text-[10px] space-y-1">
                        <p className="text-muted-foreground">
                          <strong>Audio URL:</strong> {test.audioUrl ? 'Present' : 'Missing'}
                        </p>
                        {test.audioUrl && (
                          <p className="text-muted-foreground truncate">
                            {test.audioUrl.substring(0, 50)}...
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          <strong>Sections:</strong> {sections.length} (using test audio)
                        </p>
                      </div>
                      <Button
                        size="xs"
                        variant="outline"
                        className="w-full text-[11px]"
                        onClick={testDirectAudio}
                      >
                        Test Audio Directly
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Sidebar progress */}
              <ListeningSidebarProgress
                sections={sectionsProgress}
                currentSectionId={currentSectionProgress?.id ?? null}
                currentSectionQuestions={currentSectionQuestionsProgress}
                onJumpToSection={(sectionId) => {
                  const idx = sectionsProgress.findIndex(
                    (s) => s.id === sectionId,
                  );
                  if (idx >= 0) setCurrentSectionIndex(idx);
                }}
                onJumpToQuestion={(questionId) => {
                  const idx = sortedQuestions.findIndex(
                    (q) => (q as any).id === questionId,
                  );
                  if (idx >= 0) goToQuestion(sortedQuestions[idx], idx);
                }}
              />
            </div>
          </aside>
        </div>
      </main>

      {/* BOTTOM BAR */}
      <footer className="border-t border-border bg-card/95 backdrop-blur">
        <div className="flex h-10 items-center justify-between px-6 text-[11px]">
          {/* LEFT: answered + review */}
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">
              Answered {answeredCount}/{totalQuestions} • Flagged {flaggedCount}
            </span>
            <Button
              size="xs"
              variant="ghost"
              className="rounded-full text-[11px]"
              onClick={() => {
                setReviewFlaggedOnly(false);
                setShowReviewPanel(true);
              }}
            >
              Review
            </Button>
            <Button
              size="xs"
              variant="ghost"
              className="rounded-full text-[11px]"
              onClick={() => {
                setReviewFlaggedOnly(true);
                setShowReviewPanel(true);
              }}
            >
              Flagged review
            </Button>
          </div>

          {/* RIGHT: exit + submit */}
          <div className="flex items-center gap-2 pr-1">
            <Button
              size="xs"
              variant="ghost"
              className="rounded-full text-[11px]"
              onClick={() => setShowExitConfirm(true)}
            >
              Exit test
            </Button>
            <Button
              size="xs"
              variant="primary"
              className="rounded-full text-[11px]"
              disabled={status !== 'active'}
              onClick={() => setShowSubmitConfirm(true)}
            >
              Submit test
            </Button>
          </div>
        </div>
      </footer>

      {/* PRE-START LAYER */}
      {status === 'starting' && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/90">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card px-5 py-6 text-center shadow-lg">
            <h2 className="text-body font-semibold">
              Get ready for your Listening mock
            </h2>
            <p className="mt-2 text-caption text-muted-foreground">
              When you start, the timer will begin and the audio will be
              available. <strong>One continuous audio file</strong> will play for all 4 sections.
              Avoid refreshing or closing the tab while the test is in progress.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <div className="rounded-md bg-primary/5 p-2">
                <p className="text-caption text-primary">
                  🔊 <strong>Audio Note:</strong> The audio plays continuously without stopping between sections.
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                className="mt-2 rounded-full text-caption"
                onClick={() => setStatus('active')}
              >
                I&apos;m ready — start the test
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW POPUP */}
      {showReviewPanel && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/90">
          <div className="flex w-full max-w-2xl flex-col rounded-lg border border-border bg-card px-5 py-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-body font-semibold">
                {reviewFlaggedOnly
                  ? 'Review flagged questions'
                  : 'Review questions'}
              </h2>
              <Button
                size="xs"
                variant="ghost"
                className="rounded-full text-[11px]"
                onClick={() => setShowReviewPanel(false)}
              >
                Close
              </Button>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {reviewItems.length === 0 ? (
                <p className="text-caption text-muted-foreground">
                  {reviewFlaggedOnly
                    ? 'No flagged questions yet.'
                    : 'No questions to review.'}
                </p>
              ) : (
                reviewItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      const idx = sortedQuestions.findIndex(
                        (q) => (q as any).id === item.id,
                      );
                      if (idx >= 0) {
                        goToQuestion(sortedQuestions[idx], idx);
                      }
                      setShowReviewPanel(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-border bg-white/70 px-4 py-3 text-small shadow-sm transition hover:bg-muted"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary">
                        {item.qNum}
                      </span>
                      <span className="font-medium text-foreground">
                        Question {item.qNum}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.isFlagged && (
                        <Icon
                          name="Flag"
                          className="h-4 w-4 text-warning"
                        />
                      )}
                      <span
                        className={`text-[11px] ${
                          item.isAnswered
                            ? 'text-success'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {item.isAnswered ? 'Answered' : 'Not answered'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* EXIT CONFIRM POPUP */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card px-5 py-5 text-center shadow-lg">
            <h2 className="text-body font-semibold">Leave Listening mock?</h2>
            <p className="mt-2 text-caption text-muted-foreground">
              If you exit now, your current attempt will be ended. You can start
              again later, but this timer will not resume.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-caption"
                onClick={() => setShowExitConfirm(false)}
              >
                Stay in test
              </Button>
              <Button
                size="sm"
                variant="ghost"
                tone="danger"
                className="rounded-full text-caption"
                onClick={async () => {
                  setShowExitConfirm(false);
                  setStatus('finished');
                  await router.push('/mock/listening');
                }}
              >
                Exit without submitting
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT CONFIRM POPUP */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90">
          <div className="w-full max-w-sm rounded-lg border border-border bg-card px-5 py-5 text-center shadow-lg">
            <h2 className="text-body font-semibold">Submit your answers?</h2>
            <p className="mt-2 text-caption text-muted-foreground">
              Once you submit, you won&apos;t be able to change your answers in
              this attempt.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="rounded-full text-caption"
                onClick={() => setShowSubmitConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="rounded-full text-caption"
                onClick={async () => {
                  setShowSubmitConfirm(false);
                  await submitAttempt(false);
                }}
              >
                Yes, submit now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IELTSListeningExam;