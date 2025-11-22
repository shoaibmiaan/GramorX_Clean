// pages/listening/game/challenge.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Alert } from '@/components/design-system/Alert';
import Icon from '@/components/design-system/Icon';

import ListeningNavTabs from '@/components/listening/ListeningNavTabs';
import ListeningInfoBanner from '@/components/listening/ListeningInfoBanner';

type GameMode = 'speed' | 'spelling' | 'noback';

type ChallengeQuestion = {
  id: string;
  prompt: string;
  helper?: string;
  correctAnswer: string;
};

type Props = {
  mode: GameMode;
};

const MODE_CONFIG: Record<
  GameMode,
  {
    title: string;
    description: string;
    durationSeconds: number;
  }
> = {
  speed: {
    title: 'Speed accuracy drill',
    description:
      'Answer as many questions as you can before the timer hits zero. No overthinking, just clean listening logic.',
    durationSeconds: 90,
  },
  spelling: {
    title: 'Spelling sniper',
    description:
      'Focus on spelling and details. Tiny mistakes will cost you – just like on real IELTS answer sheets.',
    durationSeconds: 120,
  },
  noback: {
    title: 'No-back-button drill',
    description:
      'You answer once and move on. No review, no “let me just double check”. Learn to commit under pressure.',
    durationSeconds: 90,
  },
};

const SAMPLE_QUESTIONS: Record<GameMode, ChallengeQuestion[]> = {
  speed: [
    {
      id: 'q1',
      prompt: 'What time does the lecture start?',
      helper: 'You hear “quarter past nine”.',
      correctAnswer: '9:15',
    },
    {
      id: 'q2',
      prompt: 'Which building is the registration office?',
      helper: 'It is in “Building C”.',
      correctAnswer: 'Building C',
    },
    {
      id: 'q3',
      prompt: 'How many weeks will the course last?',
      helper: 'They say “a 6-week intensive program”.',
      correctAnswer: '6',
    },
  ],
  spelling: [
    {
      id: 'q4',
      prompt: 'Write the surname the speaker spells out.',
      helper: 'You hear: “That’s H-A-R-P-E-R”.',
      correctAnswer: 'Harper',
    },
    {
      id: 'q5',
      prompt: 'Write the name of the street.',
      helper: 'You hear: “Baker Street”.',
      correctAnswer: 'Baker Street',
    },
    {
      id: 'q6',
      prompt: 'Write the email domain the speaker mentions.',
      helper: 'You hear: “... at student-college dot org”.',
      correctAnswer: 'student-college.org',
    },
  ],
  noback: [
    {
      id: 'q7',
      prompt: 'Which room will the seminar take place in?',
      helper: 'You hear: “Room 204 in the science block”.',
      correctAnswer: 'Room 204',
    },
    {
      id: 'q8',
      prompt: 'What colour card do students need to show?',
      helper: 'You hear: “Please have your blue ID card ready”.',
      correctAnswer: 'blue',
    },
    {
      id: 'q9',
      prompt: 'What is the maximum number of books students can borrow?',
      helper: 'You hear: “up to 8 books at a time”.',
      correctAnswer: '8',
    },
  ],
};

type GameState = 'ready' | 'running' | 'finished';

type LocalAnswer = {
  questionId: string;
  value: string;
  isCorrect: boolean;
};

