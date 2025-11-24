// pages/mock/listening/run/[slug].tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

type ListeningTest = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  is_mock: boolean | null;
  total_questions: number | null;
  duration_seconds: number | null;
  audio_url: string | null;
};

type ListeningSection = {
  id: string;
  order_no: number;
  start_ms: number;
  end_ms: number | null;
};

type ListeningQuestion = {
  id: string;
  section_no: number;
  question_number: number;
  question_text: string;
  question_type: string;
  options: any | null;
  correct_answer: any;
  timestamp: number;
};

type RunPageProps = {
  test: ListeningTest;
  sections: ListeningSection[];
  questions: ListeningQuestion[];
  candidateLabel: string;
};

export const getServerSideProps: GetServerSideProps<RunPageProps> = async (
  ctx,
) => {
  const slug = ctx.params?.slug as string | undefined;
  const supabase = getServerClient(ctx.req, ctx.res);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(
          `/mock/listening/run/${slug ?? ''}`,
        )}`,
        permanent: false,
      },
    };
  }

  if (!slug) return { notFound: true };

  const { data: test, error: testError } = await supabase
    .from('listening_tests')
    .select(
      'id, slug, title, description, difficulty, is_mock, total_questions, duration_seconds, audio_url',
    )
    .eq('slug', slug)
    .maybeSingle();

  if (testError || !test) {
    console.error('listening_tests error', testError);
    return { notFound: true };
  }

  const { data: sectionsRows, error: sectionsError } = await supabase
    .from('listening_sections')
    .select('id, order_no, start_ms, end_ms')
    .eq('test_id', test.id)
    .order('order_no', { ascending: true });

  if (sectionsError) {
    console.error('listening_sections error', sectionsError);
  }

  const sections: ListeningSection[] = (sectionsRows ?? []) as any[];

  const { data: questionsRows, error: questionsError } = await supabase
    .from('listening_questions')
    .select(
      'id, section_no, question_number, question_text, question_type, options, correct_answer, timestamp',
    )
    .eq('test_id', test.id)
    .order('question_number', { ascending: true });

  if (questionsError) {
    console.error('listening_questions error', questionsError);
  }

  const questions: ListeningQuestion[] = (questionsRows ?? []) as any[];

  const candidateLabel = `00${String(user.id).slice(0, 6)}`;

  return {
    props: {
      test,
      sections,
      questions,
      candidateLabel,
    },
  };
};

type AnswerMap = Record<string, string>;

const formatClock = (seconds: number) => {
  if (seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const normalizeAnswer = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

const mapRawToBand = (raw: number, total: number): number | null => {
  if (total <= 0) return null;
  const pct = raw / total;

  if (pct >= 0.95) return 9;
  if (pct >= 0.9) return 8.5;
  if (pct >= 0.85) return 8;
  if (pct >= 0.8) return 7.5;
  if (pct >= 0.75) return 7;
  if (pct >= 0.7) return 6.5;
  if (pct >= 0.6) return 6;
  if (pct >= 0.5) return 5.5;
  if (pct >= 0.4) return 5;
  if (pct >= 0.3) return 4.5;
  return 4;
};

const ListeningRunPage: NextPage<RunPageProps> = ({
  test,
  sections,
  questions,
  candidateLabel,
}) => {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const [attemptId, setAttemptId] = React.useState<string | null>(null);
  const [answers, setAnswers] = React.useState<AnswerMap>({});
  const [examStarted, setExamStarted] = React.useState(false);
  const [finished, setFinished] = React.useState(false);

  const initialDuration = test.duration_seconds ?? 1800;
  const [totalSeconds, setTotalSeconds] = React.useState(initialDuration);
  const [remaining, setRemaining] = React.useState(initialDuration);

  const [audioTime, setAudioTime] = React.useState(0);
  const [activeSection, setActiveSection] = React.useState<number>(
    sections[0]?.order_no ?? 1,
  );
  const [maxSectionReached, setMaxSectionReached] = React.useState<number>(
    sections[0]?.order_no ?? 1,
  );

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<{
    raw_score: number;
    total_questions: number;
    band_score: number | null;
  } | null>(null);

  // create-run: initialise / resume attempt
  React.useEffect(() => {
    const createRun = async () => {
      try {
        const res = await fetch('/api/mock/listening/create-run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: test.slug, mode: 'mock' }),
        });
        if (!res.ok) {
          console.error('[LISTENING] /create-run failed', res.status);
          return;
        }
        const data = await res.json();
        setAttemptId(data.attemptId ?? null);

        if (typeof data.durationSeconds === 'number') {
          setTotalSeconds(data.durationSeconds);
          setRemaining(data.durationSeconds);
        }

        if (Array.isArray(data.answers)) {
          const map: AnswerMap = {};
          for (const a of data.answers as {
            questionId: string;
            value: string;
          }[]) {
            map[a.questionId] = a.value;
          }
          setAnswers(map);
        }
      } catch (err) {
        console.error('[LISTENING] create-run error', err);
      }
    };

    void createRun();
  }, [test.slug]);

  // timer
  React.useEffect(() => {
    if (!examStarted || finished) return;
    if (remaining <= 0) {
      setFinished(true);
      void handleSubmit(true);
      return;
    }

    const id = window.setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examStarted, remaining, finished]);

  // audio time → section tracking
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const t = audio.currentTime;
      setAudioTime(t);

      const currentMs = t * 1000;

      const currentSection = sections.find((s, idx) => {
        const start = s.start_ms ?? 0;
        const end =
          s.end_ms ??
          sections[idx + 1]?.start_ms ??
          Number.MAX_SAFE_INTEGER;
        return currentMs >= start && currentMs < end;
      });

      if (currentSection) {
        if (currentSection.order_no !== activeSection) {
          setActiveSection(currentSection.order_no);
        }
        setMaxSectionReached((prev) =>
          currentSection.order_no > prev ? currentSection.order_no : prev,
        );
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [sections, activeSection]);

  const questionsBySection = React.useMemo(() => {
    const list = questions ?? [];
    return list.reduce<Record<number, ListeningQuestion[]>>((acc, q) => {
      const key = q.section_no ?? 0;
      if (!acc[key]) acc[key] = [];
      acc[key].push(q);
      return acc;
    }, {});
  }, [questions]);

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    if (!attemptId) return;
    void fetch('/api/mock/listening/save-answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attemptId,
        answers: [{ questionId, value }],
      }),
    }).catch((err) => {
      console.error('[LISTENING] save-answers failed', err);
    });
  };

  const LOCK_GRACE_SECONDS = 5;

  const isQuestionLocked = (q: ListeningQuestion) => {
    if (!examStarted) return false;
    if (finished) return true;
    return audioTime > q.timestamp + LOCK_GRACE_SECONDS;
  };

  const handleStartExam = async () => {
    if (examStarted) return;
    if (!test.audio_url) {
      console.error('[LISTENING] No audio_url on test – cannot start');
      return;
    }

    if (attemptId) {
      void fetch('/api/mock/listening/play-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId }),
      }).catch((err) => {
        console.error('[LISTENING] play-ping failed', err);
      });
    }

    setExamStarted(true);
    setRemaining(totalSeconds);

    const audio = audioRef.current;
    if (audio) {
      try {
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch((err) => {
            console.error('[LISTENING] audio.play() failed', err);
          });
        }
      } catch (err) {
        console.error('[LISTENING] audio.play() threw', err);
      }
    }
  };

  const computeScoreClientSide = () => {
    let raw = 0;
    const total = questions.length;

    for (const q of questions) {
      const userValue = answers[q.id];
      if (!userValue) continue;

      let correctStr: string | null = null;
      const ca = q.correct_answer as unknown;

      if (Array.isArray(ca) && ca.length > 0) {
        correctStr = String(ca[0]);
      } else if (typeof ca === 'string') {
        correctStr = ca;
      } else if (ca && typeof ca === 'object' && 'value' in (ca as any)) {
        correctStr = String((ca as any).value);
      }

      if (!correctStr) continue;

      if (normalizeAnswer(userValue) === normalizeAnswer(correctStr)) {
        raw += 1;
      }
    }

    const band = mapRawToBand(raw, total);
    return { raw, total, band };
  };

  const handleSubmit = async (auto = false) => {
    if (finished && !auto) return;
    setFinished(true);
    setIsSubmitting(true);

    // always show at least client-side result
    const clientScore = computeScoreClientSide();
    setResult({
      raw_score: clientScore.raw,
      total_questions: clientScore.total,
      band_score: clientScore.band,
    });

    if (attemptId) {
      try {
        const payload = {
          attemptId,
          answers: Object.entries(answers).map(([questionId, value]) => ({
            questionId,
            value,
          })),
        };

        const res = await fetch('/api/mock/listening/submit-final', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          console.error('[LISTENING] submit-final failed', res.status);
        } else {
          const data = await res.json();
          setResult({
            raw_score: data.raw_score,
            total_questions: data.total_questions,
            band_score: data.band_score,
          });
        }
      } catch (err) {
        console.error('[LISTENING] submit-final error', err);
      }
    }

    setIsSubmitting(false);
  };

  const currentSectionQuestions = questionsBySection[activeSection] ?? [];

  const handlePrevSection = () => {
    setActiveSection((prev) => {
      const next = prev - 1;
      if (!sections.find((s) => s.order_no === next)) return prev;
      return next;
    });
  };

  const handleNextSection = () => {
    setActiveSection((prev) => {
      const next = prev + 1;
      if (next > maxSectionReached) return prev;
      if (!sections.find((s) => s.order_no === next)) return prev;
      return next;
    });
  };

  return (
    <>
      <Head>
        <title>{test.title} · IELTS Listening Mock · GramorX</title>
      </Head>

      <main className="min-h-screen bg-background text-foreground">
        {/* top exam header */}
        <header className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-2 text-xs sm:text-sm">
          <div className="flex items-center gap-3">
            <span className="font-semibold tracking-wide">IELTS</span>
            <span className="h-4 w-px bg-border" />
            <span className="text-muted-foreground">Computer-based test</span>
            <span className="h-4 w-px bg-border" />
            <span className="text-muted-foreground">Listening</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              Candidate No:{' '}
              <span className="font-mono text-foreground">
                {candidateLabel}
              </span>
            </span>
            <span className="rounded bg-foreground px-3 py-1 font-mono text-xs text-background">
              {formatClock(remaining)}
            </span>
          </div>
        </header>

        <Container className="py-4">
          {/* AUDIO */}
          <section className="mb-4 rounded border border-border bg-card px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Icon
                    name="Headphones"
                    className="h-4 w-4 text-primary"
                  />
                  <span className="font-medium text-foreground">
                    Listening Test Audio
                  </span>
                  {examStarted ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                      In progress
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      Click &quot;Begin test&quot; to start the exam audio.
                    </span>
                  )}
                </div>

                <span className="max-w-full truncate text-[10px] text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    audio_url:
                  </span>{' '}
                  {test.audio_url ?? (
                    <span className="text-destructive">NULL / missing</span>
                  )}
                </span>

                {test.audio_url && (
                  <a
                    href={test.audio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-primary underline underline-offset-2"
                  >
                    Open audio in new tab (debug)
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!examStarted && (
                  <Button
                    size="sm"
                    disabled={!test.audio_url || isSubmitting}
                    onClick={handleStartExam}
                  >
                    Begin test
                  </Button>
                )}
                {examStarted && !finished && (
                  <span className="text-[11px] text-muted-foreground">
                    Test running…
                  </span>
                )}
                {finished && (
                  <span className="text-[11px] text-muted-foreground">
                    Test finished.
                  </span>
                )}
              </div>
            </div>

            <audio
              key={test.audio_url ?? 'no-audio'}
              ref={audioRef}
              controls
              playsInline
              onPlay={() => {
                console.log('[LISTENING] audio started', test.audio_url);
              }}
              onError={(e) => {
                const el = e.currentTarget;
                console.error('[LISTENING] audio error', {
                  src: el.currentSrc,
                  error: el.error,
                });
              }}
            >
              {test.audio_url && (
                <source src={test.audio_url} type="audio/mpeg" />
              )}
              Your browser does not support the audio element.
            </audio>
          </section>

          {/* MAIN LAYOUT */}
          <section className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,1.4fr)]">
            {/* Question area */}
            <div className="rounded border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    Section {activeSection}
                  </span>
                  <span className="text-muted-foreground">
                    Questions{' '}
                    {currentSectionQuestions[0]?.question_number ?? '–'}–
                    {currentSectionQuestions.length
                      ? currentSectionQuestions[
                          currentSectionQuestions.length - 1
                        ].question_number
                      : '–'}
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Once the recording moves on, earlier answers are locked.
                </span>
              </div>

              <div className="max-h-[70vh] space-y-0.5 overflow-y-auto px-4 py-3 text-sm">
                {currentSectionQuestions.map((q) => {
                  const value = answers[q.id] ?? '';
                  const locked = isQuestionLocked(q);
                  const optionsArray =
                    Array.isArray(q.options) && q.options.length > 0
                      ? (q.options as string[])
                      : null;

                  return (
                    <div
                      key={q.id}
                      className="border-b border-border pb-3 pt-2 last:border-b-0"
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 min-w-[32px] text-xs font-mono text-muted-foreground">
                          Q{q.question_number}
                        </span>
                        <div>
                          <p className="text-[13px] text-foreground">
                            {q.question_text}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            Answer at about {Math.round(q.timestamp)} seconds.
                            {locked && (
                              <span className="ml-2 font-medium text-destructive">
                                (Locked)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="mt-2 pl-[32px]">
                        {optionsArray ? (
                          <div className="space-y-1">
                            {optionsArray.map((opt, idx) => {
                              const checked = value === opt;
                              const letter = String.fromCharCode(65 + idx);
                              return (
                                <label
                                  key={idx}
                                  className={[
                                    'flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1 text-[12px]',
                                    locked
                                      ? 'border-border bg-muted text-muted-foreground'
                                      : checked
                                      ? 'border-primary bg-primary/10 text-primary'
                                      : 'border-border bg-background hover:border-muted-foreground',
                                  ].join(' ')}
                                >
                                  <input
                                    type="radio"
                                    name={q.id}
                                    className="h-3 w-3"
                                    disabled={locked}
                                    checked={checked}
                                    onChange={() =>
                                      handleAnswerChange(q.id, opt)
                                    }
                                  />
                                  <span className="font-mono text-[11px] text-muted-foreground">
                                    {letter}.
                                  </span>
                                  <span>{opt}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <input
                            type="text"
                            disabled={locked}
                            className={[
                              'w-full rounded border px-2 py-1 text-[12px] outline-none',
                              locked
                                ? 'border-border bg-muted text-muted-foreground'
                                : 'border-input bg-background focus:border-primary',
                            ].join(' ')}
                            placeholder={
                              locked ? 'Answer locked' : 'Type your answer'
                            }
                            value={value}
                            onChange={(e) =>
                              handleAnswerChange(q.id, e.target.value)
                            }
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                {currentSectionQuestions.length === 0 && (
                  <p className="py-6 text-center text-xs text-muted-foreground">
                    No questions for this section.
                  </p>
                )}
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Sections overview */}
              <div className="rounded border border-border bg-card px-4 py-3 text-xs">
                <div className="mb-2 flex items-center justify-between">
                  <p className="font-semibold text-foreground">
                    Sections overview
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={handlePrevSection}
                    >
                      Prev
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={handleNextSection}
                    >
                      Next
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sections.map((sec) => {
                    const isActive = sec.order_no === activeSection;
                    const isUnlocked = sec.order_no <= maxSectionReached;
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => {
                          if (!isUnlocked) return;
                          setActiveSection(sec.order_no);
                        }}
                        className={[
                          'flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-medium',
                          isActive
                            ? 'border-primary bg-primary/10 text-primary'
                            : isUnlocked
                            ? 'border-border bg-muted text-muted-foreground hover:border-muted-foreground'
                            : 'border-border bg-muted text-muted-foreground/70',
                        ].join(' ')}
                      >
                        {sec.order_no}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Sections change automatically as the recording continues. You
                  can move back within unlocked sections.
                </p>
              </div>

              {/* Instructions */}
              <div className="rounded border border-border bg-card px-4 py-3 text-xs">
                <p className="mb-2 font-semibold text-foreground">
                  Instructions
                </p>
                <ul className="list-disc space-y-1 pl-4 text-[11px] text-muted-foreground">
                  <li>Write no more than the stated word/number limit.</li>
                  <li>Spelling must be correct to get the mark.</li>
                  <li>
                    Once the recording moves on, earlier answers will be locked.
                  </li>
                  <li>
                    When time is over, your answers are submitted automatically.
                  </li>
                </ul>
              </div>

              {/* Finish */}
              <div className="rounded border border-border bg-card px-4 py-3 text-xs">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    Finish Listening
                  </span>
                  {result && (
                    <span className="rounded bg-muted px-2 py-1 font-mono text-[11px] text-foreground">
                      {result.raw_score}/{result.total_questions}{' '}
                      {typeof result.band_score === 'number' &&
                        `(Band ${result.band_score.toFixed(1)})`}
                    </span>
                  )}
                </div>

                <p className="mb-3 text-[11px] text-muted-foreground">
                  Click &quot;Submit listening&quot; when you&apos;re done. Your
                  score will appear here. We&apos;ll also try to save it to your
                  account.
                </p>

                <div className="flex items-center justify-between gap-2">
                  <Link
                    href="/mock/listening"
                    className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Exit to mock dashboard
                  </Link>
                  <Button
                    size="sm"
                    disabled={isSubmitting || finished}
                    onClick={() => void handleSubmit(false)}
                  >
                    {isSubmitting ? 'Submitting…' : 'Submit listening'}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </Container>
      </main>
    </>
  );
};

export default ListeningRunPage;
