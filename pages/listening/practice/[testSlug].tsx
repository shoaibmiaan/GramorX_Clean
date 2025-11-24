// pages/listening/practice/[testSlug].tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Button } from '@/components/design-system/Button';
import { Alert } from '@/components/design-system/Alert';
import Icon from '@/components/design-system/Icon';

import ListeningNavTabs from '@/components/listening/ListeningNavTabs';
import ListeningInfoBanner from '@/components/listening/ListeningInfoBanner';
import PracticeQuestionList from '@/components/listening/Practice/PracticeQuestionList';
import PracticeAnswerInput from '@/components/listening/Practice/PracticeAnswerInput';
import MockTimer from '@/components/listening/Mock/MockTimer';
import MockTestShell from '@/components/listening/Mock/MockTestShell';

import { useListeningTestRunner } from '@/lib/hooks/useListeningTestRunner';
import type {
  ListeningTest,
  ListeningSection,
  ListeningAttemptAnswer,
} from '@/lib/listening/types';

type SectionNavQuestion = {
  id: string;
  label: string;
  status: 'unanswered' | 'answered';
};

type SectionNavItem = {
  sectionNumber: number;
  questions: SectionNavQuestion[];
};

type Props = {
  test: ListeningTest;
};

const buildNavSections = (
  sections: ListeningSection[],
  answers: Record<string, ListeningAttemptAnswer>,
): SectionNavItem[] => {
  return sections.map((section) => ({
    sectionNumber: section.sectionNumber,
    questions: section.questions.map((q) => {
      const ans = answers[q.id];
      const hasValue =
        ans && (Array.isArray(ans.value) ? ans.value.length > 0 : ans.value !== '');
      const status: SectionNavQuestion['status'] = hasValue ? 'answered' : 'unanswered';

      return {
        id: q.id,
        label: String(q.questionNumber),
        status,
      };
    }),
  }));
};

