// pages/mock/listening/run.tsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useDebouncedCallback } from 'use-debounce';

import { supabaseBrowser as supabase } from '@/lib/supabaseBrowser';
import { getListeningPaperById } from '@/data/listening';
import {
  clearMockAttemptId,
  clearMockDraft,
  ensureMockAttemptId,
  fetchMockCheckpoint,
  loadMockDraft,
  saveMockCheckpoint,
  saveMockDraft,
} from '@/lib/mock/state';

// ------------------ Types ------------------

// Same as existing engine
type QBase = {
  id: string;
  prompt?: string;
  type: 'mcq' | 'gap' | 'map' | 'short';
  options?: string[];
  answer: string;
};

type Section = {
  id: string;
  title: string;
  audioUrl?: string;
  questions: QBase[];
};

type ListeningPaper = {
  id: string;
  title: string;
  durationSec: number;
  transcript?: string;
  sections: Section[];
};

type AnswerMap = Record<string, string>;
type ScoreSummary = {
  correct: number;
  total: number;
  percentage: number;
};

type DraftState = {
  answers: AnswerMap;
  startedAt: string;
  sectionIdx?: number;
  timeLeft?: number;
};

type Phase =
  | 'intro'
  | 'volume-check'
  | 'exam'
  | 'review'
  | 'submit-confirm';

// ------------------ Sample / loader ------------------

const samplePaper: ListeningPaper = {
  id: 'sample-001',
  title: 'Listening Sample 001',
  durationSec: 1800,
  transcript: 'This is a short transcript sample…',
  sections: [
    {
      id: 'S1',
      title: 'Section 1',
      audioUrl: '',
      questions: [
        {
          id: 'q1',
          type: 'mcq',
          prompt: 'Choose the correct option',
          options: ['A', 'B', 'C', 'D'],
          answer: 'B',
        },
        {
          id: 'q2',
          type: 'gap',
          prompt: 'Fill in the blank',
          answer: 'library',
        },
      ],
    },
    {
      id: 'S2',
      title: 'Section 2',
      audioUrl: '',
      questions: [
        {
          id: 'q3',
          type: 'mcq',
          prompt: 'Pick one',
          options: ['Yes', 'No', 'Maybe'],
          answer: 'Yes',
        },
        {
          id: 'q4',
          type: 'short',
          prompt: 'Write a short answer',
          answer: '2019',
        },
      ],
    },
  ],
};

const loadPaper = async (id: string): Promise<ListeningPaper> => {
  const paper = getListeningPaperById(id);
  return paper ?? samplePaper;
};

// ------------------ Layout Shell ------------------

