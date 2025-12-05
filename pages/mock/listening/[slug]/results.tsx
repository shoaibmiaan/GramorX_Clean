// pages/mock/listening/[slug]/results.tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps, NextPage } from 'next';
import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import { Badge } from '@/components/design-system/Badge';

type PageProps = {
  attempt: any;
  answers: any[];
  test: any;
  score: number;
  band: number;
  total: number;
};

const ListeningResultsPage: NextPage<PageProps> = ({
  attempt,
  answers,
  test,
  score,
  band,
  total
}) => {
  const router = useRouter();
  const { attempt: attemptId } = router.query;

  if (!attempt) {
    return (
      <>
        <Head>
          <title>Results Not Found · GramorX</title>
        </Head>
        <Container className="py-10">
          <Card className="mx-auto max-w-xl p-8 text-center space-y-4">
            <div className="flex flex-col items-center gap-2">
              <Icon name="AlertCircle" className="h-8 w-8 text-destructive" />
              <h1 className="text-lg font-semibold">Results not found</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              This attempt could not be found or has not been submitted.
            </p>
            <div className="flex justify-center">
              <Button asChild>
                <Link href="/mock/listening">
                  <Icon name="ArrowLeft" className="mr-2 h-4 w-4" />
                  Back to Listening Mocks
                </Link>
              </Button>
            </div>
          </Card>
        </Container>
      </>
    );
  }

  const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;
  const sectionScores = attempt.section_scores || {};

  return (
    <>
      <Head>
        <title>Results: {test?.title || 'Listening Mock'} · GramorX</title>
      </Head>

      <Container className="py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <Badge variant="accent" className="text-sm">
              <Icon name="CheckCircle" className="h-4 w-4 mr-2" />
              Test Completed
            </Badge>
            <h1 className="text-2xl font-bold">{test?.title || 'IELTS Listening Mock'}</h1>
            <p className="text-muted-foreground">
              Submitted on {new Date(attempt.submitted_at).toLocaleDateString()} at{' '}
              {new Date(attempt.submitted_at).toLocaleTimeString()}
            </p>
          </div>

          {/* Score Summary */}
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-4xl font-bold text-primary">{score}/{total}</p>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Band Score</p>
                <p className="text-4xl font-bold text-green-600">{band.toFixed(1)}</p>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-4xl font-bold">{accuracy}%</p>
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Time Spent</p>
                <p className="text-2xl font-bold">
                  {Math.floor((attempt.duration_seconds - (attempt.meta?.time_spent || 0)) / 60)}:
                  {((attempt.duration_seconds - (attempt.meta?.time_spent || 0)) % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>
          </Card>

          {/* Section Breakdown */}
          {Object.keys(sectionScores).length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Section Breakdown</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(sectionScores).map(([section, score]: [string, any]) => (
                  <div key={section} className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Section {section}</p>
                    <p className="text-2xl font-bold">{score}/10</p>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((score / 10) * 100)}%
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Answer Review */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Answer Review</h2>
            <div className="space-y-4">
              {answers.map((answer, index) => (
                <div
                  key={answer.id}
                  className={`p-4 rounded-lg border ${
                    answer.is_correct
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Q{answer.question_number}</span>
                      <Badge
                        variant={answer.is_correct ? 'accent' : 'destructive'}
                        size="sm"
                      >
                        {answer.is_correct ? 'Correct' : 'Incorrect'}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Section {answer.section}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Your Answer</p>
                      <p className="font-medium">{answer.user_answer || 'Not answered'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Correct Answer</p>
                      <p className="font-medium">{answer.correct_answer}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Points</p>
                      <p className="font-medium">{answer.is_correct ? '1' : '0'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild variant="primary" size="lg">
              <Link href={`/mock/listening/${test.slug}`}>
                <Icon name="RotateCcw" className="mr-2 h-4 w-4" />
                Retake Test
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/mock/listening">
                <Icon name="List" className="mr-2 h-4 w-4" />
                All Listening Mocks
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/mock">
                <Icon name="LayoutDashboard" className="mr-2 h-4 w-4" />
                Mock Hub
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const { slug, attempt } = ctx.query;
  const supabase = getServerClient<Database>(ctx.req, ctx.res);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  // Get attempt
  const { data: attemptData } = await supabase
    .from('listening_attempts')
    .select('*')
    .eq('id', attempt)
    .eq('user_id', user.id)
    .single();

  if (!attemptData) {
    return {
      props: {
        attempt: null,
        answers: [],
        test: null,
        score: 0,
        band: 0,
        total: 0,
      },
    };
  }

  // Get test
  const { data: testData } = await supabase
    .from('listening_tests')
    .select('*')
    .eq('id', attemptData.test_id)
    .single();

  // Get answers
  const { data: answers } = await supabase
    .from('listening_user_answers')
    .select('*')
    .eq('attempt_id', attempt)
    .order('question_number', { ascending: true });

  return {
    props: {
      attempt: attemptData,
      answers: answers || [],
      test: testData,
      score: attemptData.raw_score || 0,
      band: attemptData.band_score || 0,
      total: attemptData.total_questions || 40,
    },
  };
};

export default ListeningResultsPage;