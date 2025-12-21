// pages/mock/listening/drill/section.tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { Icon } from '@/components/design-system/Icon';

const SECTION_DRILLS = [
  {
    id: 1,
    label: 'Section 1',
    title: 'Everyday conversation · Forms & notes',
    difficulty: 'Easier warm-up',
    focus: ['Form completion', 'Short-answer questions', 'Spelling'],
    est: '~8–10 mins',
  },
  {
    id: 2,
    label: 'Section 2',
    title: 'Short talk · Campus / community info',
    difficulty: 'Moderate',
    focus: ['Map / plan labelling', 'Matching', 'Multiple choice'],
    est: '~8–10 mins',
  },
  {
    id: 3,
    label: 'Section 3',
    title: 'Academic discussion · Fast speakers',
    difficulty: 'Hard',
    focus: ['Multiple speakers', 'Inference', 'Detail tracking'],
    est: '~8–10 mins',
  },
  {
    id: 4,
    label: 'Section 4',
    title: 'Lecture · No breaks, dense ideas',
    difficulty: 'Very hard',
    focus: ['Note completion', 'Main ideas', 'Signal words'],
    est: '~10–12 mins',
  },
];

const ListeningSectionDrillPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Listening Section Drills · GramorX</title>
      </Head>

      <main className="bg-lightBg dark:bg-dark/90 pb-20">
        {/* ---------------------------------------------------------- */}
        {/* HERO */}
        {/* ---------------------------------------------------------- */}
        <section className="border-b border-border/40 bg-card/70 backdrop-blur py-10 md:py-14">
          <Container>
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-ds-full bg-primary/10 px-3 py-1 text-caption font-medium text-primary">
                <Icon name="Headphones" size={14} />
                <span>Listening · Section drills</span>
                <Badge size="xs" variant="neutral">
                  Practice mode
                </Badge>
              </div>

              <h1 className="font-slab text-display leading-tight">
                Train one Listening section at a time.
              </h1>

              <p className="text-small text-muted-foreground max-w-2xl">
                Use this room when you don’t have energy for a full mock. Pick a
                section, drill its style, and stack small wins without breaking
                exam rules.
              </p>

              <div className="flex flex-wrap gap-3 pt-2 text-caption text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Icon name="Info" className="h-3.5 w-3.5" />
                  <span>
                    Full strict mocks still live in{' '}
                    <Link
                      href="/mock/listening"
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Listening Mock Command Center
                    </Link>
                    .
                  </span>
                </span>
              </div>
            </div>
          </Container>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* SECTION DRILL CARDS */}
        {/* ---------------------------------------------------------- */}
        <section className="py-10">
          <Container>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-primary font-semibold">
                  Pick a section
                </p>
                <h2 className="font-slab text-h2">Where do you want pain today?</h2>
                <p className="mt-1 text-caption sm:text-small text-muted-foreground max-w-2xl">
                  Start with the section that usually ruins your band. You can always
                  come back and rotate through all four.
                </p>
              </div>

              <Button
                asChild
                size="sm"
                variant="secondary"
                className="rounded-ds-xl"
              >
                <Link href="/mock/listening/history">
                  View your Listening history
                  <Icon name="ArrowRight" className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              {SECTION_DRILLS.map((section) => (
                <Card
                  key={section.id}
                  className="flex h-full flex-col justify-between rounded-ds-2xl border border-border/60 bg-card/80 p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/60 hover:bg-card/90 hover:shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge size="xs" variant="neutral">
                          {section.label}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {section.difficulty}
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 rounded-ds-full bg-muted/70 px-2.5 py-1 text-[11px] text-muted-foreground">
                        <Icon name="Clock" className="h-3.5 w-3.5" />
                        {section.est}
                      </span>
                    </div>

                    <h3 className="text-small font-semibold text-foreground">
                      {section.title}
                    </h3>

                    <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4">
                      {section.focus.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  {/* UPDATED LINK → NOW POINTS TO THE DRILL PLAYER */}
                  <Button
                    asChild
                    size="sm"
                    variant="primary"
                    className="mt-4 w-full rounded-ds-xl"
                  >
                    <Link href={`/mock/listening/drill/section/${section.id}`}>
                      Start {section.label} drill
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* ---------------------------------------------------------- */}
        {/* COMING SOON / INFO BANNER */}
        {/* ---------------------------------------------------------- */}
        <section className="pb-16">
          <Container>
            <Card className="mx-auto max-w-4xl rounded-ds-2xl border border-dashed border-primary/40 bg-gradient-to-r from-primary/5 via-card/90 to-primary/5 p-5 md:p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-ds-full bg-primary/10 px-3 py-1 text-[11px] font-medium text-primary">
                    <Icon name="Sparkles" size={14} />
                    <span>Smarter section drills · Coming soon</span>
                  </div>
                  <h3 className="font-slab text-h4">
                    Auto-build section drills from your mistakes.
                  </h3>
                  <p className="text-caption md:text-small text-muted-foreground max-w-xl">
                    Soon, this page will pull your weakest sections from history and
                    build targeted drill sets automatically — so you’re not guessing
                    what to practise.
                  </p>
                </div>

                <div className="flex flex-col items-start gap-2 text-[11px] text-muted-foreground md:text-right">
                  <span className="inline-flex items-center gap-1 rounded-ds-full bg-muted/70 px-3 py-1">
                    <Icon name="Construction" size={14} />
                    <span>In active design</span>
                  </span>
                  <span>
                    Until then, use full mocks and history to choose your weakest
                    section manually.
                  </span>
                </div>
              </div>
            </Card>
          </Container>
        </section>
      </main>
    </>
  );
};

export default ListeningSectionDrillPage;