const Shell: React.FC<{
  title: string;
  subtitle?: string;
  phaseLabel?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, phaseLabel, right, children }) => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-h3 font-semibold">{title}</h1>
          {subtitle ? (
            <p className="text-small text-foreground/70">{subtitle}</p>
          ) : null}
          {phaseLabel ? (
            <p className="mt-1 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {phaseLabel}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {right}
        </div>
      </header>

      <div className="rounded-2xl border border-border bg-background/60 p-4 shadow-sm sm:p-6">
        {children}
      </div>
    </div>
  </div>
);

// ------------------ Page Component ------------------

const REVIEW_SECONDS = 120;

export default function ListeningCBERunPage() {
  const router = useRouter();
  const { id } = router.query as { id?: string };

  const [paper, setPaper] = useState<ListeningPaper | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [secIdx, setSecIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(1800);
  const [phase, setPhase] = useState<Phase>('intro');
  const [reviewTimeLeft, setReviewTimeLeft] = useState<number>(REVIEW_SECONDS);
  const [timerRunning, setTimerRunning] = useState(false);

  const startRef = useRef<string>('');
  const attemptRef = useRef<string>('');
  const [attemptReady, setAttemptReady] = useState(false);
  const [checkpointHydrated, setCheckpointHydrated] = useState(false);

  const latestRef = useRef<{
    answers: AnswerMap;
    secIdx: number;
    timeLeft: number;
  }>({ answers: {}, secIdx: 0, timeLeft: 0 });

  // ------------------ Attempt ID init ------------------

  useEffect(() => {
    if (!id) return;
    const attempt = ensureMockAttemptId('listening', id);
    attemptRef.current = attempt;
    setAttemptReady(true);
  }, [id]);

  // ------------------ Initial load + local draft ------------------

  useEffect(() => {
    if (!id) return;

    (async () => {
      const p = await loadPaper(id);
      setPaper(p);

      const draft = loadMockDraft<DraftState>('listening', id);
      if (draft?.data?.answers) {
        setAnswers(draft.data.answers);
        if (typeof draft.data.sectionIdx === 'number') {
          setSecIdx(draft.data.sectionIdx);
        }
        if (typeof draft.data.timeLeft === 'number') {
          setTimeLeft(
            Math.max(0, Math.min(p.durationSec, Math.round(draft.data.timeLeft))),
          );
        } else {
          setTimeLeft(p.durationSec);
        }
      } else {
        setTimeLeft(p.durationSec);
      }

      startRef.current = draft?.data?.startedAt ?? new Date().toISOString();

      if (!draft) {
        saveMockDraft('listening', id, {
          answers: {},
          startedAt: startRef.current,
          sectionIdx: 0,
          timeLeft: p.durationSec,
        });
      }
    })();
  }, [id]);

  // ------------------ Server checkpoint hydrate ------------------

  useEffect(() => {
    if (!paper || !attemptReady) return;
    let cancelled = false;

    (async () => {
      const checkpoint = await fetchMockCheckpoint({
        attemptId: attemptRef.current,
        section: 'listening',
      });
      if (cancelled) return;

      if (checkpoint && checkpoint.mockId === paper.id) {
        const payload = (checkpoint.payload || {}) as {
          answers?: AnswerMap;
          sectionIdx?: number;
          startedAt?: string;
          timeLeft?: number;
        };
        if (payload.answers) setAnswers(payload.answers);
        if (typeof payload.sectionIdx === 'number') {
          setSecIdx(payload.sectionIdx);
        }
        if (typeof payload.startedAt === 'string') {
          startRef.current = payload.startedAt;
        }
        if (typeof payload.timeLeft === 'number') {
          setTimeLeft(
            Math.max(0, Math.min(paper.durationSec, Math.round(payload.timeLeft))),
          );
        } else {
          const duration =
            typeof checkpoint.duration === 'number'
              ? checkpoint.duration
              : paper.durationSec;
          const remaining = Math.max(0, duration - checkpoint.elapsed);
          setTimeLeft(Math.max(0, Math.min(paper.durationSec, remaining)));
        }
      }

      setCheckpointHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [paper, attemptReady]);

  // ------------------ Global exam timer ------------------

  useEffect(() => {
    if (!id || !paper || !timerRunning) return;

    const t = setInterval(() => {
      setTimeLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => clearInterval(t);
  }, [id, paper, timerRunning]);

  // ------------------ Local draft autosave ------------------

  const debouncedLocalDraft = useDebouncedCallback(
    (payload: DraftState) => {
      if (!id) return;
      saveMockDraft('listening', id, payload);
    },
    500,
    { maxWait: 3000 },
  );

  useEffect(() => {
    if (!id) return;
    debouncedLocalDraft({
      answers,
      startedAt: startRef.current,
      sectionIdx: secIdx,
      timeLeft,
    });

    return () => {
      debouncedLocalDraft.flush();
    };
  }, [id, answers, secIdx, timeLeft, debouncedLocalDraft]);

  // ------------------ Latest ref for checkpoint ------------------

  useEffect(() => {
    latestRef.current = { answers, secIdx, timeLeft };
  }, [answers, secIdx, timeLeft]);

  // ------------------ Persist checkpoints ------------------

  const persistCheckpoint = useCallback(
    (opts?: { completed?: boolean }) => {
      if (
        !paper ||
        !attemptReady ||
        !checkpointHydrated ||
        !attemptRef.current
      )
        return;

      const state = latestRef.current;
      const elapsed = Math.max(
        0,
        Math.min(paper.durationSec, paper.durationSec - state.timeLeft),
      );

      void saveMockCheckpoint({
        attemptId: attemptRef.current,
        section: 'listening',
        mockId: paper.id,
        payload: {
          paperId: paper.id,
          answers: state.answers,
          sectionIdx: state.secIdx,
          startedAt: startRef.current,
          timeLeft: state.timeLeft,
        },
        elapsed,
        duration: paper.durationSec,
        completed: opts?.completed,
      });
    },
    [paper, attemptReady, checkpointHydrated],
  );

  useEffect(() => {
    if (!paper || !attemptReady || !checkpointHydrated) return;

    const handler = () => {
      debouncedLocalDraft.flush();
      persistCheckpoint();
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [paper, attemptReady, checkpointHydrated, persistCheckpoint, debouncedLocalDraft]);

  // Initial small delay checkpoint
  useEffect(() => {
    if (!paper || !attemptReady || !checkpointHydrated) return;
    const timeout = setTimeout(() => persistCheckpoint(), 1000);
    return () => clearTimeout(timeout);
  }, [answers, secIdx, paper, attemptReady, checkpointHydrated, persistCheckpoint]);

  // Periodic checkpoint
  useEffect(() => {
    if (!paper || !attemptReady || !checkpointHydrated) return;
    const interval = setInterval(() => persistCheckpoint(), 15000);
    return () => clearInterval(interval);
  }, [paper, attemptReady, checkpointHydrated, persistCheckpoint]);

  // ------------------ Derived values ------------------

  const current = paper?.sections[secIdx];
  const percent = useMemo(() => {
    if (!paper) return 0;
    const total = paper.sections.reduce(
      (acc, s) => acc + s.questions.length,
      0,
    );
    const answered = Object.keys(answers).length;
    return total === 0 ? 0 : Math.round((answered / total) * 100);
  }, [paper, answers]);

  const hhmmss = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, '0');
    return (h > 0 ? `${h}:` : '') + `${m}:${s}`;
  };

  const formatReview = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, '0');
    return `${m}:${s}`;
  };

  // ------------------ Review timer ------------------

  useEffect(() => {
    if (phase !== 'review') return;
    if (reviewTimeLeft <= 0) {
      setPhase('submit-confirm');
      return;
    }

    const t = setInterval(() => {
      setReviewTimeLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => clearInterval(t);
  }, [phase, reviewTimeLeft]);

  // ------------------ Handlers: flow control ------------------

  const handleStartIntro = () => {
    setPhase('volume-check');
  };

  const handleVolumeDone = () => {
    // Start exam: start timer, go to exam phase
    setPhase('exam');
    setTimerRunning(true);
  };

  const handleGoToReview = () => {
    setTimerRunning(false);
    setReviewTimeLeft(REVIEW_SECONDS);
    setPhase('review');
  };

  const handleBackToExam = () => {
    // Allow going back during review if needed
    setPhase('exam');
    setTimerRunning(true);
  };

  const handleConfirmSubmit = async () => {
    await submit();
  };

  // ------------------ Submit logic (same engine, tweaked) ------------------

  const submit = async () => {
    if (!id || !paper) return;
    const score = computeScore(paper, answers);
    let attemptId = '';

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user?.id) throw new Error('Not authenticated');

      const payload = {
        user_id: user.user.id,
        paper_id: paper.id,
        answers,
        score: score.correct,
        total: score.total,
        percentage: score.percentage,
        started_at: startRef.current || new Date().toISOString(),
        submitted_at: new Date().toISOString(),
        duration_sec: paper.durationSec - timeLeft,
      };

      const { data, error } = await supabase
        .from('attempts_listening')
        .insert(payload)
        .select('id')
        .single();

      if (error) throw error;
      attemptId = data.id as unknown as string;
    } catch {
      attemptId = `local-${Date.now()}`;
      try {
        localStorage.setItem(
          `listen:attempt-res:${attemptId}`,
          JSON.stringify({ paper, answers }),
        );
      } catch {
        // ignore
      }
    } finally {
      if (attemptRef.current) {
        void saveMockCheckpoint({
          attemptId: attemptRef.current,
          section: 'listening',
          mockId: paper.id,
          payload: {
            paperId: paper.id,
            answers,
            sectionIdx: secIdx,
            startedAt: startRef.current,
            timeLeft,
          },
          elapsed: paper.durationSec - timeLeft,
          duration: paper.durationSec,
          completed: true,
        });
        clearMockAttemptId('listening', paper.id);
      }
      clearMockDraft('listening', id);
      router.replace(
        `/review/listening/${id}?attempt=${encodeURIComponent(attemptId)}`,
      );
    }
  };

  // ------------------ Phase labels ------------------

  const phaseLabel: string | undefined = (() => {
    switch (phase) {
      case 'intro':
        return 'Step 1 · Overview';
      case 'volume-check':
        return 'Step 2 · Volume check';
      case 'exam':
        return 'Step 3 · Listening exam';
      case 'review':
        return 'Step 4 · Review answers';
      case 'submit-confirm':
        return 'Step 5 · Submit';
      default:
        return undefined;
    }
  })();

  // ------------------ Render ------------------

  if (!paper) {
    return (
      <>
        <Head>
          <title>Listening Mock • Loading…</title>
        </Head>
        <Shell title="Loading Listening mock…">
          <div>Loading paper…</div>
        </Shell>
      </>
    );
  }

  const allQuestions = paper.sections.flatMap((s) => s.questions);

  const rightHeader = (
    <>
      <div className="text-small text-foreground/80">
        Answered {percent}%
      </div>
      {phase === 'exam' && (
        <div className="rounded-full border border-border px-3 py-1 text-small">
          ⏱ {hhmmss(timeLeft)}
        </div>
      )}
      {phase === 'review' && (
        <div className="rounded-full border border-border px-3 py-1 text-small">
          Review: {formatReview(reviewTimeLeft)}
        </div>
      )}
      <Link
        href="/mock"
        className="text-small underline underline-offset-4"
      >
        Exit mock hub
      </Link>
    </>
  );

  return (
    <>
      <Head>
        <title>Listening Mock • CBE Mode</title>
      </Head>
      <Shell
        title={`Listening — ${paper.title}`}
        subtitle="Full IELTS-style Listening mock in computer-based exam mode."
        phaseLabel={phaseLabel}
        right={rightHeader}
      >
        {/* PHASE: INTRO */}
        {phase === 'intro' && (
          <div className="space-y-4 text-small">
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <h2 className="mb-2 text-base font-semibold">
                Before you start
              </h2>
              <p className="mb-2 text-foreground/80">
                You&apos;ll take a full Listening mock in IELTS-style CBE
                format. There are multiple sections and you&apos;ll hear the
                audio only once.
              </p>
              <ul className="list-inside list-disc text-foreground/70">
                <li>Use headphones in a quiet place.</li>
                <li>Don&apos;t refresh or close the tab once you start.</li>
                <li>
                  You&apos;ll get a short window at the end to review your
                  answers.
                </li>
              </ul>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-foreground/60">
                When you continue, you&apos;ll first check your volume.
              </p>
              <button
                type="button"
                onClick={handleStartIntro}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-background hover:opacity-90"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* PHASE: VOLUME CHECK */}
        {phase === 'volume-check' && (
          <div className="space-y-4 text-small">
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <h2 className="mb-2 text-base font-semibold">
                Check your volume
              </h2>
              <p className="mb-2 text-foreground/80">
                Play the sample audio and adjust your device volume until
                everything is clear and comfortable.
              </p>
              <p className="text-xs text-foreground/60">
                Tip: Use your system volume, not just app volume. You won&apos;t
                be able to replay the real test audio.
              </p>
            </div>

            {/* You can wire a real sample here later */}
            <div className="rounded-2xl border border-dashed border-border bg-background/80 p-4 text-xs text-foreground/70">
              <p className="mb-2">
                (Optional) Hook a short sample audio file here for volume
                testing. For now this is just a placeholder block.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                className="text-xs text-foreground/60 underline underline-offset-4"
                onClick={() => setPhase('intro')}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleVolumeDone}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-background hover:opacity-90"
              >
                Start Listening test
              </button>
            </div>
          </div>
        )}

        {/* PHASE: EXAM */}
        {phase === 'exam' && current && (
          <div className="space-y-6">
            {/* Section controls */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-small font-medium">
                Section {secIdx + 1} of {paper.sections.length} —{' '}
                {current.title}
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={secIdx === 0}
                  onClick={() =>
                    setSecIdx((i) => Math.max(0, i - 1))
                  }
                  type="button"
                  className="rounded-lg border border-border px-3 py-1 text-small hover:border-primary disabled:opacity-50"
                >
                  Prev section
                </button>
                <button
                  disabled={secIdx === paper.sections.length - 1}
                  onClick={() =>
                    setSecIdx((i) =>
                      Math.min(paper.sections.length - 1, i + 1),
                    )
                  }
                  type="button"
                  className="rounded-lg border border-border px-3 py-1 text-small hover:border-primary disabled:opacity-50"
                >
                  Next section
                </button>
              </div>
            </div>

            {/* Layout: audio + questions */}
            <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              {/* Audio / instructions */}
              <div className="space-y-3">
                <div className="rounded-xl border border-border bg-background/80 p-3">
                  {current.audioUrl ? (
                    <audio
                      src={current.audioUrl}
                      controls
                      className="w-full"
                    />
                  ) : (
                    <div className="text-small text-foreground/70">
                      No audio URL provided in this sample. (UI is wired
                      for section-based audio if present.)
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-dashed border-border bg-muted/50 p-3 text-xs text-foreground/70">
                  <p>
                    In the real IELTS test, audio plays once only. Use the
                    time wisely and keep moving with the questions while you
                    listen.
                  </p>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-3">
                {current.questions.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-xl border border-border bg-background/80 p-3"
                  >
                    <div className="mb-2 text-small font-medium">
                      {q.prompt || `Question ${q.id}`}
                    </div>

                    {q.type === 'mcq' && (
                      <div className="flex flex-wrap gap-2">
                        {q.options?.map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() =>
                              setAnswers((a) => ({
                                ...a,
                                [q.id]: opt,
                              }))
                            }
                            className={`rounded-lg border px-3 py-1 text-small hover:border-primary ${
                              answers[q.id] === opt
                                ? 'border-primary bg-primary/5'
                                : 'border-border'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.type !== 'mcq' && (
                      <input
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        placeholder="Type your answer"
                        value={answers[q.id] || ''}
                        onChange={(e) =>
                          setAnswers((a) => ({
                            ...a,
                            [q.id]: e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-foreground/60">
                Time remaining: {hhmmss(timeLeft)}. Your answers auto-save
                in the background.
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGoToReview}
                  className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:border-primary"
                >
                  Go to review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PHASE: REVIEW */}
        {phase === 'review' && (
          <div className="space-y-4 text-small">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">
                  Review your answers
                </h2>
                <p className="text-xs text-foreground/70">
                  Make any final edits now. When the timer hits zero, you
                  will move to the submit screen.
                </p>
              </div>
              <div className="rounded-full border border-border px-3 py-1 text-xs">
                Review time left: {formatReview(reviewTimeLeft)}
              </div>
            </div>

            <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
              {allQuestions.map((q, index) => (
                <div
                  key={q.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-background/80 px-2 py-1.5"
                >
                  <span className="w-16 text-[11px] font-semibold text-foreground/70">
                    Q{index + 1}
                  </span>
                  <input
                    className="h-7 flex-1 rounded-md border border-border bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                    value={answers[q.id] || ''}
                    onChange={(e) =>
                      setAnswers((a) => ({
                        ...a,
                        [q.id]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBackToExam}
                className="text-xs text-foreground/60 underline underline-offset-4"
              >
                Back to exam
              </button>
              <button
                type="button"
                onClick={() => setPhase('submit-confirm')}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-background hover:opacity-90"
              >
                Skip timer &amp; go to submit
              </button>
            </div>
          </div>
        )}

        {/* PHASE: SUBMIT CONFIRM */}
        {phase === 'submit-confirm' && (
          <div className="space-y-4 text-small">
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <h2 className="mb-2 text-base font-semibold">
                Submit Listening test?
              </h2>
              <p className="mb-2 text-xs text-foreground/70">
                After submitting, you won&apos;t be able to change your
                answers. Your attempt will be saved in GramorX and used to
                calculate your score and future insights.
              </p>
              <ul className="list-inside list-disc text-xs text-foreground/70">
                <li>All sections have been completed.</li>
                <li>You&apos;ve had a chance to review your answers.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPhase('review')}
                className="rounded-lg border border-border px-3 py-2 text-xs hover:border-primary"
              >
                Go back to review
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-background hover:opacity-90"
              >
                Submit test
              </button>
            </div>
          </div>
        )}
      </Shell>
    </>
  );
}

// ------------------ Scoring helpers (same as engine) ------------------
// Same logic as your existing listening engine :contentReference[oaicite:0]{index=0}

function computeScore(
  paper: ListeningPaper,
  answers: AnswerMap,
): ScoreSummary {
  const all = paper.sections.flatMap((s) => s.questions);
  let correct = 0;

  for (const q of all) {
    const given = normalize(answers[q.id] ?? '');
    const key = normalize(q.answer);
    if (given && given === key) {
      correct++;
    }
  }

  const total = all.length;
  const percentage =
    total === 0 ? 0 : Math.round((correct / total) * 100);

  return { correct, total, percentage };
}

function normalize(s: string): string {
  return s.trim().toLowerCase();
}
