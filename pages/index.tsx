// pages/index.tsx - ULTIMATE VERSION
import React, { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import type { GetServerSideProps } from 'next';
import type { HomeProps } from '@/types/home';
import { createGuestHomeProps } from '@/lib/home';
import { useLocale } from '@/lib/locale';
import { getLaunchMsUTC } from '@/lib/config/launchDate';

// Error Boundary for robust error handling
class HomeErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Home page error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Something went wrong</h1>
            <button
              onClick={() => window.location.reload()}
              className="bg-electricBlue text-white px-6 py-3 rounded-full hover:bg-electricBlue/80 transition"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Optimized dynamic imports with proper loading states
const Hero = dynamic(() => import('@/components/sections/Hero'), {
  ssr: true,
  loading: () => <HeroSkeleton />,
});

const SocialProof = dynamic(() => import('@/components/sections/SocialProof'), {
  ssr: true,
  loading: () => <SectionSkeleton height="h-20" />,
});

const ProblemSolution = dynamic(() => import('@/components/sections/ProblemSolution'), {
  ssr: true,
  loading: () => <SectionSkeleton />,
});

const HowItWorks = dynamic(() => import('@/components/sections/HowItWorks'), {
  ssr: true,
  loading: () => <SectionSkeleton />,
});

const FeaturePillars = dynamic(() => import('@/components/sections/FeaturePillars'), {
  ssr: true,
  loading: () => <SectionSkeleton />,
});

const Testimonials = dynamic(() => import('@/components/sections/Testimonials'), {
  ssr: true,
  loading: () => <SectionSkeleton />,
});

const Pricing = dynamic(() => import('@/components/sections/Pricing'), {
  ssr: true,
  loading: () => <SectionSkeleton />,
});

const Waitlist = dynamic(() => import('@/components/sections/Waitlist'), {
  ssr: true,
  loading: () => <SectionSkeleton />,
});

// Enhanced skeleton components
function HeroSkeleton() {
  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-surface via-lightBg to-white/40 dark:from-dark/95 dark:via-dark/80 dark:to-dark/90">
      <div className="container mx-auto px-4 pt-32 pb-20">
        <div className="animate-pulse">
          <div className="h-6 w-48 bg-gray-300 rounded-full mb-8"></div>
          <div className="h-12 bg-gray-300 rounded-lg mb-4 max-w-2xl"></div>
          <div className="h-12 bg-gray-300 rounded-lg mb-6 max-w-3xl"></div>
          <div className="h-6 bg-gray-200 rounded mb-8 max-w-xl"></div>
          <div className="flex gap-4 mb-8">
            <div className="h-12 bg-gray-300 rounded-full w-48"></div>
            <div className="h-12 bg-gray-200 rounded-full w-48"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionSkeleton({ height = "h-96" }: { height?: string }) {
  return (
    <div className={`py-24 bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 ${height}`}>
      <div className="container mx-auto px-4">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-300 rounded-lg mx-auto mb-6"></div>
          <div className="h-4 w-96 bg-gray-200 rounded mx-auto mb-12"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Main home page component
export default function HomePage({ serverNowMsUTC, launchMsUTC }: HomeProps) {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);

  // Track page performance and user behavior
  useEffect(() => {
    setMounted(true);

    // Track page load performance
    const measurePerf = () => {
      if (window.performance) {
        const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        const loadTime = navTiming.loadEventEnd - navTiming.loadEventStart;

        // Send to analytics
        if (loadTime > 0) {
          console.log(`Page load time: ${loadTime}ms`);
          // track('page_load', { loadTime, page: 'home' });
        }
      }
    };

    // Track section visibility
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          // track('section_view', { section: sectionId, visibility: entry.intersectionRatio });
        }
      });
    }, { threshold: [0.1, 0.5, 1.0] });

    // Observe all main sections
    document.querySelectorAll('section[id]').forEach(section => {
      observer.observe(section);
    });

    measurePerf();

    return () => observer.disconnect();
  }, []);

  // Enhanced smooth scroll with error handling
  useEffect(() => {
    if (!mounted) return;

    const handleSmoothScroll = (ev: MouseEvent) => {
      const target = ev.target as HTMLElement | null;
      const anchor = target?.closest<HTMLAnchorElement>('a[href^="#"]');

      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const targetId = href.slice(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        ev.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // Update URL without pushing to history for main navigation
        if (targetId !== 'main') {
          window.history.replaceState(null, '', href);
        }
      }
    };

    document.addEventListener('click', handleSmoothScroll, { passive: false });
    return () => document.removeEventListener('click', handleSmoothScroll);
  }, [mounted]);

  return (
    <HomeErrorBoundary
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-lightBg dark:bg-dark">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-foreground mb-4">Temporary Glitch</h1>
            <p className="text-muted-foreground mb-6">We're having trouble loading the page. Please try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-electricBlue text-white px-6 py-3 rounded-full hover:bg-electricBlue/80 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      }
    >
      <>
        <Head>
          <title>{t('home.title') || 'Gramor - AI-Powered IELTS Preparation Platform'}</title>
          <meta
            name="description"
            content="Achieve your target IELTS band with personalized AI coaching, real exam simulation, and expert feedback. Join thousands of successful test-takers."
          />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <meta property="og:title" content="Gramor - Your Personalized IELTS Launchpad" />
          <meta property="og:description" content="AI-powered IELTS preparation with instant feedback, adaptive learning, and guaranteed score improvement." />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />

          {/* Structured Data for SEO */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "EducationalOrganization",
                "name": "Gramor",
                "description": "AI-powered IELTS preparation platform",
                "url": "https://gramor.com",
                "logo": "https://gramor.com/logo.png",
                "sameAs": [],
                "address": {
                  "@type": "PostalAddress",
                  "addressCountry": "PK"
                }
              })
            }}
          />
        </Head>

        {/* Skip to main content for accessibility */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-3 focus:text-foreground focus:shadow-lg focus:border focus:border-electricBlue transition-all duration-200"
        >
          Skip to main content
        </a>

        <main id="main" className="min-h-[100dvh]">
          {/* Hero Section - Primary Conversion */}
          <section
            id="hero"
            aria-labelledby="hero-heading"
            className="relative overflow-hidden"
          >
            <Hero
              serverNowMsUTC={serverNowMsUTC}
              launchMsUTC={launchMsUTC}
            />
          </section>

          {/* Social Proof - Trust Building */}
          <section
            id="social-proof"
            aria-labelledby="social-proof-heading"
            className="py-12 bg-white/50 dark:bg-dark/40 border-y border-border/30"
          >
            <SocialProof />
          </section>

          {/* Problem/Solution - Pain Point Addressing */}
          <section
            id="problem-solution"
            aria-labelledby="problem-solution-heading"
            className="py-24 bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90"
          >
            <ProblemSolution />
          </section>

          {/* How It Works - Process Explanation */}
          <section
            id="how-it-works"
            aria-labelledby="how-it-works-heading"
            className="py-24 bg-white/70 dark:bg-dark/60"
          >
            <HowItWorks />
          </section>

          {/* Feature Pillars - Core Value Proposition */}
          <section
            id="features"
            aria-labelledby="features-heading"
            className="py-24 bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90"
          >
            <FeaturePillars />
          </section>

          {/* Testimonials - Social Validation */}
          <section
            id="testimonials"
            aria-labelledby="testimonials-heading"
            className="py-24 bg-white/70 dark:bg-dark/60"
          >
            <Testimonials />
          </section>

          {/* Pricing - Clear Options */}
          <section
            id="pricing"
            aria-labelledby="pricing-heading"
            className="py-24 bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90"
          >
            <Pricing />
          </section>

          {/* Final Waitlist CTA - Conversion Focus */}
          <section
            id="waitlist"
            aria-labelledby="waitlist-heading"
            className="py-24 bg-gradient-to-br from-electricBlue/5 via-purpleVibe/5 to-neonGreen/5"
          >
            <Waitlist />
          </section>
        </main>

        {/* Performance monitoring */}
        {mounted && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Performance monitoring
                if ('performance' in window) {
                  const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                      if (entry.entryType === 'largest-contentful-paint') {
                        console.log('LCP:', entry.startTime);
                        // track('web_vitals', { metric: 'LCP', value: entry.startTime });
                      }
                    });
                  });
                  observer.observe({ entryTypes: ['largest-contentful-paint'] });
                }
              `
            }}
          />
        )}
      </>
    </HomeErrorBoundary>
  );
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async (context) => {
  try {
    const launchMsUTC = Math.floor(getLaunchMsUTC());
    const serverNowMsUTC = Date.now();

    // Set cache headers for performance
    context.res.setHeader(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    );

    return {
      props: createGuestHomeProps({
        serverNowMsUTC,
        launchMsUTC,
      }),
    };
  } catch (error) {
    console.error('Home page SSR error:', error);

    // Fallback props if SSR fails
    return {
      props: createGuestHomeProps({
        serverNowMsUTC: Date.now(),
        launchMsUTC: Math.floor(getLaunchMsUTC()),
      }),
    };
  }
};