// pages/mock/listening/drill/section/[sectionNo].tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { Icon } from '@/components/design-system/Icon';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type DrillQuestionType = 'mcq' | 'short';

type DrillQuestion = {
  id: string;
  number: number;
  type: DrillQuestionType;
  prompt: string;
  options?: string[];
  correctAnswer: string; // case-insensitive compare
};

type PageProps = {
  sectionNumber: number;
  sectionLabel: string;
  sectionTagline: string;
  estTime: string;
  difficulty: string;
  questions: DrillQuestion[];
};

// -----------------------------------------------------------------------------
// TEMP MOCK DATA – USED AS FALLBACK
// -----------------------------------------------------------------------------

function buildMockQuestionsForSection(sectionNumber: number): DrillQuestion[] {
  switch (sectionNumber) {
    case 1:
      return [
        {
          id: 's1-q1',
          number: 1,
          type: 'short',
          prompt:
            "You hear a conversation about booking a taxi.\n\nWhat is the passenger's FLIGHT NUMBER?",
          correctAnswer: 'GX512',
        },
        {
          id: 's1-q2',
          number: 2,
          type: 'mcq',
          prompt: 'Where will the taxi pick the passenger up?',
          options: ['At the hotel', 'At the train station', 'At the airport', 'At home'],
          correctAnswer: 'At the hotel',
        },
        {
          id: 's1-q3',
          number: 3,
          type: 'short',
          prompt:
            'What TIME does the taxi need to arrive? (Write the time in numbers, e.g. 7:30)',
          correctAnswer: '7:30',
        },
      ];
    case 2:
      return [
        {
          id: 's2-q1',
          number: 1,
          type: 'mcq',
          prompt:
            'The announcement is mainly about changes to which part of the campus?',
          options: ['Library', 'Sports centre', 'Cafeteria', 'Car park'],
          correctAnswer: 'Sports centre',
        },
        {
          id: 's2-q2',
          number: 2,
          type: 'short',
          prompt: 'What DAY will the new opening hours start?',
          correctAnswer: 'Monday',
        },
        {
          id: 's2-q3',
          number: 3,
          type: 'mcq',
          prompt: 'What should students bring to get the discount?',
          options: ['Student ID card', 'Email confirmation', 'Passport', 'Library card'],
          correctAnswer: 'Student ID card',
        },
      ];
    case 3:
      return [
        {
          id: 's3-q1',
          number: 1,
          type: 'mcq',
          prompt:
            'What is the MAIN problem the students have with the project deadline?',
          options: [
            'Too close to exam week',
            'Group members live far away',
            'They lack access to data',
            'Tutor is unavailable',
          ],
          correctAnswer: 'Too close to exam week',
        },
        {
          id: 's3-q2',
          number: 2,
          type: 'short',
          prompt:
            'Which TOPIC do they finally choose for their presentation? (Write one word or short phrase.)',
          correctAnswer: 'remote work',
        },
        {
          id: 's3-q3',
          number: 3,
          type: 'mcq',
          prompt: 'Who will be responsible for creating the slides?',
          options: ['Emma', 'Liam', 'Sophia', 'Noah'],
          correctAnswer: 'Emma',
        },
      ];
    case 4:
    default:
      return [
        {
          id: 's4-q1',
          number: 1,
          type: 'short',
          prompt:
            'According to the lecture, what is the PRIMARY cause of the temperature rise in the last century?',
          correctAnswer: 'greenhouse gases',
        },
        {
          id: 's4-q2',
          number: 2,
          type: 'mcq',
          prompt: 'Which graph best shows the trend described by the lecturer?',
          options: [
            'Gradual rise with small dips',
            'Sharp fall then sudden rise',
            'Flat line with no change',
            'Random ups and downs',
          ],
          correctAnswer: 'Gradual rise with small dips',
        },
        {
          id: 's4-q3',
          number: 3,
          type: 'short',
          prompt:
            'What TERM does the lecturer use for gases that trap heat in the atmosphere?',
          correctAnswer: 'greenhouse gases',
        },
      ];
  }
}

