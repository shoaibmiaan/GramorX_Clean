import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

const elitePlanOverview = {
  title: 'Elite Plan',
  subtitle: 'For students who actually want a 7.5+ band, not just vibes.',
  description:
    'Locked-in structure, full mocks, AI feedback, and human teacher support – all in one ruthless upgrade.',
  status: 'Best for 7+ Band',
  statusTone: 'success' as const,
};

const elitePlanHighlights = [
  'Unlimited AI practice for all 4 modules',
  '4+ full-length mock tests per month',
  'Band estimates + analytics dashboard',
  'Speaking & Writing checked by teachers',
];

const eliteWhatYouGet = [
  {
    title: 'Full Mock Test Access',
    description: 'All Listening, Reading, Writing, and Speaking mocks with realistic exam timing.',
    icon: 'Timer',
  },
  {
    title: 'AI + Teacher Feedback',
    description: 'AI scores instantly, teachers give deep corrections on high-priority attempts.',
    icon: 'UserCheck',
  },
  {
    title: 'Band Target Roadmap',
    description: 'Personalised study plan from your current level to your target band.',
    icon: 'Goal',
  },
  {
    title: 'Analytics Dashboard',
    description: 'Track weak question types, timing issues, and band trends over time.',
    icon: 'BarChart2',
  },
  {
    title: 'Speaking Lab',
    description: 'Record answers, get instant band estimate, and sample “9 band” model responses.',
    icon: 'Mic',
  },
  {
    title: 'Writing Clinic',
    description: 'Task 1 + Task 2 breakdowns with structure, cohesion, and vocabulary tips.',
    icon: 'PenSquare',
  },
];

const eliteCompare = [
  {
    tier: 'Starter',
    tag: 'For casual practice',
    price: '$0',
    billing: 'Limited access',
    bullets: [
      'Basic practice questions',
      'Limited AI feedback',
      'No full mock tests',
      'No teacher review',
    ],
    cta: 'View Starter',
    href: '/pricing#starter',
    featured: false,
  },
  {
    tier: 'Elite',
    tag: 'Most popular',
    price: '$39',
    billing: 'per month',
    bullets: [
      'All 4-module mock tests',
      'Unlimited AI corrections',
      'Monthly teacher reviews',
      'Target band strategy sessions',
    ],
    cta: 'Start Elite Plan',
    href: '/signup?plan=elite',
    featured: true,
  },
  {
    tier: 'Pro Team',
    tag: 'For coaching centers',
    price: 'Custom',
    billing: 'per month',
    bullets: [
      'Multi-student dashboards',
      'Teacher admin tools',
      'White-label options',
      'Priority support',
    ],
    cta: 'Talk to Sales',
    href: '/contact?sales=pro-team',
    featured: false,
  },
];

const eliteFAQs = [
  {
    q: 'Is Elite Plan enough if my target is overall 7+?',
    a: 'Yes – if you actually use it. Elite gives you full mocks, AI feedback, and teacher review. The limiting factor will be your discipline, not the features.',
  },
  {
    q: 'How many mock tests can I take?',
    a: 'You can take all module-wise mocks freely. Full 4-module mocks are fairly capped per month to keep analytics clean and prevent burnout.',
  },
  {
    q: 'Do teachers check all my attempts?',
    a: 'No. AI checks everything. Teachers go deep on your priority attempts so the feedback is actually detailed and useful, not rushed.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. No long-term contracts, no hidden nonsense. Cancel from your account settings before the next billing cycle.',
  },
];

const ElitePlanPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>GramorX AI — Elite Plan</title>
        <meta
          name="description"
          content="Upgrade to the Elite IELTS plan with full mock tests, AI feedback, and teacher support for serious band improvements."
        />
      </Head>

      <main className="bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
        {/* Hero Section */}
        <section className="pb-16 pt-16 md:pt-20">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-center">
              {/* Left */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-ds-full bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon name="Zap" size={14} />
                  </span>
                  <span>{elitePlanOverview.status} • Elite IELTS Plan</span>
                </div>

                <div className="space-y-3">
                  <h1 className="font-slab text-display text-gradient-primary">
                    {elitePlanOverview.title}
                  </h1>
                  <p className="max-w-xl text-sm font-semibold text-primary/90">
                    {elitePlanOverview.subtitle}
                  </p>
                  <p className="max-w-xl text-body text-grayish">
                    {elitePlanOverview.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Button asChild variant="primary" size="lg" className="rounded-ds-2xl px-6">
                    <Link href="/signup?plan=elite">Start Elite Plan</Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg" className="rounded-ds-2xl px-6">
                    <Link href="/mock">See All Mock Tests</Link>
                  </Button>
                </div>

                <div className="pt-4">
                  <ul className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {elitePlanHighlights.map((item, idx) => (
                      <li
                        key={idx}
                        className="inline-flex items-center gap-2 rounded-full bg-card/70 px-3 py-1 ring-1 ring-border/60"
                      >
                        <Icon name="Check" size={12} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right – Pricing Card */}
              <div className="space-y-4">
                <Card className="rounded-ds-2xl border border-primary/40 bg-card/90 p-5 shadow-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        Elite Plan
                      </p>
                      <h2 className="font-slab text-h3">Serious prep, no excuses.</h2>
                    </div>
                    <Badge variant="accent" size="sm">
                      Most Popular
                    </Badge>
                  </div>

                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="font-slab text-4xl tracking-tight">$39</span>
                    <span className="text-xs text-muted-foreground">per month</span>
                  </div>

                  <p className="mt-3 text-small text-grayish">
                    Cheaper than one random tutor session, but built to carry your whole prep.
                  </p>

                  <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle2" size={14} className="mt-[2px]" />
                      <span>Full mock access across all modules</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle2" size={14} className="mt-[2px]" />
                      <span>AI feedback on every attempt, in seconds</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle2" size={14} className="mt-[2px]" />
                      <span>Teacher review for your key Speaking &amp; Writing attempts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Icon name="CheckCircle2" size={14} className="mt-[2px]" />
                      <span>Analytics dashboard to monitor band progress</span>
                    </li>
                  </ul>

                  <Button
                    asChild
                    variant="primary"
                    size="lg"
                    className="mt-5 w-full rounded-ds-2xl"
                  >
                    <Link href="/signup?plan=elite">Upgrade to Elite</Link>
                  </Button>

                  <p className="mt-2 text-[11px] text-muted-foreground">
                    No long-term contracts. Cancel anytime from your account settings.
                  </p>
                </Card>
              </div>
            </div>
          </Container>
        </section>

        {/* What You Get */}
        <section className="pb-16">
          <Container>
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-slab text-h2">What’s actually inside Elite?</h2>
                <p className="text-small text-grayish">
                  Not fluff. Just the tools that move your band score.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {eliteWhatYouGet.map((item) => (
                <Card
                  key={item.title}
                  className="flex h-full flex-col gap-3 rounded-ds-2xl border border-border/60 bg-card/80 p-4 transition hover:-translate-y-1 hover:bg-card/95 hover:shadow-lg"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon name={item.icon} size={18} />
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* Compare Plans */}
        <section className="pb-16">
          <Container>
            <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-slab text-h2">Compare plans</h2>
                <p className="text-small text-grayish">
                  See where Elite sits vs casual practice and coaching-center setups.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {eliteCompare.map((plan) => (
                <Card
                  key={plan.tier}
                  className={`flex h-full flex-col justify-between rounded-ds-2xl border bg-card/80 p-5 transition hover:-translate-y-1 hover:shadow-lg ${
                    plan.featured ? 'border-primary/70 ring-1 ring-primary/40' : 'border-border/60'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {plan.tier}
                        </p>
                        <p className="text-[11px] text-grayish">{plan.tag}</p>
                      </div>
                      {plan.featured && (
                        <Badge variant="accent" size="sm">
                          Recommended
                        </Badge>
                      )}
                    </div>

                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="font-slab text-2xl">{plan.price}</span>
                      <span className="text-[11px] text-muted-foreground">{plan.billing}</span>
                    </div>

                    <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                      {plan.bullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Icon name="Check" size={12} className="mt-[2px]" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    asChild
                    variant={plan.featured ? 'primary' : 'secondary'}
                    size="sm"
                    className="mt-5 w-full rounded-ds-2xl"
                  >
                    <Link href={plan.href}>{plan.cta}</Link>
                  </Button>
                </Card>
              ))}
            </div>
          </Container>
        </section>

        {/* FAQ */}
        <section className="pb-20">
          <Container>
            <div className="mb-6 max-w-xl space-y-2">
              <h2 className="font-slab text-h2">Elite Plan — FAQ</h2>
              <p className="text-small text-grayish">
                Read this once so you don’t have to DM us the same questions on Instagram.
              </p>
            </div>

            <div className="space-y-3">
              {eliteFAQs.map((item, idx) => (
                <Card
                  key={idx}
                  className="rounded-ds-2xl border border-border/60 bg-card/80 p-4"
                >
                  <button className="flex w-full items-start justify-between gap-3 text-left">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{item.q}</p>
                      <p className="text-xs text-muted-foreground">{item.a}</p>
                    </div>
                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon name="ChevronDown" size={14} />
                    </span>
                  </button>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      </main>
    </>
  );
};

export default ElitePlanPage;
