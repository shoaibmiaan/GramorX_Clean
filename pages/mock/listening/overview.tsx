// pages/mock/listening/overview.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

import ListeningNavTabs from '@/components/listening/ListeningNavTabs';
import ListeningInfoBanner from '@/components/listening/ListeningInfoBanner';

type Props = {
  slug: string;
  title: string;
  totalQuestions: number;
  durationSeconds: number;
  difficulty: string;
};

const ListeningMockOverviewPage: NextPage<Props> = ({
  slug,
  title,
  totalQuestions,
  durationSeconds,
  difficulty,
}) => {
  const minutes = Math.round(durationSeconds / 60);

  return (
    <>
      <Head>
        <title>{title} • Listening Mock Overview • GramorX</title>
        <meta
          name="description"
          content="Instructions and rules for an IELTS-style Listening mock in strict exam mode."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Mock exams · Listening
              </p>
              <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                {title}
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {totalQuestions} questions · {minutes} min · {difficulty}
              </p>
            </div>
            <ListeningNavTabs activeKey="mock" />
          </div>

          <section className="mb-6">
            <ListeningInfoBanner
              variant="danger"
              title="Strict exam rules"
              body="You cannot pause the test, change your answers after time is over, or casually reset the attempt. This is built to behave like the real IELTS Listening exam."
            />
          </section>

          <section className="mb-6 grid gap-4 md:grid-cols-[1.4fr,1fr]">
            <Card className="border-border bg-card/60 p-4">
              <p className="mb-2 text-sm font-semibold text-foreground sm:text-base">
                Before you start
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground sm:text-sm">
                <li>• Make sure your headphones / audio output are working clearly.</li>
                <li>• Sit somewhere you won&apos;t be interrupted for about {minutes} minutes.</li>
                <li>• Keep a rough sheet and pen if you usually use them in the exam.</li>
                <li>
                  • Once the test begins, avoid switching tabs or doing anything else — treat it like
                  the real exam.
                </li>
              </ul>
            </Card>

            <Card className="border-border bg-card/60 p-4">
              <p className="mb-2 text-sm font-semibold text-foreground sm:text-base">
                Test summary
              </p>
              <dl className="space-y-2 text-xs text-muted-foreground sm:text-sm">
                <div className="flex items-center justify-between gap-2">
                  <dt>Mode</dt>
                  <dd className="font-medium text-foreground">Strict IELTS mock</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt>Number of questions</dt>
                  <dd className="font-medium text-foreground">{totalQuestions}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt>Time limit</dt>
                  <dd className="font-medium text-foreground">{minutes} minutes</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt>Difficulty</dt>
                  <dd className="font-medium text-foreground">{difficulty}</dd>
                </div>
              </dl>
            </Card>
          </section>

          <section className="mb-6 grid gap-4 md:grid-cols-2">
            <Card className="border-border bg-card/60 p-4">
              <p className="mb-2 text-sm font-semibold text-foreground sm:text-base">
                Behaviour during the test
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground sm:text-sm">
                <li>• Audio will play section by section – don&apos;t expect to replay everything.</li>
                <li>• You can move within the current section, but backtracking might be limited.</li>
                <li>• When time is over, your answers are locked automatically.</li>
                <li>• You&apos;ll see a band estimate after submission.</li>
              </ul>
            </Card>

            <Card className="border-border bg-card/60 p-4">
              <p className="mb-2 text-sm font-semibold text-foreground sm:text-base">
                Smart strategy
              </p>
              <ul className="space-y-2 text-xs text-muted-foreground sm:text-sm">
                <li>• Don&apos;t burn mocks daily. Use them to test your preparation, not build it.</li>
                <li>• After each mock, study your mistakes in detail before doing another.</li>
                <li>• Treat this as an exam rehearsal, not a casual &quot;practice test&quot;.</li>
              </ul>
            </Card>
          </section>

          <section className="flex flex-wrap items-center justify-between gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/mock/listening">
                <Icon name="ArrowLeft" size={14} />
                <span>Back to mock list</span>
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
            >
              <Link
                href={`/mock/listening/run?slug=${encodeURIComponent(slug)}`}
              >
                <Icon name="PlayCircle" size={14} />
                <span>Start mock now</span>
              </Link>
            </Button>
          </section>
        </Container>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const slug = ctx.query.slug as string | undefined;
  if (!slug) {
    return { notFound: true };
  }

  const supabase = getServerClient(ctx.req, ctx.res);

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
          `/mock/listening/overview?slug=${slug}`,
        )}`,
        permanent: false,
      },
    };
  }

  const { data: row, error } = await supabase
    .from('listening_tests')
    .select(
      'id, slug, title, difficulty, is_mock, total_questions, duration_seconds',
    )
    .eq('slug', slug)
    .eq('is_mock', true)
    .single<any>();

  if (error || !row) {
    return { notFound: true };
  }

  return {
    props: {
      slug: row.slug,
      title: row.title,
      totalQuestions: row.total_questions ?? 40,
      durationSeconds: row.duration_seconds ?? 30 * 60,
      difficulty: row.difficulty ?? 'mixed',
    },
  };
};

export default ListeningMockOverviewPage;
