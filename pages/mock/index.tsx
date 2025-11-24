import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';
import { MockPinGate } from '@/components/mock/MockPinGate';

const mockTestOverview = {
  title: 'Full Mock Tests',
  description: 'Serious exam rehearsals with band estimates and post-test breakdowns.',
  bullets: [
    'Full-length timed mocks',
    'Module-wise band estimates',
    'Cheating-safe exam workspace',
    'Post-test analysis with AI feedback',
  ],
  status: 'Rolling out',
  statusTone: 'info',
};

const mockTestFeatures = [
  {
    title: 'Module 1: Listening',
    description: 'Simulate listening tests with timed modules and AI-based band estimates.',
    icon: 'Headphones',
    href: '/mock/listening/overview',
  },
  {
    title: 'Module 2: Reading',
    description: 'Practice reading comprehension with realistic exam conditions and feedback.',
    icon: 'FileText',
    href: '/mock/reading/overview',
  },
  {
    title: 'Module 3: Writing',
    description: 'Get instant feedback on writing tasks with AI scoring and analysis.',
    icon: 'PenSquare',
    href: '/mock/writing/overview',
  },
  {
    title: 'Module 4: Speaking',
    description: 'Practice speaking with AI evaluation and simulated examiner interactions.',
    icon: 'Microphone',
    href: '/mock/speaking/overview',
  },
];

const MockTestPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>GramorX AI — Full Mock Tests</title>
        <meta
          name="description"
          content="Take full-length IELTS mock tests with realistic time conditions and AI-powered band estimates."
        />
      </Head>

      <MockPinGate module="mock">
        <main className="bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">

          {/* Hero Section */}
          <section className="pb-16 pt-16 md:pt-20">
            <Container>
              <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-center">

                {/* Left side */}
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 rounded-ds-full bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon name="Timer" size={14} />
                    </span>
                    <span>{mockTestOverview.status} • IELTS Full Mock Tests</span>
                  </div>

                  <div className="space-y-4">
                    <h1 className="font-slab text-display text-gradient-primary">{mockTestOverview.title}</h1>
                    <p className="max-w-xl text-body text-grayish">{mockTestOverview.description}</p>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <Button asChild variant="primary" size="lg" className="rounded-ds-2xl px-6">
                      <Link href="/mock/listening/overview">Explore Listening Module</Link>
                    </Button>
                    <Button asChild variant="secondary" size="lg" className="rounded-ds-2xl px-6">
                      <Link href="/pricing">View Pricing Plans</Link>
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-4 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="ShieldCheck" size={14} /> No cheating, secured environment
                    </span>
                    <span>•</span>
                    <span>Full mock tests with time tracking and performance analysis</span>
                  </div>
                </div>

                {/* Right card */}
                <div className="space-y-4">
                  <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                          Mock Test Details
                        </p>
                        <h2 className="font-slab text-h3">Full-Length Timed Mocks</h2>
                      </div>
                      <Badge variant="accent" size="sm">{mockTestOverview.status}</Badge>
                    </div>

                    <div className="mt-4 space-y-3">
                      <p className="text-small text-grayish">{mockTestOverview.description}</p>
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
                    Take mock tests for each module: Listening, Reading, Writing, and Speaking.
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
                          <p className="text-sm font-semibold text-foreground">{feature.title}</p>
                          <p className="text-xs text-muted-foreground">{feature.description}</p>
                        </div>
                      </div>
                      <span className="mt-1 inline-flex items-center text-xs font-medium text-primary group-hover:underline">
                        Start Test
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

export default MockTestPage;
