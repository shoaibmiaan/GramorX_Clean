import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Flag } from 'lucide-react';
import { readingPracticePapers } from '@/data/reading';
import {
  clearMockAttemptId,
  clearMockDraft,
  ensureMockAttemptId,
  fetchMockCheckpoint,
  loadMockDraft,
  saveMockCheckpoint,
  saveMockDraft,
} from '@/lib/mock/state';
import { useDebouncedCallback } from 'use-debounce';
import { ReadingPassage } from '@/components/exam/ReadingPassage';
import { QuestionNav, type QuestionNavFilter, type QuestionNavQuestion } from '@/components/exam/QuestionNav';
import { track } from '@/lib/analytics/track';
import { Checkbox } from '@/components/design-system/Checkbox';
import { Button } from '@/components/design-system/Button';
import { useToast } from '@/components/design-system/Toaster';
import { OfflineOnlyBanner } from '@/components/reading/OfflineOnlyBanner';
import { normalizeForPersist } from '@/lib/reading/normalize';
import { getAnswerText, isFlagged, type ReadingAnswer } from '@/lib/reading/answers';
import { mapServerNote as parseServerNote, type NoteRange } from '@/lib/reading/notes';
import { diffAnswers } from '@/lib/reading/diff';

type QType = 'tfng' | 'yynn' | 'heading' | 'match' | 'mcq' | 'gap';
type MatchOptionObject = {
  pairs?: Array<{ left: string; right: string | string[] }>;
  choices?: string[];
};
type Q = {
  id: string;
  type: QType;
  prompt?: string;
  options?: string[] | MatchOptionObject;
  answer: string;
};
type Passage = { id: string; title: string; text: string; questions: Q[] };
type ReadingPaper = { id: string; title: string; durationSec: number; passages: Passage[] };

type LayoutMode = 'split' | 'scroll';

type AnswerMap = Record<string, ReadingAnswer>;
type ReadingNote = {
  id: string;
  passageId: string;
  start: number;
  end: number;
  ranges: NoteRange[];
  color: string;
  noteText?: string | null;
};
type SelectionInput = { start: number; end: number; text: string; noteText?: string };
type DraftState = {
  answers: AnswerMap;
  passageIdx: number;
  timeLeft?: number;
  notes?: ReadingNote[];
  questionFilter?: QuestionNavFilter;
  layoutMode?: LayoutMode;
  started?: boolean;
  focusMode?: boolean;
};

const LAYOUT_PREF_KEY = 'mock:reading:layout-mode';
const FOCUS_MODE_PREF_KEY = 'mock:reading:focus-mode';
const LAYOUT_OPTIONS: Array<{
  id: LayoutMode;
  label: string;
  description: string;
  shortLabel: string;
}> = [
  {
    id: 'split',
    label: 'Split view',
    description: 'Desktop: passage left, questions right. Mobile stays single column.',
    shortLabel: 'Split',
  },
  {
    id: 'scroll',
    label: 'Scroll view',
    description: 'Single column with passage above questions on all devices.',
    shortLabel: 'Scroll',
  },
];

const ACTIVE_CHECKPOINT_INTERVAL = 10_000;
const IDLE_CHECKPOINT_INTERVAL = 60_000;
const IDLE_THRESHOLD_MS = 30_000;
const READING_SECTION_INDEX = 1;

// Default color for new reading notes. This is used both within the component and in
// helper functions at the bottom of this file. Placing it at the module scope
// ensures it is accessible to all helper functions and avoids reference errors.
export const DEFAULT_NOTE_COLOR: string = 'warning';

// Merge two arrays of notes by ID. If a note with the same ID appears in both
// arrays, the latter array’s version takes precedence. The merged list is
// returned in ascending order of the notes’ start positions.
function mergeNotes(prev: ReadingNote[], next: ReadingNote[]): ReadingNote[] {
  const map = new Map<string, ReadingNote>();
  prev.forEach((note) => {
    map.set(note.id, note);
  });
  next.forEach((note) => {
    map.set(note.id, note);
  });
  return Array.from(map.values()).sort((a, b) => a.start - b.start);
}

// Check if two highlight ranges overlap. A and B overlap if the start of one
// interval is before the end of the other and vice versa.
function rangesOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && startB < endA;
}

// Extract a short excerpt of text for a given note. The excerpt is trimmed of
// extra whitespace and capped at 120 characters. If the range is empty or
// invalid, an empty string is returned.
function excerptForNote(note: ReadingNote, text: string): string {
  const start = typeof note.start === 'number' ? note.start : 0;
  const end = typeof note.end === 'number' ? note.end : start;
  if (end <= start) return '';
  const raw = text.slice(start, end).replace(/\s+/g, ' ').trim();
  return raw.length > 120 ? `${raw.slice(0, 117)}…` : raw;
}

const sampleReading: ReadingPaper = {
  id: 'sample-001',
  title: 'Reading Sample 001',
  durationSec: 3600,
  passages: [
    {
      id: 'P1',
      title: 'The Honeybee',
      text: 'Bees are fascinating…',
      questions: [
        { id: 'q1', type: 'tfng', prompt: 'Bees can see UV light.', answer: 'True' },
        { id: 'q2', type: 'yynn', prompt: 'Honey is spicy.', answer: 'No' },
        {
          id: 'q3',
          type: 'heading',
          prompt: 'Choose paragraph heading',
          options: ['Origins', 'Vision', 'Diet'],
          answer: 'Vision',
        },
      ],
    },
    {
      id: 'P2',
      title: 'Ancient Roads',
      text: 'Roads enabled trade…',
      questions: [
        { id: 'q4', type: 'match', prompt: 'Match A with B', options: ['Roman', 'Silk', 'Inca'], answer: 'Roman' },
        { id: 'q5', type: 'mcq', prompt: 'Pick one', options: ['A', 'B', 'C'], answer: 'C' },
      ],
    },
  ],
};

const readingPaperLookup = new Map<string, ReadingPaper>(
  readingPracticePapers.map(
    (paper) => [paper.id, JSON.parse(JSON.stringify(paper)) as ReadingPaper],
  ),
);

const loadPaper = async (slug: string): Promise<ReadingPaper> => {
  const staticPaper = readingPaperLookup.get(slug);
  if (staticPaper) {
    return JSON.parse(JSON.stringify(staticPaper)) as ReadingPaper;
  }

  try {
    const mod = await import(`@/data/reading/${slug}.json`);
    return mod.default as ReadingPaper;
  } catch {
    return sampleReading;
  }
};

const Shell: React.FC<{ title: string; right?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  right,
  children,
}) => (
  <div className="min-h-[100dvh] bg-background text-foreground pb-safe">
    <div className="mx-auto w-full max-w-screen-2xl px-3 pb-12 pt-safe sm:px-6 lg:px-8 xl:px-10">
      <header className="mb-8 rounded-3xl border border-border/80 bg-background/70 px-5 py-5 shadow-lg shadow-black/5 backdrop-blur supports-[backdrop-filter]:backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-h3 font-semibold tracking-tight">{title}</h1>
          <div className="flex flex-wrap items-center gap-3">{right}</div>
        </div>
      </header>
      <div className="grid gap-8 md:grid-cols-[minmax(0,1.55fr)_minmax(0,0.85fr)] xl:grid-cols-[minmax(0,1.75fr)_minmax(0,0.9fr)]">
        {children}
      </div>
    </div>
  </div>
);

