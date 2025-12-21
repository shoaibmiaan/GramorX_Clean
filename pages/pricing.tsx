import Head from 'next/head';
import Link from 'next/link';
import * as React from 'react';

import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Container } from '@/components/design-system/Container';
import { Section } from '@/components/design-system/Section';
import type { PlanTier } from '@/lib/plans';

const plans: Array<{
  id: PlanTier;
  name: string;
  price: string;
  description: string;
  cta: string;
  features: string[];
  highlight?: boolean;
}> = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    description: 'Practice the basics with limited AI feedback and drills.',
    cta: '/pricing?plan=free',
    features: ['Daily practice prompts', 'Limited AI feedback', 'Community access'],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$12',
    description: 'Unlock full practice sets and quicker feedback loops.',
    cta: '/pricing?plan=basic',
    features: ['All Free features', 'Full mock library', 'Standard AI feedback'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29',
    description: 'Designed for serious prep with deeper insights and reports.',
    cta: '/pricing?plan=pro',
    highlight: true,
    features: ['Everything in Basic', 'Advanced analytics', 'Unlimited saves & notes'],
  },
  {
    id: 'elite',
    name: 'Elite',
    price: '$59',
    description: 'For teams and coaches who need the highest limits.',
    cta: '/pricing?plan=elite',
    features: ['All Pro features', 'Priority support', 'Collaboration tools'],
  },
];

const featureList = [
  'Unlimited reading practice',
  'Writing and speaking feedback',
  'Vocab drills and streak tracking',
  'Progress analytics dashboard',
];

const PricingPage: React.FC = () => (
  <>
    <Head>
      <title>Pricing | GramOrX</title>
      <meta name="description" content="Choose the plan that fits your IELTS prep." />
    </Head>

    <Section className="bg-gradient-to-b from-background to-background/60">
      <Container className="space-y-12 py-12">
        <div className="space-y-4 text-center">
          <Badge tone="info">Flexible tiers</Badge>
          <h1 className="text-h1 font-bold text-foreground sm:text-display">Plans for every stage</h1>
          <p className="text-h4 text-muted-foreground">
            Start free and upgrade when you need more feedback, analytics, and coaching support.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              padding="lg"
              className={plan.highlight ? 'border-primary/60 shadow-xl shadow-primary/10' : 'border-border'}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-small font-semibold uppercase tracking-wide text-muted-foreground">{plan.name}</p>
                  <p className="text-h1 font-bold text-foreground">{plan.price}<span className="text-body font-medium text-muted-foreground">/mo</span></p>
                </div>
                {plan.highlight ? <Badge tone="primary">Most popular</Badge> : null}
              </div>
              <p className="mt-3 text-small text-muted-foreground">{plan.description}</p>
              <div className="mt-6 space-y-2">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2 text-small text-foreground">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-primary" aria-hidden />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Button href={plan.cta} variant={plan.highlight ? 'primary' : 'secondary'} fullWidth>
                  {plan.id === 'free' ? 'Get started' : 'Upgrade'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card padding="lg" className="border-dashed border-border bg-card/60">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-h2 font-semibold text-foreground">Need help choosing?</h2>
              <p className="text-muted-foreground">
                Every plan includes the essentials below. Start with Free and upgrade anytime from your dashboard.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-small text-muted-foreground">
              {featureList.map((feature) => (
                <span key={feature} className="rounded-full bg-muted px-3 py-1 text-foreground">
                  {feature}
                </span>
              ))}
            </div>
            <Button as={Link} href="/pricing" variant="ghost">
              View full comparison
            </Button>
          </div>
        </Card>
      </Container>
    </Section>
  </>
);

export default PricingPage;