const ListeningPracticeRunPage: NextPage<Props> = ({ test }) => {
  const [attemptId, setAttemptId] = React.useState<string | null>(null);
  const [starting, setStarting] = React.useState(false);
  const [startError, setStartError] = React.useState<string | null>(null);

  const {
    status,
    timeLeft,
    currentSection,
    currentQuestion,
    currentSectionIndex,
    currentQuestionIndex,
    answers,
    start,
    goToQuestion,
    nextQuestion,
    prevQuestion,
    setAnswer,
    submit,
  } = useListeningTestRunner({
    test,
    mode: 'practice',
    attemptId: attemptId ?? '',
    durationSeconds: test.durationSeconds,
    enableAutosave: true,
    onSubmitSuccess: (attempt) => {
      window.location.href = `/listening/practice/${encodeURIComponent(
        test.slug,
      )}/result?attemptId=${encodeURIComponent(attempt.id)}`;
    },
  });

  // create attempt on mount
  React.useEffect(() => {
    if (attemptId) return;

    const testSlug = test.slug;
    setStarting(true);
    setStartError(null);

    void (async () => {
      try {
        const res = await fetch('/api/listening/practice/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ testSlug }),
        });

        if (!res.ok) {
          throw new Error(`Failed to start practice attempt (${res.status})`);
        }

        const json = await res.json();
        setAttemptId(json.attempt.id);
      } catch (err) {
        setStartError('Failed to start practice attempt. Refresh and try again.');
      } finally {
        setStarting(false);
      }
    })();
  }, [attemptId, test.slug]);

  const handleSelectQuestion = (sectionNumber: number, questionId: string) => {
    const sectionIdx = test.sections.findIndex(
      (s) => s.sectionNumber === sectionNumber,
    );
    if (sectionIdx === -1) return;
    const qIdx = test.sections[sectionIdx].questions.findIndex(
      (q) => q.id === questionId,
    );
    if (qIdx === -1) return;
    goToQuestion(sectionIdx, qIdx);
  };

  const handleSubmit = async () => {
    if (!window.confirm('Submit this practice attempt and see your results?')) {
      return;
    }

    try {
      await submit();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  const navSections: SectionNavItem[] = buildNavSections(
    test.sections,
    answers,
  );

  const currentSectionNumber =
    currentSection?.sectionNumber ?? test.sections[0]?.sectionNumber ?? 1;
  const currentQuestionId = currentQuestion?.id ?? null;

  const hasStarted = status !== 'idle';

  return (
    <>
      <Head>
        <title>{test.title} • Listening Practice • GramorX</title>
        <meta
          name="description"
          content="Practice an IELTS-style Listening test with flexible review so you can learn without wasting full mocks."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Listening · Practice
              </p>
              <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
                {test.title}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {test.totalQuestions} questions ·{' '}
                {Math.round(test.durationSeconds / 60)} min
              </p>
            </div>
            <ListeningNavTabs activeKey="practice" />
          </div>

          <section className="mb-4">
            <ListeningInfoBanner
              variant="info"
              title="Practice ≠ mock"
              body="Here you can pause between questions, move around sections, and experiment with strategies. Save full strict mode for the mock section."
            />
          </section>

          {startError && (
            <section className="mb-3">
              <Alert variant="error">{startError}</Alert>
            </section>
          )}

          <MockTestShell
            testTitle={test.title}
            durationSeconds={test.durationSeconds}
            elapsedSeconds={test.durationSeconds - timeLeft}
            navSections={navSections}
            currentSectionNumber={currentSectionNumber}
            currentQuestionId={currentQuestionId}
            onSelectQuestion={handleSelectQuestion}
          >
            <div className="mb-3">
              <MockTimer
                timeLeftSeconds={timeLeft}
                totalSeconds={test.durationSeconds}
              />
            </div>

            {!hasStarted && (
              <div className="space-y-3">
                <Alert variant="info">
                  <div className="flex items-start gap-2">
                    <Icon name="Info" size={16} className="mt-0.5 text-primary" />
                    <p className="text-xs text-muted-foreground sm:text-sm">
                      Hit <strong>Start practice</strong> when you&apos;re ready. You&apos;ll
                      still have a timer, but this is a safer lab to try different strategies.
                    </p>
                  </div>
                </Alert>
                <Button
                  type="button"
                  onClick={start}
                  disabled={!attemptId || starting}
                  className="inline-flex items-center gap-2"
                >
                  <Icon name="PlayCircle" size={16} />
                  <span>{starting ? 'Preparing…' : 'Start practice'}</span>
                </Button>
              </div>
            )}

            {hasStarted && (
              <div className="grid gap-4 lg:grid-cols-[260px,1fr]">
                {/* Question list / navigation */}
                <div className="order-2 lg:order-1">
                  <PracticeQuestionList
                    sections={test.sections}
                    answers={answers}
                    currentQuestionId={currentQuestionId}
                    onSelectQuestion={handleSelectQuestion}
                  />
                </div>

                {/* Active question + answer input */}
                <div className="order-1 space-y-4 lg:order-2">
                  {currentQuestion && (
                    <PracticeAnswerInput
                      question={currentQuestion}
                      answer={answers[currentQuestion.id]}
                      onChangeAnswer={setAnswer}
                    />
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={prevQuestion}
                      >
                        <Icon name="ArrowLeft" size={14} />
                        <span>Previous</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={nextQuestion}
                      >
                        <span>Next</span>
                        <Icon name="ArrowRight" size={14} />
                      </Button>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      onClick={handleSubmit}
                      disabled={!attemptId || status === 'submitting'}
                    >
                      <Icon name="CheckSquare" size={14} />
                      <span>{status === 'submitting' ? 'Submitting…' : 'Submit practice'}</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </MockTestShell>
        </Container>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);

  const testSlug = ctx.query.testSlug as string | undefined;
  if (!testSlug) {
    return { notFound: true };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { props: null as never };
  }

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(
          `/listening/practice/${testSlug}`,
        )}`,
        permanent: false,
      },
    };
  }

  const { data: testRow, error: testError } = await supabase
    .from('listening_tests')
    .select(
      'id, slug, title, description, difficulty, is_mock, total_questions, total_score, duration_seconds, audio_storage_key',
    )
    .eq('slug', testSlug)
    .eq('is_mock', false)
    .single<any>();

  if (testError || !testRow) {
    return { notFound: true };
  }

  const { data: sectionRows, error: sectionError } = await supabase
    .from('listening_sections')
    .select(
      'id, section_number, title, description, listening_questions(id, question_number, section_number, type, prompt, context, correct_answers, max_score)',
    )
    .eq('test_id', testRow.id)
    .order('section_number', { ascending: true });

  if (sectionError || !sectionRows) {
    return { notFound: true };
  }

  const sections: ListeningSection[] = sectionRows.map((s: any) => ({
    id: s.id,
    testId: testRow.id,
    sectionNumber: s.section_number,
    title: s.title,
    description: s.description,
    questions:
      s.listening_questions?.map((q: any) => ({
        id: q.id,
        testId: testRow.id,
        sectionId: s.id,
        questionNumber: q.question_number,
        sectionNumber: q.section_number,
        type: q.type,
        prompt: q.prompt,
        context: q.context,
        options: undefined,
        correctAnswers: q.correct_answers ?? [],
        maxScore: q.max_score,
        audioStartMs: null,
        audioEndMs: null,
      })) ?? [],
  }));

  const test: ListeningTest = {
    id: testRow.id,
    slug: testRow.slug,
    title: testRow.title,
    description: testRow.description,
    difficulty: testRow.difficulty,
    isMock: !!testRow.is_mock,
    totalQuestions: testRow.total_questions ?? 0,
    totalScore: testRow.total_score ?? testRow.total_questions ?? 40,
    durationSeconds: testRow.duration_seconds ?? 0,
    audioStorageKey: testRow.audio_storage_key ?? null,
    sections,
  };

  return {
    props: {
      test,
    },
  };
};

export default ListeningPracticeRunPage;
