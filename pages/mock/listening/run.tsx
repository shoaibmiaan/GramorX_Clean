// pages/mock/listening/run.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';

import { getServerClient } from '@/lib/supabaseServer';
import type {
  ListeningTest,
  ListeningSection,
  ListeningQuestion,
  ListeningAttemptAnswer,
} from '@/lib/listening/types';
import MockTestShell from '@/components/listening/Mock/MockTestShell';
import MockQuestionRenderer from '@/components/listening/Mock/MockQuestionRenderer';
import MockTimer from '@/components/listening/Mock/MockTimer';
import { Button } from '@/components/design-system/Button';
import { Alert } from '@/components/design-system/Alert';
import Icon from '@/components/design-system/Icon';
import { useListeningTestRunner } from '@/lib/hooks/useListeningTestRunner';

type SectionNavQuestion = {
  id: string;
  label: string;
  status: 'unanswered' | 'answered' | 'flagged';
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
  flagged: Record<string, boolean>,
): SectionNavItem[] => {
  return sections.map((section) => ({
    sectionNumber: section.sectionNumber,
    questions: section.questions.map((q) => {
      const ans = answers[q.id];
      const hasValue =
        ans && (Array.isArray(ans.value) ? ans.value.length > 0 : ans.value !== '');
      const isFlagged = flagged[q.id] === true;

      let status: SectionNavQuestion['status'] = 'unanswered';
      if (isFlagged) status = 'flagged';
      else if (hasValue) status = 'answered';

      return {
        id: q.id,
        label: String(q.questionNumber),
        status,
      };
    }),
  }));
};

