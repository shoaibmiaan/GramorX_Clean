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

const features = [
  {
    title: 'Official timings, flexible modes',
    description:
      'Switch between simulation mode (strict timing + focus locks) and practice mode (pauses, hints, and instant marking).',
    icon: 'Timer',
  },
  {
    title: 'AI-scored feedback',
    description:
      'Writing and Speaking attempts return band estimates, key strengths, and a shortlist of fixes you can apply immediately.',
    icon: 'Gauge',
  },
  {
    title: 'Smart review workspace',
    description:
      'Step through answers with transcripts, vocabulary taps, and annotations — everything you need to close the loop.',
    icon: 'NotebookPen',
  },
];

const perks = [
  {
    label: 'Full + module-wise mocks',
    icon: 'LayoutDashboard',
  },
  {
    label: 'Auto-save & resume',
    icon: 'RefreshCcw',
  },
  {
    label: 'Band-aligned analytics',
    icon: 'Sparkles',
  },
  {
    label: 'Cheating-safe exam workspace',
    icon: 'ShieldCheck',
  },
];

const highlights = [
  {
    title: 'Resume without losing progress',
    description:
      'Exit mid-paper and continue later; answers, timers, and notes stay intact so you can fit mocks around your schedule.',
    icon: 'Clock3',
  },
  {
    title: 'Band trajectory insights',
    description:
      'Module analytics compare your recent attempts to highlight weak question types and time sinks.',
    icon: 'TrendingUp',
  },
  {
    title: 'Balanced prep',
    description:
      'Full-length exam rehearsals plus rapid module drills keep stamina and precision sharp before test day.',
    icon: 'Dumbbell',
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
          content="Full-length IELTS mocks and module-wise practice with AI scoring, analytics, and review."
        />
      </Head>

      <main className="bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
        {/* HERO */}
        <section className="pb-16 pt-16 md:pt-20">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-ds-full bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon name="Timer" size={14} />
                  </span>
                  <span>Full + module mocks • IELTS Academic & GT</span>
                </div>

                <div className="space-y-4">
                  <h1 className="font-slab text-display text-gradient-primary">IELTS mock HQ</h1>
                  <p className="max-w-xl text-body text-grayish">
                    Simulate the full exam or drill a specific skill — all with AI scoring, guided review, and analytics that match
                    the rest of your GramorX dashboard.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-small text-muted-foreground">
                  {perks.map((item) => (
                    <span key={item.label} className="inline-flex items-center gap-2 rounded-ds-full bg-muted px-3 py-1">
                      <Icon name={item.icon as any} size={14} /> {item.label}
                    </span>
                  ))}
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

                <div className="flex flex-wrap items-center gap-3 pt-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Icon name="Stars" size={14} /> Band-targeted pacing + hints in practice mode
                  </span>
                  <span className="hidden md:inline">•</span>
                  <span className="inline-flex items-center gap-1">
                    <Icon name="Smartphone" size={14} /> Works on desktop + mobile with offline-safe saves
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Mock mix</p>
                      <h2 className="font-slab text-h3">Choose your flow</h2>
                    </div>
                    <Badge variant="accent" size="sm">
                      Adaptive
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-ds-full bg-primary/10 p-2 text-primary">
                        <Icon name="Radio" size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Simulation</p>
                        <p className="text-small text-muted-foreground">
                          Timers stay locked and answers reveal after submission. Perfect for full exam rehearsal.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="rounded-ds-full bg-electricBlue/10 p-2 text-electricBlue">
                        <Icon name="Wand" size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Practice</p>
                        <p className="text-small text-muted-foreground">
                          Pause, peek at hints, and see answers as you go. Ideal for learning the patterns before you sprint.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div className="rounded-ds-xl bg-muted px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.2em]">Autosave</p>
                      <p className="font-semibold text-foreground">Resume anytime</p>
                    </div>
                    <div className="rounded-ds-xl bg-muted px-3 py-2">
                      <p className="text-xs uppercase tracking-[0.2em]">Analytics</p>
                      <p className="font-semibold text-foreground">Band & time charts</p>
                    </div>
                  </div>
                </Card>

                <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Quick next step
                      </p>
                      <p className="text-small text-grayish">
                        Jump back into your last module or take the full-length rehearsal.
                      </p>
                    </div>
                    <div className="rounded-ds-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      Popular choices
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {mockTests.slice(0, 2).map((m) => (
                      <Card key={m.slug} className="card-surface rounded-ds-xl p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{m.skill}</p>
                            <p className="font-semibold text-foreground">{m.title}</p>
                          </div>
                          <Badge variant={m.skill === 'Full' ? 'success' : 'info'} size="sm">
                            {m.skill === 'Full' ? 'Full flow' : 'Module'}
                          </Badge>
                        </div>
                        <p className="mt-2 text-small text-muted-foreground">{m.description}</p>
                        <div className="mt-3">
                          <Button
                            asChild
                            variant="secondary"
                            size="sm"
                            className="rounded-ds"
                            onClick={() => handleClick(m.slug, m.skill)}
                          >
                            <Link href={m.href}>Open</Link>
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </Container>
        </section>

        {/* MOCK CATALOG */}
        <section id="mock-catalog" className="pb-16">
          <Container>
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-slab text-h2">Jump into a mock</h2>
                <p className="text-small text-grayish">
                  Pick a full exam or drill by module. Each run feeds into your analytics and saved responses.
                </p>
              </div>
              <Badge variant="neutral" size="sm">
                AI scoring where applicable
              </Badge>
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
                      <Card as="article" className="group card-surface h-full rounded-ds-2xl border border-border/60 bg-card/70 p-6 transition hover:-translate-y-1 hover:bg-card/90 hover:shadow-lg" aria-labelledby={headingId}>
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

                        <div className="mt-6 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-2">
                            <Icon name="Activity" size={14} />
                            Saves to analytics
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Icon name="Sparkles" size={14} />
                            AI hints
                          </span>
                        </div>

                        <div className="mt-6">
                          <Button
                            variant="primary"
                            className="rounded-ds"
                            asChild
                            data-testid={`open-${m.slug}`}
                            onClick={() => handleClick(m.slug, m.skill)}
                          >
                            <Link href={m.href}>
                              <span className="sr-only">Open {m.title} — </span>
                              {m.skill === 'Full' ? 'Start full mock' : 'Open practice'}
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

        {/* WHY THIS MATTERS */}
        <section className="pb-20">
          <Container>
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-slab text-h2">Built to mirror the real exam</h2>
                <p className="text-small text-grayish">
                  Consistent UI with your main home page so you know exactly where to focus before test day.
                </p>
              </div>
              <Badge variant="secondary" size="sm">
                No surprise layouts
              </Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="card-surface h-full rounded-ds-2xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-ds-full bg-primary/10 p-2 text-primary">
                      <Icon name={feature.icon as any} size={16} />
                    </div>
                    <h3 className="text-h5 font-semibold text-foreground">{feature.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              ))}
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {highlights.map((item) => (
                <Card key={item.title} className="card-surface h-full rounded-ds-2xl border border-border/60 bg-card/70 p-5">
                  <div className="inline-flex items-center gap-2 rounded-ds-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    <Icon name={item.icon as any} size={14} />
                    {item.title}
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      </main>
    </>
  );
}
