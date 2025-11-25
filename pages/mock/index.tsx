// pages/mock/index.tsx
import Head from 'next/head';
import Link from 'next/link';

import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Container } from '@/components/design-system/Container';
import Icon from '@/components/design-system/Icon';
import { mockTests } from '@/data/mock';
import { track } from '@/lib/analytics/track';

const topPicks = [
  {
    slug: 'full-mock',
    title: 'Full IELTS rehearsal',
    description: 'Four modules back-to-back with real timing and breaks.',
    href: '/mock/full',
    skill: 'Full',
  },
  {
    slug: 'speaking-01',
    title: 'Speaking mock',
    description: 'Part 1, 2, and 3 with sample prompts and recording.',
    href: '/mock/speaking',
    skill: 'Speaking',
  },
];

export default function MockTestsIndex() {
  const handleClick = (slug: string, skill: string) => {
    track('mock_test_open', { slug, skill });
  };

  return (
    <>
      <Head>
        <title>Mock Tests • IELTS (Full + Modules)</title>
        <meta
          name="description"
          content="Start a full IELTS mock or pick a module drill."
        />
      </Head>

      <main className="bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
        {/* HERO */}
        <section className="pb-14 pt-16 md:pt-20">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-ds-full bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
                  <Icon name="Timer" size={14} />
                  <span>Full + module mocks</span>
                </div>

                <div className="space-y-3">
                  <h1 className="font-slab text-display text-gradient-primary">IELTS mocks</h1>
                  <p className="max-w-xl text-body text-grayish">
                    Choose the quickest path: run the full exam or jump into a single module. Every attempt saves to your analytics.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 pt-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2 rounded-ds-full bg-muted px-3 py-1">
                    <Icon name="Sparkles" size={14} /> AI scoring where available
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-ds-full bg-muted px-3 py-1">
                    <Icon name="RefreshCcw" size={14} /> Autosave on by default
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Button asChild variant="primary" size="lg" className="rounded-ds-2xl px-6">
                    <Link href="/mock/full" onClick={() => handleClick('full-mock', 'Full')}>
                      Start full mock
                    </Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg" className="rounded-ds-2xl px-6">
                    <Link href="#mock-catalog">Browse module mocks</Link>
                  </Button>
                </div>
              </div>

              <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Quick start</p>
                    <h2 className="font-slab text-h3">Pick and go</h2>
                  </div>
                  <Badge variant="accent" size="sm">
                    Popular
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3">
                  {topPicks.map((mock) => (
                    <Card key={mock.slug} className="card-surface rounded-ds-xl border border-border/60 bg-card p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{mock.skill}</p>
                          <p className="font-semibold text-foreground">{mock.title}</p>
                          <p className="text-small text-muted-foreground">{mock.description}</p>
                        </div>
                        <Badge variant={mock.skill === 'Full' ? 'success' : 'info'} size="sm">
                          {mock.skill}
                        </Badge>
                      </div>
                      <div className="mt-3">
                        <Button
                          asChild
                          variant="secondary"
                          size="sm"
                          className="rounded-ds"
                          onClick={() => handleClick(mock.slug, mock.skill)}
                        >
                          <Link href={mock.href}>Start</Link>
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </div>
          </Container>
        </section>

        {/* MOCK CATALOG */}
        <section id="mock-catalog" className="pb-18">
          <Container>
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-slab text-h2">Choose a module</h2>
                <p className="text-small text-grayish">Each option opens directly in the mock workspace.</p>
              </div>
              <Badge variant="neutral" size="sm">Saves to analytics</Badge>
            </div>

            {mockTests.length === 0 ? (
              <Card className="card-surface rounded-ds-2xl p-8">
                <div className="flex flex-col gap-3">
                  <h3 className="text-h4 font-semibold">Nothing here yet</h3>
                  <p className="text-body opacity-90">
                    We’re assembling the best mocks for you. In the meantime, explore practice by skill.
                  </p>
                  <div className="mt-2 flex gap-3">
                    <Button variant="primary" className="rounded-ds" asChild>
                      <Link href="/practice">Go to Practice Hub</Link>
                    </Button>
                    <Button variant="secondary" className="rounded-ds" asChild>
                      <Link href="/study-plan">Set Study Plan</Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <ul
                role="list"
                className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                aria-label="Available mock tests"
              >
                {mockTests.map((m) => {
                  const headingId = `mock-${m.slug}`;
                  return (
                    <li key={m.slug} role="listitem">
                      <Card
                        as="article"
                        className="group card-surface h-full rounded-ds-2xl border border-border/60 bg-card/70 p-6 transition hover:-translate-y-1 hover:bg-card/90 hover:shadow-lg"
                        aria-labelledby={headingId}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{m.skill}</p>
                            <h3 id={headingId} className="text-h3 font-semibold">
                              {m.title}
                            </h3>
                          </div>
                          <Badge variant={m.skill === 'Full' ? 'success' : 'info'} size="sm" aria-label={`Skill: ${m.skill}`}>
                            {m.skill}
                          </Badge>
                        </div>

                        <p className="mt-2 text-body opacity-90">{m.description}</p>

                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-2 rounded-ds-full bg-muted px-3 py-1">
                            <Icon name="Activity" size={14} /> Saves automatically
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-ds-full bg-muted px-3 py-1">
                            <Icon name="Sparkles" size={14} /> AI hints
                          </span>
                        </div>

                        <div className="mt-5">
                          <Button
                            variant="primary"
                            className="rounded-ds"
                            asChild
                            data-testid={`open-${m.slug}`}
                            onClick={() => handleClick(m.slug, m.skill)}
                          >
                            <Link href={m.href}>
                              <span className="sr-only">Open {m.title} — </span>
                              {m.skill === 'Full' ? 'Start full mock' : 'Open mock'}
                            </Link>
                          </Button>
                        </div>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            )}
          </Container>
        </section>
      </main>
    </>
  );
}
