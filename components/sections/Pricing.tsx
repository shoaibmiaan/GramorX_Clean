// components/sections/Pricing.tsx
import React, { useState } from 'react';
import { Container } from '@/components/design-system/Container';
import { Section } from '@/components/design-system/Section';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import { Badge } from '@/components/design-system/Badge';

type BillingCycle = 'monthly' | 'quarterly';

const plans = [
  {
    name: 'Starter',
    description: 'Perfect for beginners exploring IELTS preparation',
    monthlyPrice: 'Free',
    quarterlyPrice: 'Free',
    cta: 'Get Started',
    href: '/signup',
    variant: 'outline' as const,
    features: [
      'Basic adaptive learning path',
      '2 AI writing reviews per month',
      'Vocabulary builder',
      'Progress tracking',
      'Community support'
    ],
    popular: false
  },
  {
    name: 'Accelerator',
    description: 'Most popular - Everything you need to achieve your target band',
    monthlyPrice: '$14',
    quarterlyPrice: '$35',
    quarterlySavings: 'Save 15%',
    cta: 'Join Waitlist',
    href: '#waitlist',
    variant: 'primary' as const,
    features: [
      'Full adaptive learning path',
      'Unlimited AI writing reviews',
      'Speaking practice with transcription',
      'Full mock tests with analytics',
      'Priority teacher reviews',
      'Band prediction reports',
      'Email & chat support'
    ],
    popular: true
  },
  {
    name: 'Master',
    description: 'For serious test-takers needing maximum support',
    monthlyPrice: '$29',
    quarterlyPrice: '$69',
    quarterlySavings: 'Save 20%',
    cta: 'Join Waitlist',
    href: '#waitlist',
    variant: 'outline' as const,
    features: [
      'Everything in Accelerator',
      'Weekly 1:1 coaching sessions',
      'Custom study plans',
      'Advanced analytics',
      'Dedicated success manager',
      'Guaranteed band improvement'
    ],
    popular: false
  }
];

const includedFeatures = [
  'AI-powered adaptive learning',
  'Instant writing & speaking feedback',
  'Real exam simulation',
  'Progress tracking & analytics',
  'Mobile app access'
];

export const Pricing: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  return (
    <Section id="pricing">
      <Container>
        <div className="text-center mb-16">
          <Badge variant="info" size="sm" className="mb-4 inline-flex items-center gap-2">
            <Icon name="CreditCard" className="text-electricBlue" />
            Simple, Transparent Pricing
          </Badge>
          <h2 className="font-slab text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose Your Success Path
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start free, upgrade when you're ready to accelerate. All plans include our core AI features.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-2xl bg-muted p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-dark shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('quarterly')}
              className={`px-6 py-3 rounded-2xl text-sm font-semibold transition-all ${
                billingCycle === 'quarterly'
                  ? 'bg-white dark:bg-dark shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Quarterly
              <span className="ml-2 text-xs bg-electricBlue/10 text-electricBlue px-2 py-1 rounded-full">
                Save 15%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative p-6 border-border/60 bg-white/70 dark:bg-dark/70 backdrop-blur ${
                plan.popular
                  ? 'ring-2 ring-electricBlue/50 shadow-xl'
                  : 'hover:shadow-lg transition-shadow'
              }`}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge variant="accent" className="px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="font-slab text-4xl font-bold text-gradient-primary mb-1">
                  {billingCycle === 'monthly' ? plan.monthlyPrice : plan.quarterlyPrice}
                </div>
                <div className="text-sm text-muted-foreground">
                  {billingCycle === 'monthly' ? 'per month' : 'per 3 months'}
                  {plan.quarterlySavings && billingCycle === 'quarterly' && (
                    <div className="text-green-600 font-semibold mt-1">
                      {plan.quarterlySavings}
                    </div>
                  )}
                </div>
              </div>

              {/* CTA Button */}
              <Button
                href={plan.href}
                variant={plan.variant}
                size="lg"
                className="w-full justify-center mb-6"
              >
                {plan.cta}
              </Button>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature, featureIndex) => (
                  <li
                    key={featureIndex}
                    className="flex items-center gap-3 text-sm text-muted-foreground"
                  >
                    <Icon name="CheckCircle" className="text-green-500 flex-shrink-0" size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        {/* Included in All Plans */}
        <div
          className="text-center"
          data-aos="fade-up"
        >
          <Card className="inline-block border border-border/60 bg-background/80 px-8 py-6 max-w-2xl">
            <h3 className="font-semibold text-foreground mb-4">
              Included in All Plans:
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {includedFeatures.map((feature, index) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Icon name="Check" className="text-electricBlue" size={16} />
                  {feature}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Guarantee */}
        <div
          className="text-center mt-12"
          data-aos="fade-up"
        >
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <Icon name="ShieldCheck" className="text-green-500" size={20} />
            <span>
              <strong className="text-foreground">14-day money-back guarantee</strong> on all paid plans
            </span>
          </div>
        </div>
      </Container>
    </Section>
  );
};

export default Pricing;