const ListeningGameChallengePage: NextPage<Props> = ({ mode }) => {
  const router = useRouter();
  const [state, setState] = React.useState<GameState>('ready');
  const [timeLeft, setTimeLeft] = React.useState(
    MODE_CONFIG[mode].durationSeconds,
  );
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [inputValue, setInputValue] = React.useState('');
  const [answers, setAnswers] = React.useState<LocalAnswer[]>([]);

  const questions = SAMPLE_QUESTIONS[mode];

  // timer
  React.useEffect(() => {
    if (state !== 'running') return;

    if (timeLeft <= 0) {
      setState('finished');
      return;
    }

    const id = window.setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearTimeout(id);
  }, [state, timeLeft]);

  const handleStart = () => {
    if (state !== 'ready') return;
    setState('running');
  };

  const handleSubmitAnswer = () => {
    if (state !== 'running') return;
    const q = questions[currentIndex];
    if (!q) return;

    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const isCorrect =
      trimmed.toLowerCase() === q.correctAnswer.trim().toLowerCase();

    setAnswers((prev) => {
      const existing = prev.filter((a) => a.questionId !== q.id);
      return [
        ...existing,
        {
          questionId: q.id,
          value: trimmed,
          isCorrect,
        },
      ];
    });

    setInputValue('');

    // for noback mode, move on and never come back
    if (mode === 'noback') {
      if (currentIndex + 1 >= questions.length) {
        setState('finished');
        return;
      }
      setCurrentIndex((idx) => idx + 1);
      return;
    }

    // for other modes, allow cycling through questions
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((idx) => idx + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const correctCount = answers.filter((a) => a.isCorrect).length;

  const handleRestart = () => {
    setState('ready');
    setTimeLeft(MODE_CONFIG[mode].durationSeconds);
    setCurrentIndex(0);
    setInputValue('');
    setAnswers([]);
  };

  const config = MODE_CONFIG[mode];
  const currentQuestion = questions[currentIndex];

  const titleByMode: Record<GameMode, string> = {
    speed: 'Speed round challenge',
    spelling: 'Spelling sniper challenge',
    noback: 'No-back-button challenge',
  };

  return (
    <>
      <Head>
        <title>{titleByMode[mode]} • Listening Game • GramorX</title>
        <meta
          name="description"
          content="Fast-paced IELTS Listening mini-drill to sharpen your focus and accuracy."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline" size="xs">
                <Link href="/listening/game">
                  <Icon name="ArrowLeft" size={12} />
                  <span>Back to game hub</span>
                </Link>
              </Button>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                <Icon name="Gamepad" size={12} />
                <span>Listening game</span>
              </span>
            </div>
            <ListeningNavTabs activeKey="game" />
          </div>

          <section className="mb-4">
            <ListeningInfoBanner
              variant="warning"
              title="Treat this like a sprint, not a marathon"
              body="The goal is not to stay comfortable. Push your focus hard for a short time, then rest."
            />
          </section>

          <section className="mb-4">
            <Card className="border-border bg-card/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    {config.title}
                  </p>
                  <p className="mt-1 text-sm text-foreground sm:text-base">
                    {config.description}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs sm:text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Icon name="Clock" size={14} className="text-primary" />
                    <span>{config.durationSeconds} seconds</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Icon name="CheckCircle" size={14} className="text-primary" />
                    <span>{questions.length} questions</span>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          <section className="space-y-4">
            {/* Timer + score */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Card className="border-border bg-card/60 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Time left
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {timeLeft}s
                </p>
              </Card>
              <Card className="border-border bg-card/60 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Correct answers
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {correctCount}
                </p>
              </Card>
              <Card className="border-border bg-card/60 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  State
                </p>
                <p className="mt-1 text-2xl font-semibold text-foreground capitalize">
                  {state}
                </p>
              </Card>
            </div>

            {/* Game content */}
            {state === 'ready' && (
              <div className="space-y-3">
                <Alert variant="info">
                  <div className="flex items-start gap-2">
                    <Icon name="Info" size={16} className="mt-0.5 text-primary" />
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      When you hit <strong>Start</strong>, the timer starts immediately. Answer as
                      clean and fast as you can. Don&apos;t panic about perfection – this is training.
                    </p>
                  </div>
                </Alert>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleStart}
                  className="inline-flex items-center gap-2"
                >
                  <Icon name="PlayCircle" size={16} />
                  <span>Start challenge</span>
                </Button>
              </div>
            )}

            {state === 'running' && currentQuestion && (
              <Card className="border-border bg-card/60 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Question {currentIndex + 1} of {questions.length}
                  </p>
                  {mode === 'noback' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-medium text-danger">
                      <Icon name="EyeOff" size={12} />
                      <span>No-back mode</span>
                    </span>
                  )}
                </div>
                <p className="mb-2 text-sm font-medium text-foreground sm:text-base">
                  {currentQuestion.prompt}
                </p>
                {currentQuestion.helper && (
                  <p className="mb-3 text-xs text-muted-foreground sm:text-sm">
                    Hint: {currentQuestion.helper}
                  </p>
                )}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your answer..."
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => router.push('/listening/game')}
                    >
                      <Icon name="X" size={14} />
                      <span>End early</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSubmitAnswer}
                      disabled={!inputValue.trim()}
                    >
                      <Icon name="ArrowRightCircle" size={14} />
                      <span>Submit answer</span>
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {state === 'finished' && (
              <div className="space-y-3">
                <Card className="border-border bg-card/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                        Challenge finished
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground sm:text-base">
                        You got {correctCount} / {questions.length} correct.
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                        Don&apos;t just flex the score. Look at what type of slip each wrong answer was
                        – spelling? mishearing numbers? not reading the hint properly?
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleRestart}
                      >
                        <Icon name="RotateCcw" size={14} />
                        <span>Play again</span>
                      </Button>
                      <Button asChild size="sm">
                        <Link href="/listening/game">
                          <Icon name="Gamepad" size={14} />
                          <span>Back to game hub</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>

                <Card className="border-border bg-card/60 p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Your answers
                  </p>
                  <div className="space-y-2 text-xs sm:text-sm">
                    {questions.map((q) => {
                      const ans = answers.find(
                        (a) => a.questionId === q.id,
                      );
                      const status = ans?.isCorrect ? 'Correct' : 'Wrong';

                      return (
                        <div
                          key={q.id}
                          className="flex flex-col gap-1 rounded-md border border-border/60 bg-background px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-medium text-foreground sm:text-sm">
                              {q.prompt}
                            </p>
                            <span
                              className={[
                                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                                ans?.isCorrect
                                  ? 'bg-success/10 text-success'
                                  : 'bg-danger/10 text-danger',
                              ].join(' ')}
                            >
                              <Icon
                                name={
                                  ans?.isCorrect
                                    ? 'CheckCircle'
                                    : 'XCircle'
                                }
                                size={11}
                              />
                              <span>{status}</span>
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            Your answer:{' '}
                            <span className="text-foreground">
                              {ans ? ans.value : '—'}
                            </span>
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            Correct answer:{' '}
                            <span className="text-foreground">
                              {q.correctAnswer}
                            </span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            )}
          </section>
        </Container>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);

  const modeParam = (ctx.query.mode as string | undefined) ?? 'speed';
  const allowed: GameMode[] = ['speed', 'spelling', 'noback'];
  const mode = (allowed.includes(modeParam as GameMode)
    ? modeParam
    : 'speed') as GameMode;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return {
      props: {
        mode,
      },
    };
  }

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(
          `/listening/game/challenge?mode=${mode}`,
        )}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      mode,
    },
  };
};

export default ListeningGameChallengePage;
