// components/sections/Hero.tsx
'use client';

import React from 'react';
import { Container } from '@/components/design-system/Container';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Icon } from '@/components/design-system/Icon';
import { LaunchCountdown } from '@/components/launch/LaunchCountdown';

const primaryFeatures = [
  {
    icon: 'BrainCircuit',
    label: 'AI-Powered Learning',
    description: 'Adaptive plans that focus on your weak areas'
  },
  {
    icon: 'Zap',
    label: 'Instant Feedback',
    description: 'Get detailed scoring in seconds, not days'
  },
  {
    icon: 'Target',
    label: 'Guaranteed Results',
    description: '1.5 band average improvement or your money back'
  }
];

export type HeroProps = {
  serverNowMsUTC: number;
  launchMsUTC: number;
};

export const Hero: React.FC<HeroProps> = ({ serverNowMsUTC, launchMsUTC }) => {
  const scrollToWaitlist = () => {
    const waitlistSection = document.getElementById('waitlist');
    if (waitlistSection) {
      waitlistSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-electricBlue/5 via-white to-purpleVibe/5 dark:from-dark/95 dark:via-dark/80 dark:to-purple-900/20">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-electricBlue/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-purpleVibe/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-neonGreen/5 rounded-full blur-3xl"></div>
      </div>

      <Container className="relative z-10">
        <div className="py-20 md:py-28 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content - Primary Conversion */}
            <div className="text-center lg:text-left">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-electricBlue/30 bg-white/80 dark:bg-dark/40 px-4 py-2 text-sm font-medium text-electricBlue shadow-sm backdrop-blur mb-6">
                <Icon name="Sparkles" className="text-electricBlue" />
                Trusted by 18,000+ IELTS test-takers
              </div>

              {/* Main Headline */}
              <h1 className="font-slab text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-foreground mb-6">
                Achieve Your{' '}
                <span className="text-gradient-primary">Target IELTS Band</span>{' '}
                Faster with AI
              </h1>

              {/* Subheadline */}
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl">
                Personalized coaching, instant feedback, and real exam simulation 
                to help you reach your band score in weeks, not months.
                <strong className="text-foreground block mt-2">
                  Join the waitlist for early access and founding member perks.
                </strong>
              </p>

              {/* Primary Features */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {primaryFeatures.map((feature, index) => (
                  <div 
                    key={feature.label}
                    className="text-center lg:text-left"
                    data-aos="fade-up"
                    data-aos-delay={index * 100}
                  >
                    <div className="flex justify-center lg:justify-start mb-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-electricBlue to-purpleVibe flex items-center justify-center text-white">
                        <Icon name={feature.icon} size={20} />
                      </div>
                    </div>
                    <h3 className="font-semibold text-foreground text-sm mb-1">
                      {feature.label}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div 
                className="flex flex-col sm:flex-row gap-4 mb-8"
                data-aos="fade-up"
                data-aos-delay="300"
              >
                <Button 
                  onClick={scrollToWaitlist}
                  variant="primary" 
                  size="lg"
                  className="flex-1 justify-center py-4 text-lg font-semibold shadow-lg shadow-electricBlue/20 hover:shadow-electricBlue/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <Icon name="Star" className="mr-2" />
                  Join Waitlist - Get Early Access
                </Button>
                <Button 
                  href="#features"
                  variant="outline" 
                  size="lg"
                  className="flex-1 justify-center py-4 text-lg font-semibold border-2"
                >
                  <Icon name="PlayCircle" className="mr-2" />
                  See How It Works
                </Button>
              </div>

              {/* Trust Indicators */}
              <div 
                className="flex flex-wrap justify-center lg:justify-start items-center gap-6 text-sm text-muted-foreground"
                data-aos="fade-up"
                data-aos-delay="400"
              >
                <div className="flex items-center gap-2">
                  <Icon name="ShieldCheck" className="text-green-500" />
                  Score Improvement Guarantee
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Clock" className="text-blue-500" />
                  No Credit Card Required
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Users" className="text-purple-500" />
                  1.5 Band Average Improvement
                </div>
              </div>
            </div>

            {/* Right Content - Social Proof & Urgency */}
            <div className="space-y-6">
              {/* Launch Countdown Card */}
              <Card 
                className="border border-electricBlue/30 bg-white/80 dark:bg-dark/70 p-6 shadow-xl backdrop-blur"
                data-aos="fade-left"
                data-aos-delay="200"
              >
                <div className="text-center mb-4">
                  <div className="inline-flex items-center gap-2 bg-electricBlue/10 text-electricBlue px-3 py-1 rounded-full text-sm font-semibold mb-2">
                    <Icon name="Rocket" size={16} />
                    Limited Early Access
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Founding Member Spots Filling Fast
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Join now to lock in special pricing and perks
                  </p>
                </div>
                
                <LaunchCountdown 
                  serverNowMsUTC={serverNowMsUTC} 
                  launchMsUTC={launchMsUTC} 
                />

                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                    <Icon name="AlertTriangle" size={16} />
                    <span className="font-semibold">Early Bird Perks:</span>
                    <span>30% off first 3 months + Priority onboarding</span>
                  </div>
                </div>
              </Card>

              {/* Social Proof Card */}
              <Card 
                className="border border-border/60 bg-white/70 dark:bg-dark/70 p-6 shadow-lg backdrop-blur"
                data-aos="fade-left"
                data-aos-delay="400"
              >
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Icon name="TrendingUp" className="text-green-500" />
                  Real Results from Our Community
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Average Band Improvement</span>
                    <span className="font-slab font-bold text-green-600">+1.5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <span className="font-slab font-bold text-blue-600">94%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Feedback Speed</span>
                    <span className="font-slab font-bold text-purple-600">&lt; 4 hours</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/30">
                  <div className="flex -space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <div 
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-electricBlue to-purpleVibe border-2 border-white dark:border-dark flex items-center justify-center text-white text-xs font-bold"
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    ))}
                    <div className="w-8 h-8 rounded-full bg-muted border-2 border-white dark:border-dark flex items-center justify-center text-muted-foreground text-xs">
                      +18K
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Join learners from 120+ countries
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default Hero;