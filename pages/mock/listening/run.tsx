// pages/mock/listening/run.tsx
import React, { useEffect, useRef, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { MockExamLayout } from '@/components/mock/MockExamLayout';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

// ----------------------
// Types matching your API
// ----------------------

type ListeningQuestionMCQ = {
  type: 'mcq';
  qno: number;
  prompt: string;
  options: string[];
};

type ListeningQuestionGap = {
  type: 'gap';
  qno: number;
  prompt: string;
};

type ListeningQuestionMatch = {
  type: 'match';
  qno: number;
  prompt: string;
  left: string[];
  right: string[];
};

type ListeningQuestion =
  | ListeningQuestionMCQ
  | ListeningQuestionGap
  | ListeningQuestionMatch;

type ListeningSectionAPI = {
  order: number;
  startMs: number;
  endMs: number;
  transcript?: string | null;
};

type ListeningTestAPI = {
  slug: string;
  title: string;
  audioUrl: string;
  sections: ListeningSectionAPI[];
  questions: ListeningQuestion[];
};

// UI shape used by the page
type UIPaperSection = ListeningSectionAPI & {
  id: string;
  title: string;
  questions: ListeningQuestion[];
};

type UIPaper = {
  slug: string;
  title: string;
  audioUrl: string;
  sections: UIPaperSection[];
  totalQuestions: number;
};

type AnswerMap = Record<number, string>; // key = qno
type SubmitResponse = { attemptId: string; score: number; band: number; sectionScores: any };

// ----------------------
// Page
// ----------------------

const ListeningRunPage: NextPage = () => {
  const router = useRouter();

  // slug can come as ?slug= , ?id= , or dynamic route later
  const slugParam =
    (router.query.slug as string | undefined) ||
    (router.query.id as string | undefined) ||
    null;

  const [loading, setLoading] = useState(true);
  const [paper, setPaper] = useState<UIPaper | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<AnswerMap>({});
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // 1) Load test from your API
  useEffect(() => {
    if (!slugParam) {
      setError(
        'Missing test slug. Open this mock from the Listening mock home page.',
      );
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Uses your existing API route: /api/listening/test/[slug]
        const res = await fetch(
          `/api/listening/test/${encodeURIComponent(slugParam)}`,
        );
        if (!res.ok) {
          throw new Error('Failed to load listening test');
        }

        const apiData = (await res.json()) as ListeningTestAPI;
        if (cancelled) return;

        const uiPaper = buildPaperFromApi(apiData);
        setPaper(uiPaper);
        setAnswers({});
        setActiveSectionIndex(0);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError(
            'Unable to load listening test. Try again from the mock home page or contact support.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slugParam]);

  // 2) Audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setAudioTime(audio.currentTime || 0);
      setAudioDuration(audio.duration || 0);
    };

    const handlePlay = () => setAudioPlaying(true);
    const handlePause = () => setAudioPlaying(false);
    const handleEnded = () => setAudioPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [paper?.audioUrl]);

  // 3) Handlers

  function handleAudioToggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  }

  function handleAudioSeek(percent: number) {
    const audio = audioRef.current;
    if (!audio || !audioDuration) return;
    const nextTime = (percent / 100) * audioDuration;
    audio.currentTime = nextTime;
  }

  function handleAnswerChange(qno: number, value: string) {
    setAnswers((prev) => ({
      ...prev,
      [qno]: value,
    }));
  }

  async function handleSubmitMock() {
    if (!paper) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const allQuestions = paper.sections.flatMap((s) => s.questions);
      const payloadAnswers = allQuestions
        .map((q) => ({
          qno: q.qno,
          answer: answers[q.qno] ?? '',
        }))
        // If user left everything blank, we still send; backend will handle
        .filter((entry) => entry.qno != null);

      const res = await fetch('/api/listening/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_slug: paper.slug,
          answers: payloadAnswers,
          meta: {
            client: 'gramorx-listening-cbe',
            startedAt: null, // you can add real timing later
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Submission failed');
      }

      const json = (await res.json()) as SubmitResponse;

      router.push(
        `/mock/listening/submitted?attemptId=${encodeURIComponent(
          json.attemptId,
        )}`,
      );
    } catch (err) {
      console.error(err);
      setSubmitError(
        'Submission failed. Internet dropped or server broke. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  // 4) Render inner content (inside MockExamLayout)
  function renderBody() {
    if (loading) {
      return (
        <Card className="rounded-ds-3xl p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 animate-pulse items-center justify-center rounded-full bg-primary/10">
              <Icon name="Loader2" className="h-4 w-4 animate-spin" />
            </span>
            <div>
              <p className="text-sm font-medium">Loading your mock...</p>
              <p className="text-xs text-muted-foreground">
                Don’t refresh. We’re wiring your exam workspace.
              </p>
            </div>
          </div>
        </Card>
      );
    }

    if (error || !paper) {
      return (
        <Card className="rounded-ds-3xl border-red-500/40 bg-red-950/40 p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20">
              <Icon name="TriangleAlert" className="h-4 w-4 text-red-400" />
            </span>
            <div>
              <p className="text-sm font-semibold text-red-50">
                Can’t load this mock.
              </p>
              <p className="mt-1 text-xs text-red-100/80">
                {error ??
                  'Something is off. Open the mock again from the main mock page or ping support.'}
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="rounded-ds-2xl"
                  onClick={() => router.push('/mock')}
                >
                  Back to mocks
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-ds-2xl"
                  onClick={() => router.reload()}
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    const activeSection = paper.sections[activeSectionIndex];

    return (
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.1fr)]">
        {/* LEFT: Audio + sections */}
        <div className="space-y-4">
          {/* Audio control */}
          <Card className="rounded-ds-3xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                  <Icon name="Headphones" className="h-4 w-4 text-primary" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                    AUDIO
                  </p>
                  <p className="text-sm font-semibold">{paper.title}</p>
                </div>
              </div>
              <Badge tone="neutral" size="xs">
                {paper.totalQuestions} questions
              </Badge>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="rounded-full px-4"
                onClick={handleAudioToggle}
              >
                <Icon
                  name={audioPlaying ? 'Pause' : 'Play'}
                  className="mr-1.5 h-4 w-4"
                />
                {audioPlaying ? 'Pause audio' : 'Play audio'}
              </Button>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={audioDuration ? (audioTime / audioDuration) * 100 : 0}
                    onChange={(e) =>
                      handleAudioSeek(Number(e.target.value) || 0)
                    }
                    className="w-full cursor-pointer"
                  />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>{formatTime(audioTime)}</span>
                  <span>-{formatTime(Math.max(audioDuration - audioTime, 0))}</span>
                </div>
              </div>
            </div>

            <audio
              ref={audioRef}
              src={paper.audioUrl}
              preload="auto"
              className="hidden"
            />
          </Card>

          {/* Section selector */}
          <Card className="rounded-ds-3xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  SECTIONS
                </p>
                <p className="text-sm font-semibold">
                  {activeSection?.title ?? 'Section'}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Question range:{' '}
                <span className="font-mono">
                  {sectionQuestionRange(activeSection)}
                </span>
              </p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {paper.sections.map((section, index) => {
                const isActive = index === activeSectionIndex;
                return (
                  <button
                    key={section.id}
                    type="button"
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition ${
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted bg-muted/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                    onClick={() => setActiveSectionIndex(index)}
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-black/10 text-[10px]">
                      {index + 1}
                    </span>
                    {section.title}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* RIGHT: Questions of active section */}
        <Card className="rounded-ds-3xl p-4 lg:p-5">
          {activeSection ? (
            <div className="flex flex-col gap-3">
              {activeSection.transcript && (
                <div className="rounded-ds-2xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  {activeSection.transcript}
                </div>
              )}

              <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
                {activeSection.questions.map((q) => {
                  const currentValue = answers[q.qno] ?? '';

                  if (q.type === 'mcq') {
                    return (
                      <div
                        key={q.qno}
                        className="rounded-ds-2xl border border-muted bg-background/80 px-3 py-2.5 text-xs"
                      >
                        <p className="mb-1.5 font-medium">
                          {q.qno}. {q.prompt}
                        </p>
                        <div className="mt-1 space-y-1">
                          {q.options.map((opt, idx) => {
                            const value = String.fromCharCode(65 + idx); // A/B/C...
                            return (
                              <label
                                key={value}
                                className="flex cursor-pointer items-center gap-2 rounded-ds-xl px-2 py-1 hover:bg-muted/80"
                              >
                                <input
                                  type="radio"
                                  className="h-3 w-3"
                                  name={`q-${q.qno}`}
                                  value={value}
                                  checked={currentValue === value}
                                  onChange={(e) =>
                                    handleAnswerChange(
                                      q.qno,
                                      e.target.value || '',
                                    )
                                  }
                                />
                                <span className="font-mono text-[11px]">
                                  {value}.
                                </span>
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  if (q.type === 'match') {
                    return (
                      <div
                        key={q.qno}
                        className="rounded-ds-2xl border border-muted bg-background/80 px-3 py-2.5 text-xs"
                      >
                        <p className="mb-1.5 font-medium">
                          {q.qno}. {q.prompt}
                        </p>
                        <div className="mb-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                          <div>
                            <p className="font-semibold mb-1">Left</p>
                            <ul className="space-y-0.5">
                              {q.left.map((item, idx) => (
                                <li key={idx}>
                                  {String.fromCharCode(65 + idx)}. {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="font-semibold mb-1">Right</p>
                            <ul className="space-y-0.5">
                              {q.right.map((item, idx) => (
                                <li key={idx}>
                                  {idx + 1}. {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={currentValue}
                          onChange={(e) =>
                            handleAnswerChange(q.qno, e.target.value)
                          }
                          className="w-full rounded-ds-xl border border-muted bg-background px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
                          placeholder="Type matches, e.g. A-1, B-3, C-2"
                        />
                      </div>
                    );
                  }

                  // gap / short answer
                  return (
                    <div
                      key={q.qno}
                      className="rounded-ds-2xl border border-muted bg-background/80 px-3 py-2.5 text-xs"
                    >
                      <p className="mb-1.5 font-medium">
                        {q.qno}. {q.prompt}
                      </p>
                      <input
                        type="text"
                        value={currentValue}
                        onChange={(e) =>
                          handleAnswerChange(q.qno, e.target.value)
                        }
                        className="mt-1 w-full rounded-ds-xl border border-muted bg-background px-2 py-1 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
                        placeholder="Type your answer"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[11px] text-muted-foreground">
                  Answers stay on this device until you submit.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="rounded-ds-2xl px-3 text-[11px]"
                    disabled={activeSectionIndex >= paper.sections.length - 1}
                    onClick={() => {
                      if (activeSectionIndex < paper.sections.length - 1) {
                        setActiveSectionIndex(activeSectionIndex + 1);
                      }
                    }}
                  >
                    Next section
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    className="rounded-ds-2xl px-4 text-[11px]"
                    disabled={submitting}
                    onClick={handleSubmitMock}
                  >
                    {submitting ? (
                      <>
                        <Icon
                          name="Loader2"
                          className="mr-1.5 h-3.5 w-3.5 animate-spin"
                        />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Icon name="Send" className="mr-1.5 h-3.5 w-3.5" />
                        Submit mock
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {submitError && (
                <p className="mt-2 text-[11px] text-red-500">{submitError}</p>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              No section found in this test. Check listening_sections config.
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Listening Mock • GramorX</title>
        <meta
          name="description"
          content="Exact IELTS-style computer-based listening mock."
        />
      </Head>
      <MockExamLayout examTitle="Full Mock Test" moduleName="Listening">
        {renderBody()}
      </MockExamLayout>
    </>
  );
};

export default ListeningRunPage;

// ----------------------
// Helpers
// ----------------------

function buildPaperFromApi(api: ListeningTestAPI): UIPaper {
  const sections = [...(api.sections ?? [])].sort((a, b) => a.order - b.order);
  const questions = [...(api.questions ?? [])].sort(
    (a, b) => a.qno - b.qno,
  ) as ListeningQuestion[];

  if (!sections.length) {
    return {
      slug: api.slug,
      title: api.title,
      audioUrl: api.audioUrl,
      totalQuestions: questions.length,
      sections: [
        {
          id: 'section-1',
          order: 1,
          title: 'All questions',
          startMs: 0,
          endMs: 0,
          transcript: null,
          questions,
        },
      ],
    };
  }

  // Distribute questions roughly evenly across sections (IELTS style: 40 / 4 = 10 each)
  const total = questions.length;
  const basePerSection = Math.floor(total / sections.length);
  const remainder = total % sections.length;

  let idx = 0;
  const uiSections: UIPaperSection[] = sections.map((sec, secIndex) => {
    const count = basePerSection + (secIndex < remainder ? 1 : 0);
    const qs = questions.slice(idx, idx + count);
    idx += count;

    const title = `Section ${secIndex + 1}`;
    return {
      id: `section-${secIndex + 1}`,
      title,
      order: sec.order,
      startMs: sec.startMs,
      endMs: sec.endMs,
      transcript: sec.transcript ?? null,
      questions: qs,
    };
  });

  return {
    slug: api.slug,
    title: api.title,
    audioUrl: api.audioUrl,
    totalQuestions: questions.length,
    sections: uiSections,
  };
}

function formatTime(seconds: number): string {
  const s = Math.floor(seconds);
  const mm = Math.floor(s / 60)
    .toString()
    .padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function sectionQuestionRange(section?: UIPaperSection | null): string {
  if (!section || !section.questions.length) return '--';
  const nums = section.questions.map((q) => q.qno).sort((a, b) => a - b);
  return `${nums[0]}–${nums[nums.length - 1]}`;
}