const MockListeningRunPage: NextPage<Props> = ({ test }) => {
  const [attemptId, setAttemptId] = React.useState<string | null>(null);
  const [flagged, setFlagged] = React.useState<Record<string, boolean>>({});
  const [starting, setStarting] = React.useState(false);
  const [startError, setStartError] = React.useState<string | null>(null);

  const durationSeconds = test.durationSeconds;

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
    mode: 'mock',
    attemptId: attemptId ?? '',
    durationSeconds,
    enableAutosave: true,
    onSubmitSuccess: (attempt) => {
      window.location.href = `/mock/listening/submitted?attemptId=${encodeURIComponent(
        attempt.id,
      )}`;
    },
  });

  // Create attempt when page loads
  React.useEffect(() => {
    if (attemptId) return;

    const testSlug = test.slug;
    setStarting(true);
    setStartError(null);

    void (async () => {
      try {
        const res = await fetch('/api/listening/mock/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ testSlug }),
        });

        if (!res.ok) {
          throw new Error(`Failed to start attempt (${res.status})`);
        }

        const json = await res.json();
        setAttemptId(json.attempt.id);
      } catch (err) {
        setStartError('Failed to start mock. Refresh the page and try again.');
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

  const handleToggleFlag = (questionId: string) => {
    setFlagged((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const navSections: SectionNavItem[] = buildNavSections(
    test.sections,
    answers,
    flagged,
  );

  const handleSubmit = async () => {
    if (
      !window.confirm(
        'Submit your mock? You will not be able to change answers after this.',
      )
    ) {
      return;
    }
    try {
      await submit();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  };

  const hasStarted = status !== 'idle';

  const currentSectionNumber =
    currentSection?.sectionNumber ?? test.sections[0]?.sectionNumber ?? 1;
  const currentQuestionId = currentQuestion?.id ?? null;

  return (
    <>
      <Head>
        <title>{test.title} • Listening Mock Run • GramorX</title>
        <meta
          name="description"
          content="Run your strict IELTS-style Listening mock in real exam conditions."
        />
      </Head>

      <main className="min-h-screen bg-background py-6 sm:py-8">
        <MockTestShell
          testTitle={test.title}
          durationSeconds={durationSeconds}
          elapsedSeconds={durationSeconds - timeLeft}
          navSections={navSections}
          currentSectionNumber={currentSectionNumber}
          currentQuestionId={currentQuestionId}
          onSelectQuestion={handleSelectQuestion}
        >
          {!attemptId && (
            <Alert variant="error" className="mb-3">
              {startError ||
                'Preparing your mock attempt. If this takes too long, refresh the page.'}
            </Alert>
          )}

          <div className="mb-3">
            <MockTimer timeLeftSeconds={timeLeft} totalSeconds={durationSeconds} />
          </div>

          {!hasStarted && (
            <div className="space-y-3">
              <Alert variant="info">
                <div className="flex items-start gap-2">
                  <Icon name="Info" size={16} className="mt-0.5 text-primary" />
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Once you hit <strong>Start mock</strong>, the timer begins. No pause, no
                    rewind. Exactly like the real IELTS Listening.
                  </p>
                </div>
              </Alert>
              <Button
                type="button"
                onClick={start}
                disabled={!attemptId || starting}
                className="inline-flex items-center gap-2"
              >
                <Icon name="Play" size={16} />
                <span>{starting ? 'Preparing…' : 'Start mock'}</span>
              </Button>
            </div>
          )}

          {hasStarted && currentSection && currentQuestion && (
            <div className="space-y-4">
              <MockQuestionRenderer
                question={currentQuestion}
                answer={answers[currentQuestion.id]}
                flagged={flagged[currentQuestion.id] === true}
                onChangeAnswer={setAnswer}
                onToggleFlag={() => handleToggleFlag(currentQuestion.id)}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
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
                  <span>{status === 'submitting' ? 'Submitting…' : 'Submit mock'}</span>
                </Button>
              </div>
            </div>
          )}
        </MockTestShell>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(
          ctx.resolvedUrl || '/mock/listening',
        )}`,
        permanent: false,
      },
    };
  }

  const testSlug = (ctx.query.testSlug as string | undefined) ?? null;

  // 1) Get the selected mock test (or the first one)
  const { data: testRows, error: testsError } = await supabase
    .from('listening_tests')
    .select(
      'id, slug, title, description, difficulty, is_mock, total_questions, total_score, duration_seconds, audio_storage_key, audio_url',
    )
    .eq('is_mock', true)
    .order('title', { ascending: true });

  if (testsError || !testRows || testRows.length === 0) {
    return { notFound: true };
  }

  const selected =
    (testSlug && testRows.find((r: any) => r.slug === testSlug)) ?? testRows[0];

  // 2) Load sections (flat)
  const { data: sectionRows, error: sectionsError } = await supabase
    .from('listening_sections')
    .select(
      'id, test_id, section_number, title, description, audio_url, start_ms, end_ms, transcript',
    )
    .eq('test_id', selected.id)
    .order('section_number', { ascending: true });

  if (sectionsError) {
    console.error('[mock/listening/run] sections error', sectionsError);
  }

  // 3) Load questions for this test (flat)
  const { data: questionRows, error: questionsError } = await supabase
    .from('listening_questions')
    .select(
      'id, test_id, section_id, section_number, question_number, question_text, question_type, options, correct_answer, correct_answers, audio_start_ms, audio_end_ms, transcript, max_score',
    )
    .eq('test_id', selected.id)
    .order('section_number', { ascending: true })
    .order('question_number', { ascending: true });

  if (questionsError) {
    console.error('[mock/listening/run] questions error', questionsError);
  }

  const questionsBySectionId = new Map<string, ListeningQuestion[]>();

  (questionRows ?? []).forEach((q: any) => {
    const list = questionsBySectionId.get(q.section_id) ?? [];
    list.push({
      id: q.id,
      testId: selected.id,
      sectionId: q.section_id,
      questionNumber: q.question_number,
      sectionNumber: q.section_number,
      type: q.question_type,
      prompt: q.question_text,
      context: q.transcript ?? null,
      options: q.options ?? undefined,
      correctAnswers: q.correct_answers ?? [],
      maxScore: q.max_score ?? 1,
      audioStartMs: q.audio_start_ms ?? null,
      audioEndMs: q.audio_end_ms ?? null,
    });
    questionsBySectionId.set(q.section_id, list);
  });

  const sections: ListeningSection[] =
    (sectionRows ?? []).map(
      (s: any): ListeningSection => ({
        id: s.id,
        testId: selected.id,
        sectionNumber: s.section_number,
        title: s.title,
        description: s.description,
        audioUrl: s.audio_url ?? null,
        startMs: s.start_ms ?? null,
        endMs: s.end_ms ?? null,
        transcript: s.transcript ?? null,
        questions: questionsBySectionId.get(s.id) ?? [],
      }),
    ) ?? [];

  const totalQuestions =
    selected.total_questions ??
    sections.reduce((acc, sec) => acc + sec.questions.length, 0);

  const test: ListeningTest = {
    id: selected.id,
    slug: selected.slug,
    title: selected.title,
    description: selected.description,
    difficulty: selected.difficulty,
    isMock: selected.is_mock,
    totalQuestions,
    totalScore: selected.total_score ?? totalQuestions,
    durationSeconds: selected.duration_seconds,
    audioStorageKey: selected.audio_storage_key ?? null,
    audioUrl: selected.audio_url ?? null,
    sections,
  };

  return {
    props: {
      test,
    },
  };
};

export default MockListeningRunPage;