function getSectionMeta(sectionNumber: number) {
  switch (sectionNumber) {
    case 1:
      return {
        label: 'Section 1 · Conversation',
        tagline: 'Warm-up audio · forms, phone numbers, spelling stress.',
        estTime: '~8–10 mins',
        difficulty: 'Easier',
      };
    case 2:
      return {
        label: 'Section 2 · Short talk',
        tagline: 'Campus / community info, maps and announcements.',
        estTime: '~8–10 mins',
        difficulty: 'Moderate',
      };
    case 3:
      return {
        label: 'Section 3 · Discussion',
        tagline: 'Group discussions, fast speakers, academic stress.',
        estTime: '~8–10 mins',
        difficulty: 'Hard',
      };
    case 4:
    default:
      return {
        label: 'Section 4 · Lecture',
        tagline: 'Dense lecture, no pauses, pure focus test.',
        estTime: '~10–12 mins',
        difficulty: 'Very hard',
      };
  }
}

// -----------------------------------------------------------------------------
// SERVER HELPERS – LOAD FROM SUPABASE THEN FALLBACK
// -----------------------------------------------------------------------------

type ListeningQuestionRow =
  Database['public']['Tables']['listening_questions']['Row'];

/**
 * Try to load questions for this section from Supabase.
 * If nothing comes back, caller will fall back to mock data.
 *
 * 🔧 Adjust column names if needed:
 *  - here I assume:
 *      section (or section_no)       -> section number 1–4
 *      question_text                 -> actual question / prompt
 *      question_type                 -> e.g. 'mcq_single', 'form_completion'
 *      options                       -> JSON/text[] of choices for MCQ (optional)
 *      correct_answer                -> canonical answer text
 */
async function loadQuestionsFromSupabase(
  sectionNumber: number,
  supabase: ReturnType<typeof getServerClient<Database>>
): Promise<DrillQuestion[]> {
  const { data, error } = await supabase
    .from('listening_questions')
    .select('id, section, section_no, question_text, question_type, options, correct_answer')
    .or(`section.eq.${sectionNumber},section_no.eq.${sectionNumber}`)
    .order('question_number', { ascending: true })
    .limit(40);

  if (error || !data || data.length === 0) {
    return [];
  }

  const rows = data as any as (ListeningQuestionRow & {
    section?: number | null;
    section_no?: number | null;
    question_text?: string | null;
    question_type?: string | null;
    options?: string[] | null;
    correct_answer?: string | null;
    question_number?: number | null;
  })[];

  let qNumber = 1;

  return rows.map((row) => {
    // Decide type: treat MCQ-ish types as 'mcq', everything else as 'short'
    const rawType = (row.question_type ?? '').toLowerCase();
    const isMcq =
      rawType.includes('mcq') ||
      rawType.includes('choice') ||
      (Array.isArray(row.options) && row.options.length > 0);

    const type: DrillQuestionType = isMcq ? 'mcq' : 'short';

    const prompt =
      (row as any).question_text ??
      (row as any).text ??
      'Question text missing – please check schema.';

    const correctAnswer =
      (row as any).correct_answer ?? (row as any).answer ?? '—';

    const options: string[] | undefined = Array.isArray((row as any).options)
      ? ((row as any).options as string[])
      : undefined;

    const number =
      (row as any).question_number && Number((row as any).question_number) > 0
        ? Number((row as any).question_number)
        : qNumber++;

    return {
      id: String(row.id),
      number,
      type,
      prompt,
      options: type === 'mcq' ? options : undefined,
      correctAnswer,
    };
  });
}

// -----------------------------------------------------------------------------
// PAGE COMPONENT
// -----------------------------------------------------------------------------