export default function ReadingMockPage() {
  const router = useRouter();
  const toast = useToast();
  const { slug } = router.query as { slug?: string };
  const [paper, setPaper] = useState<ReadingPaper | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [passageIdx, setPassageIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [notes, setNotes] = useState<ReadingNote[]>([]);
  const [questionFilter, setQuestionFilter] = useState<QuestionNavFilter>('all');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('split');
  const [isStarted, setIsStarted] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [layoutHydrated, setLayoutHydrated] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const attemptRef = useRef<string>('');
  const [attemptReady, setAttemptReady] = useState(false);
  const [checkpointHydrated, setCheckpointHydrated] = useState(false);
  const [localOnly, setLocalOnly] = useState(false);
  const latestRef = useRef<{
    answers: AnswerMap;
    passageIdx: number;
    timeLeft: number;
    notes: ReadingNote[];
    questionFilter: QuestionNavFilter;
    layoutMode: LayoutMode;
    started: boolean;
    focusMode: boolean;
  }>({
    answers: {},
    passageIdx: 0,
    timeLeft: 0,
    notes: [],
    questionFilter: 'all',
    layoutMode: 'split',
    started: false,
    focusMode: false,
  });
  const currentAnswersRef = useRef<AnswerMap>({});
  const serverSyncedAnswersRef = useRef<Record<string, unknown>>({});
  const lastCheckpointMetaRef = useRef<string>('');
  const checkpointTimeoutRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteEditorValue, setNoteEditorValue] = useState('');
  const noteRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [notesLoaded, setNotesLoaded] = useState(true);

  const questionLookup = useMemo(() => {
    if (!paper) return new Map<string, { passage: Passage; passageIndex: number }>();
    const map = new Map<string, { passage: Passage; passageIndex: number }>();
    paper.passages.forEach((passage, idx) => {
      passage.questions.forEach((question) => {
        map.set(question.id, { passage, passageIndex: idx });
      });
    });
    return map;
  }, [paper]);

  // attempt id from local mock state (bridge to server)
  useEffect(() => {
    if (!slug) return;
    const attempt = ensureMockAttemptId('reading', slug);
    attemptRef.current = attempt;
    setAttemptReady(true);
  }, [slug]);

  // Load paper + local draft
  useEffect(() => {
    if (!slug) return;
    (async () => {
      const p = await loadPaper(slug);
      setPaper(p);

      const draft = loadMockDraft<DraftState>('reading', slug);
      const storedLayout = getStoredLayoutMode();
      const storedFocus = getStoredFocusMode();

      if (draft?.data) {
        const normalizedAnswers = draft.data.answers ? normalizeAnswerMap(draft.data.answers) : undefined;
        if (normalizedAnswers) setAnswers(normalizedAnswers);

        if (typeof draft.data.passageIdx === 'number') setPassageIdx(draft.data.passageIdx);

        if (typeof draft.data.timeLeft === 'number') {
          setTimeLeft(Math.max(0, Math.min(p.durationSec, Math.round(draft.data.timeLeft))));
        } else {
          setTimeLeft(p.durationSec);
        }

        const noteList = Array.isArray(draft.data.notes)
          ? draft.data.notes
              .map((note) => mapReadingNote(note))
              .filter((note): note is ReadingNote => Boolean(note))
          : undefined;
        if (noteList && noteList.length > 0) setNotes(noteList);

        if (draft.data.questionFilter) {
          setQuestionFilter(normalizeQuestionFilter(draft.data.questionFilter));
        }

        setLayoutMode(normalizeLayoutMode(draft.data.layoutMode ?? storedLayout));

        if (typeof draft.data.focusMode === 'boolean') {
          setFocusMode(draft.data.focusMode);
        } else {
          setFocusMode(storedFocus);
        }

        const hasAnsweredFromDraft = normalizedAnswers ? hasAnyAnswered(normalizedAnswers) : false;
        const hasNotes = Boolean(noteList && noteList.length > 0);
        const startedFromDraft =
          draft.data.started === true ||
          (typeof draft.data.timeLeft === 'number' && draft.data.timeLeft < p.durationSec) ||
          hasAnsweredFromDraft ||
          hasNotes;

        setIsStarted(startedFromDraft);
      } else {
        setTimeLeft(p.durationSec);
        saveMockDraft('reading', slug, {
          answers: normalizeForPersist({}),
          passageIdx: 0,
          timeLeft: p.durationSec,
          notes: [],
          questionFilter: 'all',
          layoutMode: storedLayout,
          started: false,
          focusMode: storedFocus,
        });
        setLayoutMode(storedLayout);
        setFocusMode(storedFocus);
        setIsStarted(false);
      }

      setLayoutHydrated(true);
    })();
  }, [slug]);

  // Load checkpoint from server
  useEffect(() => {
    if (!paper || !attemptReady) return;
    let cancelled = false;

    (async () => {
      const checkpoint = await fetchMockCheckpoint({ attemptId: attemptRef.current, section: 'reading' });
      if (cancelled) return;
      if (checkpoint && checkpoint.mockId === paper.id) {
        const payload = (checkpoint.payload || {}) as {
          answers?: Record<string, unknown>;
          passageIdx?: number;
          timeLeft?: number;
          notes?: Array<Record<string, unknown>>;
          questionFilter?: unknown;
          layoutMode?: unknown;
          started?: unknown;
          focusMode?: unknown;
        };

        const normalizedAnswers = payload.answers ? normalizeAnswerMap(payload.answers) : undefined;
        if (normalizedAnswers) {
          setAnswers(normalizedAnswers);
          serverSyncedAnswersRef.current = normalizeForPersist(normalizedAnswers);
        }
        const nextPassageIdx =
          typeof payload.passageIdx === 'number' ? payload.passageIdx : latestRef.current.passageIdx;
        if (typeof payload.passageIdx === 'number') setPassageIdx(payload.passageIdx);

        const nextTimeLeft = (() => {
          if (typeof payload.timeLeft === 'number') {
            return Math.max(0, Math.min(paper.durationSec, Math.round(payload.timeLeft)));
          }
          const duration = typeof checkpoint.duration === 'number' ? checkpoint.duration : paper.durationSec;
          const remaining = Math.max(0, duration - checkpoint.elapsed);
          return Math.max(0, Math.min(paper.durationSec, remaining));
        })();
        setTimeLeft(nextTimeLeft);

        const normalizedNotes = Array.isArray(payload.notes)
          ? payload.notes
              .map((note) => mapReadingNote(note))
              .filter((note): note is ReadingNote => Boolean(note))
          : undefined;
        if (normalizedNotes && normalizedNotes.length > 0) setNotes(normalizedNotes);

        const nextNotes = normalizedNotes && normalizedNotes.length > 0 ? normalizedNotes : latestRef.current.notes;

        const nextQuestionFilter = payload.questionFilter
          ? normalizeQuestionFilter(payload.questionFilter)
          : latestRef.current.questionFilter;
        if (payload.questionFilter) {
          setQuestionFilter(nextQuestionFilter);
        }

        const nextLayoutMode = payload.layoutMode
          ? normalizeLayoutMode(payload.layoutMode)
          : latestRef.current.layoutMode;
        if (payload.layoutMode) {
          setLayoutMode(nextLayoutMode);
        }

        const nextFocusMode =
          typeof payload.focusMode === 'boolean' ? payload.focusMode : latestRef.current.focusMode;
        if (typeof payload.focusMode === 'boolean') {
          setFocusMode(payload.focusMode);
        }

        const hasAnswered = normalizedAnswers ? hasAnyAnswered(normalizedAnswers) : false;
        const hasNotes = Boolean(normalizedNotes && normalizedNotes.length > 0);
        const startedFromPayload =
          payload.started === true ||
          (typeof payload.timeLeft === 'number' && payload.timeLeft < paper.durationSec) ||
          hasAnswered ||
          hasNotes;

        if (startedFromPayload) {
          setIsStarted(true);
        }

        const nextStarted = startedFromPayload ? true : latestRef.current.started;

        lastCheckpointMetaRef.current = JSON.stringify({
          passageIdx: nextPassageIdx,
          timeLeft: nextTimeLeft,
          notes: nextNotes,
          questionFilter: nextQuestionFilter,
          layoutMode: nextLayoutMode,
          started: nextStarted,
          focusMode: nextFocusMode,
        });
      }
      setCheckpointHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [paper, attemptReady]);

  // Timer
  useEffect(() => {
    if (!paper || !isStarted) return;
    const t = setInterval(() => setTimeLeft((x) => (x > 0 ? x - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [paper, isStarted]);

  const debouncedLocalDraft = useDebouncedCallback(
    (payload: DraftState) => {
      if (!slug) return;
      const { answers: payloadAnswers, ...rest } = payload;
      const normalized = normalizeForPersist(payloadAnswers);
      saveMockDraft('reading', slug, { ...rest, answers: normalized });
    },
    1000,
    { maxWait: 3000 },
  );

  useEffect(() => {
    latestRef.current = {
      answers,
      passageIdx,
      timeLeft,
      notes,
      questionFilter,
      layoutMode,
      started: isStarted,
      focusMode,
    };
  }, [answers, passageIdx, timeLeft, notes, questionFilter, layoutMode, isStarted, focusMode]);

  useEffect(() => {
    currentAnswersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    if (!layoutHydrated) return;
    setStoredLayoutMode(layoutMode);
  }, [layoutHydrated, layoutMode]);

  useEffect(() => {
    if (!layoutHydrated) return;
    setStoredFocusMode(focusMode);
  }, [focusMode, layoutHydrated]);

  // Focus-mode body data-attr
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const body = document.body;
    const previousRoot = root.dataset.focusMode;
    const previousBody = body?.dataset.focusMode;

    const apply = (value: boolean) => {
      const next = value ? 'true' : 'false';
      root.dataset.focusMode = next;
      if (body) {
        body.dataset.focusMode = next;
      }
    };

    apply(focusMode);

    return () => {
      if (previousRoot === undefined) {
        delete root.dataset.focusMode;
      } else {
        root.dataset.focusMode = previousRoot;
      }
      if (body) {
        if (previousBody === undefined) {
          delete body.dataset.focusMode;
        } else {
          body.dataset.focusMode = previousBody;
        }
      }
    };
  }, [focusMode]);

  // Local draft save
  useEffect(() => {
    if (!slug) return;
    debouncedLocalDraft({
      answers,
      passageIdx,
      timeLeft,
      notes,
      questionFilter,
      layoutMode,
      started: isStarted,
      focusMode,
    });
    return () => {
      debouncedLocalDraft.flush();
    };
  }, [slug, answers, passageIdx, timeLeft, notes, questionFilter, layoutMode, isStarted, debouncedLocalDraft, focusMode]);

  const persistCheckpoint = useCallback(
    async (opts?: { completed?: boolean; force?: boolean }) => {
      if (!paper || !attemptReady || !checkpointHydrated || !attemptRef.current) return false;
      const state = latestRef.current;
      const normalizedAnswers = normalizeForPersist(state.answers);
      const previousAnswers = serverSyncedAnswersRef.current ?? {};
      const shouldForce = Boolean(opts?.force || opts?.completed);
      const answersDelta = shouldForce ? undefined : diffAnswers(previousAnswers, normalizedAnswers);
      const deltaKeys = answersDelta ? Object.keys(answersDelta) : [];
      const hasAnswerChanges = shouldForce || deltaKeys.length > 0;
      const metaPayload = JSON.stringify({
        passageIdx: state.passageIdx,
        timeLeft: state.timeLeft,
        notes: state.notes,
        questionFilter: state.questionFilter,
        layoutMode: state.layoutMode,
        started: state.started,
        focusMode: state.focusMode,
      });
      const metaChanged = shouldForce || metaPayload !== lastCheckpointMetaRef.current;
      if (!shouldForce && !hasAnswerChanges && !metaChanged) {
        return true;
      }
      const elapsed = Math.max(0, Math.min(paper.durationSec, paper.durationSec - state.timeLeft));
      const answersPayload: Record<string, unknown> =
        shouldForce || deltaKeys.length === 0 || !answersDelta ? normalizedAnswers : answersDelta;

      const ok = await saveMockCheckpoint({
        attemptId: attemptRef.current,
        section: 'reading',
        mockId: paper.id,
        payload: {
          paperId: paper.id,
          answers: answersPayload,
          passageIdx: state.passageIdx,
          timeLeft: state.timeLeft,
          notes: state.notes,
          questionFilter: state.questionFilter,
          layoutMode: state.layoutMode,
          started: state.started,
          focusMode: state.focusMode,
        },
        elapsed,
        duration: paper.durationSec,
        completed: opts?.completed,
        answersDelta: !shouldForce && deltaKeys.length > 0 ? answersDelta : undefined,
      });
      if (ok) {
        serverSyncedAnswersRef.current = normalizedAnswers;
        lastCheckpointMetaRef.current = metaPayload;
      }
      return ok;
    },
    [paper, attemptReady, checkpointHydrated],
  );

  const scheduleCheckpoint = useCallback(
    (opts?: { force?: boolean }) => {
      if (!paper || !attemptReady || !checkpointHydrated) {
        if (checkpointTimeoutRef.current) {
          window.clearTimeout(checkpointTimeoutRef.current);
          checkpointTimeoutRef.current = null;
        }
        return;
      }
      if (checkpointTimeoutRef.current) {
        window.clearTimeout(checkpointTimeoutRef.current);
      }
      const now = Date.now();
      const idle = now - lastActivityRef.current >= IDLE_THRESHOLD_MS;
      const delay = opts?.force ? 0 : idle ? IDLE_CHECKPOINT_INTERVAL : ACTIVE_CHECKPOINT_INTERVAL;
      checkpointTimeoutRef.current = window.setTimeout(async () => {
        checkpointTimeoutRef.current = null;
        await persistCheckpoint({ force: opts?.force });
        if (!opts?.force) {
          scheduleCheckpoint();
        }
      }, delay);
    },
    [paper, attemptReady, checkpointHydrated, persistCheckpoint],
  );

  // beforeunload → force checkpoint
  useEffect(() => {
    if (!paper || !attemptReady || !checkpointHydrated) return;
    const handler = () => {
      debouncedLocalDraft.flush();
      void persistCheckpoint({ force: true });
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [paper, attemptReady, checkpointHydrated, persistCheckpoint, debouncedLocalDraft]);

  // initial schedule
  useEffect(() => {
    if (!paper || !attemptReady || !checkpointHydrated) return;
    lastActivityRef.current = Date.now();
    scheduleCheckpoint();
    return () => {
      if (checkpointTimeoutRef.current) {
        window.clearTimeout(checkpointTimeoutRef.current);
        checkpointTimeoutRef.current = null;
      }
    };
  }, [paper, attemptReady, checkpointHydrated, scheduleCheckpoint]);

  // reschedule on changes
  useEffect(() => {
    if (!attemptReady || !checkpointHydrated) return;
    lastActivityRef.current = Date.now();
    scheduleCheckpoint();
  }, [
    answers,
    notes,
    questionFilter,
    layoutMode,
    focusMode,
    passageIdx,
    isStarted,
    attemptReady,
    checkpointHydrated,
    scheduleCheckpoint,
  ]);

  // Load notes from API
  useEffect(() => {
    if (!attemptReady || !checkpointHydrated) return;
    const attemptId = attemptRef.current;
    if (!attemptId) {
      setNotesLoaded(true);
      return;
    }

    setNotesLoaded(false);

    let cancelled = false;
    const controller = new AbortController();

    const loadNotes = async () => {
      try {
        const params = new URLSearchParams({ attemptId });
        const res = await fetch(`/api/mock/reading/notes?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          return;
        }
        const data = (await res.json()) as {
          ok: boolean;
          notes?: Array<{
            id: string;
            passageId: string;
            ranges: Array<{ start: number; end: number; color?: string }>;
            noteText?: string | null;
          }>;
        };
        if (!cancelled && data?.ok && Array.isArray(data.notes)) {
          const mapped = data.notes
            .map((item) => mapReadingNote(item))
            .filter((item): item is ReadingNote => Boolean(item));
          setNotes((prev) => mergeNotes(prev, mapped));
        }
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return;
      } finally {
        if (!cancelled) setNotesLoaded(true);
      }
    };

    void loadNotes();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [attemptReady, checkpointHydrated]);

  // sendBeacon on tab hide
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!paper) return;
    const onHide = () => {
      if (!paper || !checkpointHydrated || !attemptRef.current) return;
      if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'hidden') return;
      try {
        const state = latestRef.current;
        const normalized = normalizeForPersist(currentAnswersRef.current);
        const payload = {
          attemptId: attemptRef.current,
          sectionIndex: READING_SECTION_INDEX,
          snapshot: {
            paperId: paper.id,
            answers: normalized,
            passageIdx: state.passageIdx,
            timeLeft: state.timeLeft,
            notes: state.notes,
            questionFilter: state.questionFilter,
            layoutMode: state.layoutMode,
            started: state.started,
            focusMode: state.focusMode,
          },
          mockId: paper.id,
          elapsedSeconds: Math.max(0, Math.min(paper.durationSec, paper.durationSec - state.timeLeft)),
          durationSeconds: paper.durationSec,
          completed: Boolean(state.started && state.timeLeft === 0),
          answers: normalized,
        };
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/mock/checkpoints', blob);
      } catch {
        // ignore beacon failures
      }
    };
    window.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      window.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
    };
  }, [paper, checkpointHydrated]);

  const current = useMemo(() => (paper ? paper.passages[passageIdx] : undefined), [paper, passageIdx]);
  const currentPassageId = current?.id;
  const passageNotes = useMemo(() => {
    if (!currentPassageId) return [] as ReadingNote[];
    return notes
      .filter((note) => note.passageId === currentPassageId)
      .sort((a, b) => a.start - b.start);
  }, [notes, currentPassageId]);

  const passageHighlights = useMemo(
    () =>
      passageNotes
        .flatMap((note) =>
          note.ranges.map((range, index) => ({
            id: index === 0 ? note.id : `${note.id}:${index}`,
            start: range.start,
            end: range.end,
            color: note.color,
            noteText: note.noteText,
          })),
        )
        .filter((item) => item.end > item.start)
        .sort((a, b) => a.start - b.start),
    [passageNotes],
  );

  useEffect(() => {
    setEditingNoteId(null);
    setNoteEditorValue('');
  }, [current?.id]);

  useEffect(() => {
    if (!current || !current.questions || current.questions.length === 0) {
      setActiveQuestionId(null);
      return;
    }
    setActiveQuestionId((prev) => {
      if (prev && current.questions.some((q) => q.id === prev)) {
        return prev;
      }
      return current.questions[0]?.id ?? null;
    });
  }, [current]);

  const questionItems = useMemo<QuestionNavQuestion[]>(() => {
    if (!paper) return [];
    const items: QuestionNavQuestion[] = [];
    paper.passages.forEach((passage, passageIndex) => {
      passage.questions.forEach((question) => {
        items.push({ id: question.id, index: items.length + 1, label: `P${passageIndex + 1}` });
      });
    });
    return items;
  }, [paper]);

  const questionIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    questionItems.forEach((item) => {
      map.set(item.id, item.index);
    });
    return map;
  }, [questionItems]);

  const questionStats = useMemo(() => {
    let answeredTotal = 0;
    let flaggedTotal = 0;
    questionItems.forEach((item) => {
      const entry = answers[item.id];
      if (isAnsweredEntry(entry)) answeredTotal++;
      if (isFlaggedEntry(entry)) flaggedTotal++;
    });
    return {
      total: questionItems.length,
      answered: answeredTotal,
      flagged: flaggedTotal,
      unanswered: questionItems.length - answeredTotal,
    };
  }, [questionItems, answers]);

  const nextUnanswered = useMemo(
    () => questionItems.find((item) => !isAnsweredEntry(answers[item.id])),
    [questionItems, answers],
  );

  const nextFlagged = useMemo(
    () => questionItems.find((item) => isFlaggedEntry(answers[item.id])),
    [questionItems, answers],
  );

  const currentQuestionId = activeQuestionId ?? current?.questions?.[0]?.id ?? null;

  const resumeAvailable = useMemo(() => {
    if (!paper) return false;
    if (isStarted) return true;
    if (timeLeft < paper.durationSec) return true;
    const answered = questionItems.some((item) => isAnsweredEntry(answers[item.id]));
    return answered || notes.length > 0;
  }, [paper, isStarted, timeLeft, questionItems, answers, notes]);

  const createAnnotation = useCallback(
    async (payload: SelectionInput) => {
      if (!current) return;
      const textLength = current.text.length;
      const start = Math.max(0, Math.min(payload.start, textLength));
      const end = Math.max(start, Math.min(payload.end, textLength));
      if (end <= start) return;

      const existing = latestRef.current.notes.filter((note) => note.passageId === current.id);
      const overlaps = existing.some((note) =>
        note.ranges.some((range) => rangesOverlap(range.start, range.end, start, end)),
      );
      if (overlaps) {
        if (typeof window !== 'undefined') {
          window.alert('Selection overlaps an existing highlight. Remove it first to re-highlight.');
        }
        return;
      }

      const localId = `local-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
      const provisional: ReadingNote = {
        id: localId,
        passageId: current.id,
        start,
        end,
        ranges: [{ start, end }],
        color: DEFAULT_NOTE_COLOR,
        noteText: payload.noteText ?? null,
      };

      setNotes((prev) => mergeNotes(prev, [provisional]));

      if (payload.noteText && payload.noteText.trim().length > 0) {
        track('reading.note.add', {
          passageId: current.id,
          length: Math.min(1000, payload.noteText.length),
        });
        setEditingNoteId(localId);
        setNoteEditorValue(payload.noteText);
      } else {
        setEditingNoteId(null);
        setNoteEditorValue('');
      }

      track('reading.highlight.add', {
        passageId: current.id,
        withNote: Boolean(payload.noteText && payload.noteText.trim().length > 0),
      });

      const attemptId = attemptRef.current;
      if (!attemptId) return;

      try {
        const response = await fetch('/api/mock/reading/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId,
            passageId: current.id,
            ranges: [{ start, end, color: DEFAULT_NOTE_COLOR }],
            noteText: payload.noteText ?? null,
          }),
        });

        if (!response.ok) throw new Error(`Failed with status ${response.status}`);

        const result = (await response.json()) as {
          ok: boolean;
          note?: {
            id: string;
            passageId: string;
            ranges: Array<{ start: number; end: number; color?: string }>;
            noteText?: string | null;
          };
        };

        if (result.ok && result.note) {
          const mapped = mapReadingNote(result.note);
          if (mapped) {
            setNotes((prev) => {
              const withoutTemp = prev.filter((note) => note.id !== localId);
              return mergeNotes(withoutTemp, [mapped]);
            });
            if (payload.noteText && payload.noteText.trim().length > 0) {
              setEditingNoteId(mapped.id);
              setNoteEditorValue(mapped.noteText ?? payload.noteText);
            }
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to persist reading note', error);
      }
    },
    [current, DEFAULT_NOTE_COLOR],
  );

  const handleSelectionHighlight = useCallback(
    (payload: SelectionInput) => {
      void createAnnotation({ ...payload, noteText: undefined });
    },
    [createAnnotation],
  );

  const handleSelectionNote = useCallback(
    (payload: SelectionInput) => {
      void createAnnotation(payload);
    },
    [createAnnotation],
  );

  const handleHighlightFocus = useCallback(
    (noteId: string) => {
      const baseId = noteId.split(':')[0] ?? noteId;
      setEditingNoteId(baseId);
      const target = notes.find((note) => note.id === baseId);
      setNoteEditorValue(target?.noteText ?? '');
      const node = noteRefs.current[baseId];
      if (node) {
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof window !== 'undefined') {
          window.setTimeout(() => {
            node.focus({ preventScroll: true });
          }, 180);
        }
      }
    },
    [notes],
  );

  const handleNoteSave = useCallback(
    async (noteId: string) => {
      const trimmed = noteEditorValue.trim();
      const target = notes.find((note) => note.id === noteId);
      const previous = target?.noteText ?? null;
      const previousTrimmed = (previous ?? '').trim();
      const payloadNote = trimmed.length > 0 ? trimmed : null;

      setNotes((prev) =>
        prev.map((note) => (note.id === noteId ? { ...note, noteText: payloadNote } : note)),
      );

      setEditingNoteId(null);
      setNoteEditorValue('');

      if (target && trimmed.length > 0 && previousTrimmed.length === 0) {
        track('reading.note.add', {
          passageId: target.passageId,
          length: Math.min(1000, trimmed.length),
        });
      }

      if ((previous ?? null) === payloadNote) {
        return;
      }

      const attemptId = attemptRef.current;
      if (!attemptId) return;

      try {
        const response = await fetch('/api/mock/reading/notes', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: noteId, noteText: payloadNote }),
        });
        if (!response.ok) throw new Error(`Failed with status ${response.status}`);
      } catch (error) {
        setNotes((prev) =>
          prev.map((note) => (note.id === noteId ? { ...note, noteText: previous } : note)),
        );
        // eslint-disable-next-line no-console
        console.error('Failed to update reading note', error);
      }
    },
    [noteEditorValue, notes],
  );

  const handleRemoveHighlight = useCallback(
    async (noteId: string) => {
      const previousNotes = notes;
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      if (editingNoteId === noteId) {
        setEditingNoteId(null);
        setNoteEditorValue('');
      }

      const attemptId = attemptRef.current;
      if (!attemptId) return;

      try {
        const response = await fetch('/api/mock/reading/notes', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: noteId }),
        });
        if (!response.ok) throw new Error(`Failed with status ${response.status}`);
      } catch (error) {
        setNotes(previousNotes);
        // eslint-disable-next-line no-console
        console.error('Failed to delete reading note', error);
      }
    },
    [notes, editingNoteId],
  );

  const cancelNoteEditing = useCallback(() => {
    setEditingNoteId(null);
    setNoteEditorValue('');
  }, []);

  const updateAnswerValue = useCallback((questionId: string, value: string) => {
    setAnswers((prev) => {
      const current = prev[questionId];
      const currentValue = getAnswerText(current);
      const currentFlagged = isFlagged(current);
      if (currentValue === value) return prev;
      return { ...prev, [questionId]: { value, flagged: currentFlagged } };
    });
    setActiveQuestionId(questionId);
  }, []);

  const toggleFlag = useCallback((questionId: string) => {
    let nextFlag = false;
    setAnswers((prev) => {
      const current = prev[questionId];
      const currentValue = getAnswerText(current);
      const currentFlagged = isFlagged(current);
      nextFlag = !currentFlagged;
      return { ...prev, [questionId]: { value: currentValue, flagged: nextFlag } };
    });
    setActiveQuestionId(questionId);
    track('reading.flag.toggle', { questionId, flagged: nextFlag });
  }, []);

  const applyQuestionFilter = useCallback(
    (next: QuestionNavFilter, source: 'nav' | 'toolbar') => {
      setQuestionFilter((prev) => {
        if (prev === next) return prev;
        track('reading.nav.filter', { filter: next, source });
        return next;
      });
    },
    [],
  );

  const handleLayoutModeChange = useCallback((mode: LayoutMode) => {
    setLayoutMode((prev) => (prev === mode ? prev : mode));
  }, []);

  const handleFocusModeToggle = useCallback((next: boolean) => {
    setFocusMode(next);
  }, []);

  const exitFocusMode = useCallback(() => {
    setFocusMode(false);
  }, []);

  const scrollToQuestion = useCallback((questionId: string) => {
    const node = questionRefs.current[questionId];
    setActiveQuestionId(questionId);
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        const interactive = node.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        interactive?.focus({ preventScroll: true });
      }, 160);
    }
  }, []);

  const startExam = useCallback(() => {
    setIsStarted(true);
  }, []);

  const makeAttemptId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    const random = Math.random().toString(16).slice(2, 10);
    return `attempt-${Date.now()}-${random}`;
  };

  const submit = async () => {
    if (!paper || !slug || isSubmitting) return;

    setIsSubmitting(true);

    const normalizedAnswers = normalizeForPersist(answers);
    const durationSec = Math.max(0, Math.round(paper.durationSec - timeLeft));

    // temporary attempt id – later we’ll use Supabase’s id
    const attemptId = makeAttemptId();

    try {
      // TODO: later hit /api/mock/reading/submit-final and save to Supabase
      // For now, just stash basic payload locally so result page can read it if needed.
      try {
        localStorage.setItem(
          `read:attempt-res:${attemptId}`,
          JSON.stringify({
            slug,
            paperId: paper.id,
            answers: normalizedAnswers,
            durationSec,
          }),
        );
      } catch {
        // ignore localStorage errors
      }

      // clear local draft/checkpoints for this test
      clearMockDraft('reading', slug);

      // go to result screen
      const targetUrl = `/mock/reading/${encodeURIComponent(
        slug,
      )}/result?attempt=${encodeURIComponent(attemptId)}`;

      await router.replace(targetUrl);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('[reading] submit failed', error);
      }
      toast.error('Something went wrong while submitting.');
      setIsSubmitting(false);
    }
  };

  if (!paper || !current) {
    return (
      <Shell title="Loading...">
        <div className="rounded-2xl border border-border p-4">Loading paper…</div>
      </Shell>
    );
  }

  const percent =
    questionStats.total > 0
      ? Math.round((questionStats.answered / questionStats.total) * 100)
      : 0;

  const quickFilters: Array<{ id: QuestionNavFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: questionStats.total },
    { id: 'unanswered', label: 'Unanswered', count: questionStats.unanswered },
    { id: 'flagged', label: 'Flagged', count: questionStats.flagged },
  ];

  const layoutIsSplit = layoutMode === 'split';
  const layoutContainerClass = layoutIsSplit
    ? 'flex flex-col gap-8 md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]'
    : 'flex flex-col gap-8';

  const reviewBarClasses = [
    'sticky bottom-0 mt-8 -mx-6 border-t border-border/70 bg-background/95 px-6 py-4 shadow-lg shadow-black/5 backdrop-blur supports-[backdrop-filter]:backdrop-blur',
  ];
  if (layoutIsSplit) {
    reviewBarClasses.push(
      'md:static md:mx-0 md:mt-auto md:rounded-2xl md:border md:bg-background/90 md:px-6 md:py-5 md:shadow-md md:backdrop-blur-none md:supports-[backdrop-filter]:backdrop-blur-none',
    );
  }

  const passageHeadingId = `passage-${current.id}-title`;

  return (
    <>
      <Shell
        title={paper.title}
        right={
          <>
            <div className="text-small text-foreground/80">Answered {percent}%</div>
            <div className="rounded-full border border-border px-3 py-1 text-small">
              ⏱ {hhmmss(timeLeft)}
            </div>
            <FocusModeToggle active={focusMode} onToggle={handleFocusModeToggle} />
            <LayoutModeChips value={layoutMode} onChange={handleLayoutModeChange} />
          </>
        }
      >
        <div className="min-w-0 rounded-3xl border border-border/80 bg-background/60 p-6 shadow-lg shadow-black/5">
          {focusMode && isStarted ? <FocusModeNotice onExit={exitFocusMode} /> : null}
          <div className={layoutContainerClass}>
            <section className="min-w-0 space-y-4" aria-labelledby={passageHeadingId}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-small font-medium">
                  Passage {passageIdx + 1} of {paper.passages.length} — {current.title}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={passageIdx === 0}
                    onClick={() => setPassageIdx((i) => Math.max(0, i - 1))}
                    className="border border-border text-small hover:border-primary disabled:opacity-60"
                  >
                    Prev
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={passageIdx === paper.passages.length - 1}
                    onClick={() =>
                      setPassageIdx((i) => Math.min(paper.passages.length - 1, i + 1))
                    }
                    className="border border-border text-small hover:border-primary disabled:opacity-60"
                  >
                    Next
                  </Button>
                </div>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/70 p-4">
                <ReadingPassage
                  text={current.text}
                  highlights={passageHighlights}
                  onCreateHighlight={handleSelectionHighlight}
                  onCreateNote={handleSelectionNote}
                  onHighlightFocus={handleHighlightFocus}
                />
              </div>
              <p className="text-caption text-foreground/70">
                Select text in the passage to highlight or add a note. Highlights autosave for this
                attempt.
              </p>
            </section>

            <section className="min-w-0 flex flex-col gap-4">
              <div className="grid gap-3">
                {current.questions.map((q, idx) => {
                  const entry = answers[q.id];
                  const value = getAnswerText(entry);
                  const flagged = isFlagged(entry);
                  const answered = isAnsweredEntry(entry);
                  const questionNumber = questionIndexMap.get(q.id) ?? idx + 1;

                  return (
                    <div
                      key={q.id}
                      ref={(node) => {
                        if (node) {
                          questionRefs.current[q.id] = node;
                        } else {
                          delete questionRefs.current[q.id];
                        }
                      }}
                      className={[
                        'group rounded-xl border bg-background/90 p-4 transition focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
                        flagged
                          ? 'border-warning/80 bg-warning/5'
                          : answered
                          ? 'border-success/60'
                          : 'border-border',
                        currentQuestionId === q.id ? 'ring-1 ring-primary/40' : '',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="text-caption font-semibold uppercase tracking-wide text-foreground/60">
                            Question {questionNumber}
                          </div>
                          <div className="mt-1 text-small font-medium text-foreground">
                            {q.prompt || q.id}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFlag(q.id)}
                          className={[
                            'rounded-full border px-2 text-caption',
                            flagged
                              ? 'border-warning bg-warning/10 text-warning'
                              : 'border-border text-foreground/70 hover:border-warning hover:text-warning',
                          ].join(' ')}
                          leadingIcon={<Flag className="h-3.5 w-3.5" aria-hidden />}
                          aria-pressed={flagged}
                        >
                          {flagged ? 'Flagged' : 'Flag'}
                        </Button>
                      </div>
                      <div className="mt-3">
                        {renderInput(q, value, {
                          onChange: (val) => updateAnswerValue(q.id, val),
                          onFocus: () => setActiveQuestionId(q.id),
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={reviewBarClasses.join(' ')}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Question filters">
                    {quickFilters.map((item) => {
                      const isActive = questionFilter === item.id;
                      return (
                        <Button
                          key={item.id}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => applyQuestionFilter(item.id, 'toolbar')}
                          className={[
                            'rounded-full border px-3 text-small',
                            isActive
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border text-foreground hover:border-primary',
                          ].join(' ')}
                          aria-pressed={isActive}
                        >
                          {item.label}
                          <span className="ml-2 text-foreground/60">{item.count}</span>
                        </Button>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        applyQuestionFilter('unanswered', 'toolbar');
                        if (nextUnanswered) scrollToQuestion(nextUnanswered.id);
                      }}
                      className="rounded-full border border-border text-small text-foreground hover:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isSubmitting || !nextUnanswered}
                    >
                      Review unanswered
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        applyQuestionFilter('flagged', 'toolbar');
                        if (nextFlagged) scrollToQuestion(nextFlagged.id);
                      }}
                      className="rounded-full border border-border text-small text-foreground hover:border-warning disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isSubmitting || !nextFlagged}
                    >
                      Review flagged
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={submit}
                      className="rounded-full px-4 text-small font-semibold text-background disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={isSubmitting}
                      aria-busy={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting…' : 'Submit for scoring'}
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        <aside className="flex h-full min-w-0 flex-col gap-4 md:max-w-sm xl:max-w-md">
          {localOnly && <OfflineOnlyBanner />}
          <QuestionNav
            questions={questionItems}
            answers={answers}
            filter={questionFilter}
            onFilterChange={(next) => applyQuestionFilter(next, 'nav')}
            onSelect={scrollToQuestion}
            onToggleFlag={toggleFlag}
            currentQuestionId={currentQuestionId}
          />
          <div className="flex-1 rounded-3xl border border-border/80 bg-background/60 p-5 shadow-lg shadow-black/5">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-small font-medium">Highlights &amp; notes</div>
              {!notesLoaded && <span className="text-caption text-foreground/60">Syncing…</span>}
            </div>
            {passageNotes.length === 0 ? (
              <p className="text-caption text-foreground/60">
                Select text in the passage to leave highlights or notes. They&apos;ll appear here for quick
                access.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {passageNotes.map((note) => {
                  const isEditing = editingNoteId === note.id;
                  const hasNote = Boolean(note.noteText && note.noteText.trim().length > 0);
                  const excerpt = current ? excerptForNote(note, current.text) : '';
                  return (
                    <div
                      key={note.id}
                      ref={(node) => {
                        if (node) {
                          noteRefs.current[note.id] = node;
                        } else {
                          delete noteRefs.current[note.id];
                        }
                      }}
                      tabIndex={-1}
                      className={`rounded-xl border p-3 outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                        isEditing ? 'border-primary shadow-sm' : 'border-border'
                      }`}
                    >
                      <div className="text-caption font-medium uppercase text-foreground/60">
                        Highlight
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-small text-foreground/90">
                        {excerpt}
                      </p>
                      {isEditing ? (
                        <div className="mt-3 space-y-2">
                          <label
                            className="block text-caption font-medium text-foreground/70"
                            htmlFor={`note-edit-${note.id}`}
                          >
                            Note
                          </label>
                          <textarea
                            id={`note-edit-${note.id}`}
                            value={noteEditorValue}
                            onChange={(event) => setNoteEditorValue(event.target.value)}
                            rows={3}
                            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            placeholder="Add your note"
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="primary"
                              size="sm"
                              onClick={() => handleNoteSave(note.id)}
                              className="rounded-full px-3 text-small font-medium text-background"
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={cancelNoteEditing}
                              className="rounded-full border border-border text-small text-foreground/70 hover:border-foreground/50"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 space-y-2">
                          <div className="whitespace-pre-wrap text-small text-foreground/80">
                            {hasNote ? (
                              note.noteText
                            ) : (
                              <span className="text-foreground/60">No note yet.</span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleHighlightFocus(note.id)}
                              className="rounded-full border border-border text-small text-foreground hover:border-primary hover:text-primary"
                            >
                              {hasNote ? 'Edit note' : 'Add note'}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveHighlight(note.id)}
                              className="rounded-full border border-border text-small text-danger hover:border-danger hover:bg-danger/10"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="mt-auto pt-4">
            <Link href="/mock/reading" className="text-small underline underline-offset-4">
              Change test
            </Link>
          </div>
        </aside>
      </Shell>

      <StartOverlay
        open={!isStarted}
        layoutMode={layoutMode}
        onLayoutChange={handleLayoutModeChange}
        focusMode={focusMode}
        onFocusModeChange={handleFocusModeToggle}
        onStart={startExam}
        paperTitle={paper.title}
        durationSec={paper.durationSec}
        resumeAvailable={resumeAvailable}
      />

      <style jsx global>{`
        :root[data-focus-mode='true'] header[data-solid] {
          display: none !important;
        }
        :root[data-focus-mode='true'] nav[aria-label='Bottom navigation'],
        :root[data-focus-mode='true'] [aria-controls='quick-actions-menu'],
        :root[data-focus-mode='true'] #quick-actions-menu {
          display: none !important;
        }
      `}</style>
    </>
  );
}

type LayoutModeChipsProps = {
  value: LayoutMode;
  onChange: (mode: LayoutMode) => void;
};

type FocusModeToggleProps = {
  active: boolean;
  onToggle: (next: boolean) => void;
};

function FocusModeToggle({ active, onToggle }: FocusModeToggleProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => onToggle(!active)}
      aria-pressed={active}
      className={[
        'rounded-full border px-3 text-small',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-foreground/80 hover:border-primary',
      ].join(' ')}
    >
      {active ? 'Focus mode on' : 'Focus mode off'}
    </Button>
  );
}

type FocusModeNoticeProps = {
  onExit: () => void;
};

function FocusModeNotice({ onExit }: FocusModeNoticeProps) {
  return (
    <div className="mb-4 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-small text-primary">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium">Focus mode is on — navigation and alerts are hidden.</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onExit}
          className="rounded-full border border-primary text-small font-semibold text-primary hover:bg-primary hover:text-background"
        >
          Exit focus mode
        </Button>
      </div>
      <p className="mt-1 text-caption text-primary/80">
        You can toggle focus mode anytime from the exam header.
      </p>
    </div>
  );
}

function LayoutModeChips({ value, onChange }: LayoutModeChipsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-caption text-foreground/60">Layout</span>
      <div
        className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 p-1"
        role="group"
        aria-label="Exam layout"
      >
        {LAYOUT_OPTIONS.map((option) => {
          const active = value === option.id;
          return (
            <Button
              key={option.id}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onChange(option.id)}
              className={[
                'rounded-full px-3 text-caption font-medium',
                active ? 'bg-primary text-background shadow-sm' : 'text-foreground/70 hover:text-foreground',
              ].join(' ')}
              aria-pressed={active}
            >
              {option.shortLabel}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

type StartOverlayProps = {
  open: boolean;
  layoutMode: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
  focusMode: boolean;
  onFocusModeChange: (next: boolean) => void;
  onStart: () => void;
  paperTitle: string;
  durationSec: number;
  resumeAvailable: boolean;
};

function StartOverlay({
  open,
  layoutMode,
  onLayoutChange,
  focusMode,
  onFocusModeChange,
  onStart,
  paperTitle,
  durationSec,
  resumeAvailable,
}: StartOverlayProps) {
  const dialogId = useId();
  if (!open) return null;

  const minutes = Math.max(1, Math.round(durationSec / 60));
  const layoutGroupName = `${dialogId}-layout`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 px-4 pb-safe pt-safe backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${dialogId}-title`}
        aria-describedby={`${dialogId}-description`}
        className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-card"
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <h2 id={`${dialogId}-title`} className="text-h4 font-semibold">
              Ready to start?
            </h2>
            <p id={`${dialogId}-description`} className="text-small text-foreground/70">
              Choose how you want to view the passage and questions before you begin. You can change this
              later from the top bar.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-background/60 p-4">
            <div className="text-small font-semibold text-foreground">{paperTitle}</div>
            <div className="mt-1 text-caption text-foreground/70">Approx. {minutes} minute session</div>
          </div>
          {resumeAvailable ? (
            <div className="rounded-xl border border-warning/50 bg-warning/10 px-4 py-3 text-small text-warning">
              <p className="font-semibold">We saved your progress.</p>
              <p className="text-caption text-warning/90">
                Your answers, highlights, and timer will resume from the last checkpoint.
              </p>
            </div>
          ) : null}
          <div className="rounded-xl border border-border bg-background/60 p-4">
            <div className="text-small font-semibold text-foreground">Instructions &amp; rules</div>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-small text-foreground/80">
              <li>The timer keeps running even if you leave or refresh the page.</li>
              <li>Use highlights and notes to mark the passage — everything autosaves.</li>
              <li>Flag questions you want to review before submitting.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <div className="text-small font-medium text-foreground" id={`${dialogId}-layout-label`}>
              Pick your layout
            </div>
            <div
              role="radiogroup"
              aria-labelledby={`${dialogId}-layout-label`}
              className="grid gap-3 sm:grid-cols-2"
            >
              {LAYOUT_OPTIONS.map((option) => {
                const checked = layoutMode === option.id;
                const optionId = `${layoutGroupName}-${option.id}`;
                return (
                  <label
                    key={option.id}
                    htmlFor={optionId}
                    className={[
                      'cursor-pointer rounded-xl border p-4 transition focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
                      checked
                        ? 'border-primary bg-primary/10 text-primary shadow-sm'
                        : 'border-border bg-background/80 text-foreground hover:border-primary/60',
                    ].join(' ')}
                  >
                    <input
                      id={optionId}
                      type="radio"
                      name={layoutGroupName}
                      checked={checked}
                      onChange={() => onLayoutChange(option.id)}
                      className="sr-only"
                    />
                    <div className="text-small font-semibold">{option.label}</div>
                    <p className="mt-1 text-caption text-foreground/70">{option.description}</p>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-background/70 p-4">
            <Checkbox
              checked={focusMode}
              onCheckedChange={onFocusModeChange}
              label="Start in focus mode"
              description="Hide navigation and notifications for a distraction-free session. You can exit anytime from the exam header."
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-caption text-foreground/60">
              Layout applies on desktop; mobile stays single column.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onStart}
              className="rounded-full px-4 text-small font-semibold text-background"
            >
              {resumeAvailable ? 'Resume exam' : 'Start exam'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderInput(
  q: Q,
  value: string,
  handlers: { onChange: (v: string) => void; onFocus: () => void },
) {
  if (q.type === 'tfng') {
    const opts = ['True', 'False', 'Not Given'];
    return (
      <Options options={opts} value={value} onPick={handlers.onChange} onFocus={handlers.onFocus} />
    );
  }
  if (q.type === 'yynn') {
    const opts = ['Yes', 'No', 'Not Given'];
    return (
      <Options options={opts} value={value} onPick={handlers.onChange} onFocus={handlers.onFocus} />
    );
  }
  if (q.type === 'heading' || q.type === 'mcq') {
    return (
      <Options
        options={normalizeOptionList(q.options)}
        value={value}
        onPick={handlers.onChange}
        onFocus={handlers.onFocus}
      />
    );
  }
  if (q.type === 'match') {
    return (
      <MatchOptions
        options={normalizeOptionList(q.options)}
        value={value}
        onPick={handlers.onChange}
        onFocus={handlers.onFocus}
      />
    );
  }
  return (
    <input
      value={value}
      onChange={(e) => handlers.onChange(e.target.value)}
      onFocus={handlers.onFocus}
      className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      placeholder="Type your answer"
    />
  );
}

function normalizeOptionList(options: Q['options']): string[] {
  if (!options) return [];
  if (Array.isArray(options)) return options;
  const fromPairs = Array.isArray(options.pairs)
    ? options.pairs.flatMap((pair) => {
        if (!pair) return [];
        const rights = Array.isArray(pair.right) ? pair.right : pair.right ? [pair.right] : [];
        if (rights.length === 0) return pair.left ? [pair.left] : [];
        return rights.map((right) => `${pair.left} -> ${right}`);
      })
    : [];
  const extras = Array.isArray(options.choices) ? options.choices : [];
  return [...fromPairs, ...extras];
}

const Options: React.FC<{
  options: string[];
  value: string;
  onPick: (v: string) => void;
  onFocus: () => void;
}> = ({ options, value, onPick, onFocus }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((opt) => (
      <Button
        key={opt}
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          onFocus();
          onPick(opt);
        }}
        onFocus={onFocus}
        className={[
          'h-auto rounded-lg border px-3 text-small',
          value === opt ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground',
        ].join(' ')}
      >
        {opt}
      </Button>
    ))}
  </div>
);

const MatchOptions: React.FC<{
  options: string[];
  value: string;
  onPick: (v: string) => void;
  onFocus: () => void;
}> = ({ options, value, onPick, onFocus }) => (
  <div className="grid gap-2 sm:grid-cols-2">
    {options.map((opt, index) => (
      <Button
        key={toOptionId(opt, index)}
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          onFocus();
          onPick(opt);
        }}
        onFocus={onFocus}
        className={[
          'h-auto rounded-lg border px-3 text-left text-small leading-snug',
          value === opt ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground',
        ].join(' ')}
      >
        {opt}
      </Button>
    ))}
  </div>
);

function normalizeAnswerEntry(value: unknown): ReadingAnswer {
  if (value && typeof value === 'object') {
    const record = value as { value?: unknown; flagged?: unknown };
    const raw = record.value;
    const normalizedValue =
      typeof raw === 'string' ? raw : raw == null ? '' : String(raw);
    return {
      value: normalizedValue,
      flagged: record.flagged === true,
    };
  }
  if (typeof value === 'string') {
    return { value, flagged: false };
  }
  if (value == null) {
    return { value: '', flagged: false };
  }
  return { value: String(value), flagged: false };
}

function normalizeAnswerMap(input: unknown): AnswerMap {
  if (!input || typeof input !== 'object') return {};
  const result: AnswerMap = {};
  Object.entries(input as Record<string, unknown>).forEach(([key, value]) => {
    if (typeof key !== 'string') return;
    result[key] = normalizeAnswerEntry(value);
  });
  return result;
}

function normalizeQuestionFilter(value: unknown): QuestionNavFilter {
  return value === 'flagged' || value === 'unanswered' ? value : 'all';
}

function isAnsweredEntry(entry?: ReadingAnswer): boolean {
  if (!entry) return false;
  return getAnswerText(entry).trim().length > 0;
}

function isFlaggedEntry(entry?: ReadingAnswer): boolean {
  return isFlagged(entry);
}

const hhmmss = (sec: number) =>
  `${Math.floor(sec / 60)
    .toString()
    .padStart(2, '0')}:${Math.floor(sec % 60)
    .toString()
    .padStart(2, '0')}`;

const formatTimeForAnnouncement = (seconds: number) => {
  const mins = Math.floor(seconds/60);
  const secs = seconds % 60;
  const parts: string[] = [];
  if (mins > 0) parts.push(`${mins} minute${mins === 1 ? '' : 's'}`);
  if (secs > 0 || mins === 0) parts.push(`${secs} second${secs === 1 ? '' : 's'}`);
  return parts.join(' ');
};

const toOptionId = (value: string, index: number) => {
  const base = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return base || `option-${index}`;
};

const describeQuestionType = (type: QType) => {
  switch (type) {
    case 'tfng':
      return 'True, False, or Not Given question';
    case 'yynn':
      return 'Yes, No, or Not Given question';
    case 'heading':
      return 'Heading matching question';
    case 'match':
      return 'Matching question';
    case 'mcq':
      return 'Multiple choice question';
    default:
      return 'Short answer question';
  }
};

function normalizeLayoutMode(value: unknown): LayoutMode {
  return value === 'scroll' ? 'scroll' : 'split';
}

function getStoredLayoutMode(): LayoutMode {
  if (typeof window === 'undefined') return 'split';
  try {
    const stored = window.localStorage.getItem(LAYOUT_PREF_KEY);
    return normalizeLayoutMode(stored ?? undefined);
  } catch {
    return 'split';
  }
}

function setStoredLayoutMode(mode: LayoutMode) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAYOUT_PREF_KEY, mode);
  } catch {
    // ignore
  }
}

function getStoredFocusMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(FOCUS_MODE_PREF_KEY) === '1';
  } catch {
    return false;
  }
}

function setStoredFocusMode(value: boolean) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FOCUS_MODE_PREF_KEY, value ? '1' : '0');
  } catch {
    // ignore
  }
}

function hasAnyAnswered(map: AnswerMap): boolean {
  return Object.values(map).some((entry) => getAnswerText(entry).trim().length > 0);
}

function mapReadingNote(row: {
  id?: string;
  passageId?: string;
  ranges?: Array<{ start?: number; end?: number; color?: string }>;
  noteText?: string | null;
  text?: string | null;
  start?: number;
  end?: number;
  color?: string;
}): ReadingNote | null {
  const parsed = parseServerNote(row);
  const passageId = typeof row?.passageId === 'string' ? row.passageId : null;
  if (!parsed.id || !passageId) return null;

  let ranges = parsed.ranges;
  if (ranges.length === 0) {
    const legacyStart = typeof row?.start === 'number' ? Number(row.start) : null;
    const legacyEnd = typeof row?.end === 'number' ? Number(row.end) : null;
    if (legacyStart !== null && legacyEnd !== null && legacyEnd > legacyStart) {
      ranges = [{ start: legacyStart, end: legacyEnd, color: row?.color ?? DEFAULT_NOTE_COLOR }];
    }
  }

  if (ranges.length === 0) return null;

  return {
    id: parsed.id,
    passageId,
    start: ranges[0].start,
    end: ranges[ranges.length - 1].end,
    ranges: ranges.map(r => ({
      start: r.start ?? 0,
      end: r.end ?? 0,
    })),
    color: parsed.color ?? DEFAULT_NOTE_COLOR,
    noteText: parsed.noteText ?? null,
  };
}
