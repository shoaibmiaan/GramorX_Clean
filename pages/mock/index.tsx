// pages/mock/index.tsx

import * as React from 'react';
import Head from 'next/head';
import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';
import { MockPinGate } from '@/components/mock/MockPinGate';

type Props = {
  totalListeningMockAttempts: number;
  userShortId: string;
};

const mockTestOverview = {
  title: 'Full Mock Tests',
  description:
    'Computer-based IELTS mocks with strict timing, locked controls, and AI-powered band tracking.',
  bullets: [
    'Full-length timed mocks',
    'Module-wise band estimates',
    'Cheating-safe exam workspace',
    'Post-test analysis with AI feedback',
  ],
  status: 'Rolling out',
};

const mockTestFeatures = [
  {
    title: 'Listening mocks',
    description:
      '4-section IELTS Listening mocks with single audio, strict timer, and 40 scored questions.',
    icon: 'Headphones' as const,
    href: '/mock/listening',
  },
  {
    title: 'Reading mocks',
    description:
      'Passage-based mocks with realistic question types, strict timing, and auto-marking for objective items.',
    icon: 'FileText' as const,
    href: '/mock/reading',
  },
  {
    title: 'Writing mocks',
    description:
      'Task 1 + Task 2 under exam timing, with AI band estimation and structure feedback.',
    icon: 'PenSquare' as const,
    href: '/mock/writing',
  },
  {
    title: 'Speaking mocks',
    description:
      'Examiner-style Speaking runs (Parts 1–3) with recording, transcript, and AI feedback.',
    icon: 'Microphone' as const,
    href: '/mock/speaking',
  },
];

const MockIndexPage: NextPage<Props> = ({ totalListeningMockAttempts, userShortId }) => {
  return (
    <>
      <Head>
        <title>GramorX AI — Full Mock Tests</title>
        <meta
          name="description"
          content="Take full-length IELTS mock tests with strict timings, locked controls, and AI-powered band estimates."
        />
      </Head>

      {/* Unified mock PIN gate */}
      <MockPinGate module="mock">
        <main className="bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
          {/* Hero Section */}
          <section className="pb-16 pt-16 md:pt-20">
            <Container>
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-center">
                {/* Left side */}
                <div className="space-y-6">
                  {/* Top chip */}
                  <div className="inline-flex items-center gap-2 rounded-ds-full bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon name="Timer" size={14} />
                    </span>
                    <span>{mockTestOverview.status} • IELTS Full Mock Tests</span>
                  </div>

                  {/* Text */}
                  <div className="space-y-4">
                    <h1 className="font-slab text-display text-gradient-primary">
                      {mockTestOverview.title}
                    </h1>
                    <p className="max-w-xl text-body text-grayish">
                      {mockTestOverview.description}
                    </p>
                  </div>

                  {/* Primary CTAs */}
                  <div className="flex flex-wrap gap-4 pt-2">
                    <Button
                      asChild
                      variant="primary"
                      size="lg"
                      className="rounded-ds-2xl px-6"
                    >
                      <Link href="/mock/listening">Start Listening mock</Link>
                    </Button>
                    <Button
                      asChild
                      variant="secondary"
                      size="lg"
                      className="rounded-ds-2xl px-6"
                    >
                      <Link href="/mock/analytics">View mock analytics</Link>
                    </Button>
                  </div>

                  {/* Exam behaviour + attempts hint */}
                  <div className="flex flex-wrap items-center gap-3 pt-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="ShieldCheck" size={14} /> Strict CBE-style behaviour
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Icon name="ListChecks" size={14} />
                      Attempts logged for band tracking
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Icon name="Headphones" size={14} />
                      {totalListeningMockAttempts} listening mock
                      {totalListeningMockAttempts === 1 ? '' : 's'} completed
                    </span>
                  </div>
                </div>

                {/* Right card – exam details + bullets */}
                <div className="space-y-4">
                  <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                          Mock Exam Details
                        </p>
                        <h2 className="font-slab text-h3">Computer-based IELTS Mocks</h2>
                      </div>
                      <Badge variant="accent" size="sm">
                        {mockTestOverview.status}
                      </Badge>
                    </div>

                    <div className="mt-4 space-y-3">
                      <p className="text-small text-grayish">
                        Enter strict exam mode for Listening, Reading, Writing and Speaking. Timers,
                        controls, and marking logic are aligned with the computer-based IELTS test.
                      </p>
                      <ul className="space-y-2 text-xs text-muted-foreground">
                        {mockTestOverview.bullets.map((b, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-[3px] inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
                              <Icon name="Check" size={10} />
                            </span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Candidate / id strip using actual userShortId */}
                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                      <div className="inline-flex items-center gap-2">
                        <Icon name="UserCircle" size={12} />
                        <span>Candidate</span>
                        <span className="font-mono text-[11px] text-foreground/80">
                          GX-{userShortId}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1">
                        <Icon name="Activity" size={11} />
                        Attempts tracked per module
                      </span>
                    </div>
                  </Card>
                </div>
              </div>
            </Container>
          </section>

          {/* Mock Test Modules */}
          <section className="pb-16">
            <Container>
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-slab text-h2">Mock Test Modules</h2>
                  <p className="text-small text-grayish">
                    Enter the dedicated mock room for each module – Listening, Reading, Writing and
                    Speaking. All follow strict IELTS exam behaviour.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {mockTestFeatures.map((feature) => (
                  <Card
                    key={feature.href}
                    className="group flex h-full cursor-pointer flex-col justify-between rounded-ds-2xl border border-border/60 bg-card/70 p-4 transition hover:-translate-y-1 hover:bg-card/90 hover:shadow-lg"
                  >
                    <Link href={feature.href} className="flex h-full flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon name={feature.icon} size={18} />
                        </span>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            {feature.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      <span className="mt-1 inline-flex items-center text-xs font-medium text-primary group-hover:underline">
                        Open mock room
                        <Icon name="ArrowRight" size={14} className="ml-1" />
                      </span>
                    </Link>
                  </Card>
                ))}
              </div>
            </Container>
          </section>
        </main>
      </MockPinGate>
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
        destination: `/login?next=${encodeURIComponent('/mock')}`,
        permanent: false,
      },
    };
  }

  const { data: attemptsRows } = await supabase
    .from('attempts_listening')
    .select('id, mode, status')
    .eq('user_id', user.id)
    .eq('mode', 'mock')
    .eq('status', 'completed');

  const totalListeningMockAttempts = attemptsRows?.length ?? 0;
  const userShortId = user.id.slice(0, 6).toUpperCase();

  return {
    props: {
      totalListeningMockAttempts,
      userShortId,
    },
  };
};

export default MockIndexPage;
