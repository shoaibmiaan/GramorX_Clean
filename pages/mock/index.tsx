// pages/mock/index.tsx

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
  description: 'Serious exam rehearsals with timed modules and post-test breakdowns.',
  bullets: [
    'Full-length timed mocks',
    'Module-wise band estimates',
    'Review after each test',
  ],
};

const modules = [
  {
    slug: '/mock/listening',
    title: 'Listening Mock',
    description: 'Real exam-style audio, 4 sections, 40 questions, and strict timing.',
    badge: 'Audio-led',
    icon: 'Headphones' as const,
  },
  {
    slug: '/mock/reading',
    title: 'Reading Mock',
    description: 'Passages and timing like the official computer-based exam.',
    badge: 'Passages',
    icon: 'BookOpen' as const,
  },
  {
    slug: '/mock/writing',
    title: 'Writing Mock',
    description: 'Task 1 + Task 2 under real exam time pressure.',
    badge: 'Tasks 1 & 2',
    icon: 'PenLine' as const,
  },
  {
    slug: '/mock/speaking',
    title: 'Speaking Mock',
    description: 'Structured 3-part speaking simulation with timed prompts.',
    badge: 'Interview',
    icon: 'Mic' as const,
  },
];

const MockTestPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Full Mock Tests • GramorX</title>
        <meta
          name="description"
          content="Full-length IELTS-style mock exams for Listening, Reading, Writing, and Speaking."
        />
      </Head>

      {/* Premium variant: more serious look but still DS-compliant */}
      <MockPinGate variant="premium">
        <main className="bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
          {/* Hero Section */}
          <section className="border-b border-border/40 bg-background/80 backdrop-blur">
            <Container className="py-8 lg:py-12">
              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                {/* Left: text */}
                <div className="max-w-xl space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon name="Sparkles" size={14} />
                    </span>
                    <span className="tracking-[0.2em] uppercase">Mock Exam Room</span>
                    <Badge variant="soft" size="xs">
                      Full CBE style
                    </Badge>
                  </div>

                  <h1 className="font-slab text-display text-gradient-primary">
                    {mockTestOverview.title}
                  </h1>

                  <p className="max-w-xl text-body text-grayish">
                    {mockTestOverview.description}
                  </p>

                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {mockTestOverview.bullets.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-[3px] inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/10">
                          <Icon name="Check" size={10} className="text-primary" />
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <div className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1">
                      <Icon name="Timer" size={14} className="text-primary" />
                      <span>Real exam timing</span>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1">
                      <Icon name="Activity" size={14} className="text-primary" />
                      <span>Band estimates</span>
                    </div>
                  </div>
                </div>

                {/* Right: modules quick view */}
                <Card className="relative max-w-md rounded-ds-2xl border border-border/60 bg-card/80 p-5 shadow-sm transition-transform transition-shadow duration-300 ease-out hover:-translate-y-1 hover:shadow-lg">
                  <Badge variant="soft" size="xs" className="mb-3">
                    Quick View
                  </Badge>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    MODULES INSIDE MOCK ROOM
                  </p>
                  <h2 className="mt-1 font-slab text-h3">Full-Length Timed Mocks</h2>
                  <p className="mt-2 text-small text-grayish">{mockTestOverview.description}</p>

                  <div className="mt-4 space-y-3">
                    {modules.map((module) => (
                      <Link
                        key={module.slug}
                        href={module.slug}
                        className="group flex items-center justify-between rounded-xl border border-border/40 bg-background/60 px-3 py-2 transition-all duration-200 ease-out hover:border-primary/70 hover:bg-card/80"
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 transition-transform duration-200 group-hover:-translate-y-0.5">
                            <Icon name={module.icon} size={18} className="text-primary" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{module.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {module.description}
                            </p>
                          </div>
                        </div>

                        <Badge variant="soft" size="xs">
                          {module.badge}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </Card>
              </div>
            </Container>
          </section>

          {/* CTA */}
          <section className="bg-background/80">
            <Container className="py-8 lg:py-12">
              <div className="flex flex-col items-center gap-4 text-center">
                <Badge variant="outline" size="xs">
                  Next step
                </Badge>

                <h2 className="font-slab text-h2">Ready to sit a real-feel mock?</h2>

                <p className="max-w-xl text-sm text-muted-foreground">
                  Enter your PIN, pick your module, and start your serious exam practice.
                </p>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                  <Button asChild size="lg">
                    <Link href="/mock/listening">Start Listening Mock</Link>
                  </Button>

                  <Button asChild variant="outline" size="lg">
                    <Link href="/pricing">Upgrade Plan</Link>
                  </Button>
                </div>
              </div>
            </Container>
          </section>
        </main>
      </MockPinGate>
    </>
  );
};

export default MockTestPage;