const ListeningSectionDrillRunnerPage: NextPage<PageProps> = ({
  sectionNumber,
  sectionLabel,
  sectionTagline,
  estTime,
  difficulty,
  questions,
}) => {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [selectedOption, setSelectedOption] = React.useState<string | null>(null);
  const [typedAnswer, setTypedAnswer] = React.useState('');
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isCorrect, setIsCorrect] = React.useState<boolean | null>(null);
  const [score, setScore] = React.useState(0);
  const [completed, setCompleted] = React.useState(false);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const handleSubmit = () => {
    if (!currentQuestion) return;

    let userAnswer: string;
    if (currentQuestion.type === 'mcq') {
      if (!selectedOption) return;
      userAnswer = selectedOption;
    } else {
      userAnswer = typedAnswer.trim();
      if (!userAnswer) return;
    }

    const correct =
      userAnswer.toLowerCase().trim() ===
      currentQuestion.correctAnswer.toLowerCase().trim();

    setIsSubmitted(true);
    setIsCorrect(correct);
    if (correct) setScore((prev) => prev + 1);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= totalQuestions) {
      setCompleted(true);
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    setSelectedOption(null);
    setTypedAnswer('');
    setIsSubmitted(false);
    setIsCorrect(null);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setTypedAnswer('');
    setIsSubmitted(false);
    setIsCorrect(null);
    setScore(0);
    setCompleted(false);
  };

  const progressLabel = `${currentIndex + 1} / ${totalQuestions}`;

  return (
    <>
      <Head>
        <title>Listening Section {sectionNumber} Drill · GramorX</title>
      </Head>

      <main className="bg-lightBg dark:bg-dark/90 pb-20">
        {/* HEADER */}
        <section className="border-b border-border/40 bg-card/70 backdrop-blur py-6">
          <Container>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <Link href="/mock" className="hover:underline">
                    Mock
                  </Link>
                  <span>/</span>
                  <Link href="/mock/listening" className="hover:underline">
                    Listening
                  </Link>
                  <span>/</span>
                  <Link
                    href="/mock/listening/drill/section"
                    className="hover:underline"
                  >
                    Drill
                  </Link>
                  <span>/</span>
                  <span className="text-foreground font-medium">
                    Section {sectionNumber}
                  </span>
                </div>

                <h1 className="font-slab text-h2 leading-tight">
                  {sectionLabel} drill.
                </h1>

                <p className="text-sm text-muted-foreground max-w-2xl">
                  {sectionTagline} Practice mode only — no strict single-play rules,
                  but still close to real exam difficulty.
                </p>
              </div>

              <div className="flex flex-col items-start md:items-end gap-2 text-xs text-muted-foreground">
                <div className="flex flex-wrap gap-2">
                  <Badge size="sm" variant="neutral">
                    Practice mode
                  </Badge>
                  <Badge size="sm" variant="info">
                    {difficulty}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Clock" className="h-3.5 w-3.5" />
                  <span>Estimated: {estTime}</span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* MAIN LAYOUT */}
        <section className="pt-8">
          <Container>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)]">
              {/* LEFT: Question player */}
              <Card className="rounded-ds-2xl border border-border/60 bg-card/90 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge size="xs" variant="neutral">
                      Question {currentQuestion.number}
                    </Badge>
                    <span className="inline-flex items-center gap-1">
                      <Icon name="ListChecks" className="h-3.5 w-3.5" />
                      <span>{progressLabel}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-ds-full bg-muted/70 px-2.5 py-1">
                      <Icon name="Star" className="h-3.5 w-3.5" />
                      <span>
                        Score: {score}/{questions.length}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="mb-4 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Listening prompt
                  </p>
                  <p className="whitespace-pre-line text-sm text-foreground">
                    {currentQuestion.prompt}
                  </p>
                </div>

                <div className="space-y-4">
                  {currentQuestion.type === 'mcq' && currentQuestion.options && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Choose ONE letter (A, B, C or D).
                      </p>
                      <div className="grid gap-2">
                        {currentQuestion.options.map((opt) => {
                          const isActive = selectedOption === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                if (isSubmitted) return;
                                setSelectedOption(opt);
                              }}
                              className={[
                                'flex w-full items-center justify-between rounded-ds-xl border px-3 py-2 text-left text-xs transition',
                                isActive
                                  ? 'border-primary bg-primary/10 text-foreground'
                                  : 'border-border/60 bg-muted/40 hover:bg-muted/70',
                              ].join(' ')}
                            >
                              <span>{opt}</span>
                              {isActive && (
                                <Icon
                                  name="CheckCircle"
                                  className="h-4 w-4 text-primary"
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {currentQuestion.type === 'short' && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Type your answer. Follow IELTS rules (spelling matters).
                      </p>
                      <input
                        type="text"
                        value={typedAnswer}
                        onChange={(e) => {
                          if (isSubmitted) return;
                          setTypedAnswer(e.target.value);
                        }}
                        className="w-full rounded-ds-xl border border-border/60 bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
                        placeholder="Type your answer here…"
                      />
                    </div>
                  )}

                  {isSubmitted && (
                    <div className="mt-2 rounded-ds-xl border px-3 py-2 text-xs flex items-start gap-2">
                      <Icon
                        name={isCorrect ? 'ThumbsUp' : 'AlertTriangle'}
                        className={
                          isCorrect
                            ? 'h-4 w-4 text-emerald-500'
                            : 'h-4 w-4 text-destructive'
                        }
                      />
                      <div>
                        <p
                          className={
                            isCorrect
                              ? 'font-medium text-emerald-500'
                              : 'font-medium text-destructive'
                          }
                        >
                          {isCorrect ? 'Correct.' : 'Not quite.'}
                        </p>
                        {!isCorrect && (
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            Correct answer:{' '}
                            <span className="font-semibold text-foreground">
                              {currentQuestion.correctAnswer}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    {!completed && (
                      <>
                        {!isSubmitted ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="primary"
                            className="rounded-ds-xl"
                            onClick={handleSubmit}
                          >
                            Check answer
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="rounded-ds-xl"
                            onClick={handleNext}
                          >
                            {currentIndex + 1 === questions.length
                              ? 'Finish drill'
                              : 'Next question'}
                          </Button>
                        )}
                      </>
                    )}

                    {completed && (
                      <Button
                        type="button"
                        size="sm"
                        variant="primary"
                        className="rounded-ds-xl"
                        onClick={handleRestart}
                      >
                        Restart this section drill
                      </Button>
                    )}

                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="rounded-ds-xl"
                    >
                      <Link href="/mock/listening/drill/section">
                        Back to section menu
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>

              {/* RIGHT: Summary / progress */}
              <div className="space-y-6">
                <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-4 text-xs space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
                    Drill snapshot
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <Info label="Section" value={`Section ${sectionNumber}`} />
                    <Info label="Questions" value={questions.length} />
                    <Info label="Correct so far" value={score} />
                    <Info
                      label="Status"
                      value={completed ? 'Completed' : 'In progress'}
                    />
                  </div>

                  <p className="text-[11px] text-muted-foreground mt-1">
                    This is practice mode. Use full mocks for strict exam-style Listening.
                  </p>
                </Card>

                <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-4 text-xs space-y-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground font-semibold">
                    What to focus on
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] text-muted-foreground">
                    <li>Stay calm even when you miss a detail — focus on the next one.</li>
                    <li>
                      After the drill, note which questions felt hard and recreate them in
                      your own notebook.
                    </li>
                    <li>
                      Use history + AI Lab later to see which sections kill your band
                      consistently.
                    </li>
                  </ul>

                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="secondary"
                      className="rounded-ds-xl w-full"
                    >
                      <Link href="/mock/listening/history">
                        Open Listening history
                      </Link>
                    </Button>

                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="rounded-ds-xl w-full"
                    >
                      <Link href="/mock/listening">
                        Back to Listening mock hub
                      </Link>
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </Container>
        </section>
      </main>
    </>
  );
};

// -----------------------------------------------------------------------------
// Helper
// -----------------------------------------------------------------------------

const Info = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-foreground">{value}</span>
  </div>
);

// -----------------------------------------------------------------------------
// SSR
// -----------------------------------------------------------------------------

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const sectionParam = ctx.params?.sectionNo;
  const sectionNumber = Number(sectionParam);

  if (!sectionNumber || sectionNumber < 1 || sectionNumber > 4) {
    return { notFound: true };
  }

  const supabase = getServerClient<Database>(ctx.req, ctx.res);

  const meta = getSectionMeta(sectionNumber);

  // Try real questions first
  const dbQuestions = await loadQuestionsFromSupabase(sectionNumber, supabase);

  const questions =
    dbQuestions.length > 0 ? dbQuestions : buildMockQuestionsForSection(sectionNumber);

  return {
    props: {
      sectionNumber,
      sectionLabel: meta.label,
      sectionTagline: meta.tagline,
      estTime: meta.estTime,
      difficulty: meta.difficulty,
      questions,
    },
  };
};

export default ListeningSectionDrillRunnerPage;
