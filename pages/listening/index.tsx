// pages/listening/index.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

type ListeningDashboardProps = {
  userFirstName: string | null;
};

export const getServerSideProps: GetServerSideProps<ListeningDashboardProps> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=/listening`,
        permanent: false,
      },
    };
  }

  const rawName =
    (user.user_metadata && (user.user_metadata.full_name as string | undefined)) ??
    (user.user_metadata && (user.user_metadata.name as string | undefined)) ??
    user.email ??
    '';

  const firstName = rawName.trim().split(' ')[0] || null;

  return {
    props: {
      userFirstName: firstName,
    },
  };
};

const ListeningHomePage: NextPage<ListeningDashboardProps> = ({ userFirstName }) => {
  const nameLabel = userFirstName ?? 'there';

  const modules = [
    {
      key: 'learn',
      label: 'Learning Path',
      href: '/listening/learn',
      icon: 'GraduationCap',
      status: 'Core lessons',
      badge: 'Start here',
      description:
        'Understand IELTS Listening from scratch with structured lessons, tips, traps, and example walk-throughs.',
      highlight: 'Theory + examples + strategies.',
    },
    {
      key: 'practice',
      label: 'Practice Drills',
      href: '/listening/practice',
      icon: 'Headphones',
      status: 'Short tests',
      badge: 'Daily grind',
      description:
        '10–15 question mini tests with instant checking, explanations, and time tracking to build stamina.',
      highlight: 'Unlimited focused drills.',
    },
    {
      key: 'game',
      label: 'Game Mode',
      href: '/listening/game',
      icon: 'Gamepad2',
      status: 'Gamified',
      badge: 'Fun mode',
      description:
        'Fast-ear challenges, clip guessing, and streak-boost missions to make listening practice less boring.',
      highlight: 'XP, streaks, and rewards.',
    },
    {
      key: 'mock',
      label: 'Full Mock Tests',
      href: '/mock/listening',
      icon: 'ClipboardList',
      status: 'Exam-style',
      badge: 'CBE style',
      description:
        'Real IELTS-style 4-section, 40-question, timed mock tests with strict rules and auto-scoring.',
      highlight: 'Exact computer-based exam vibe.',
    },
    {
      key: 'analytics',
      label: 'Analytics & Reports',
      href: '/listening/analytics',
      icon: 'BarChart2',
      status: 'Insights',
      badge: 'Pro view',
      description:
        'Band trajectory, weak question types, time management, and AI-generated improvement plan.',
      highlight: 'Make your prep data-driven.',
    },
  ] as const;

  return (
    <>
      <Head>
        <title>Listening Mission Control • GramorX</title>
        <meta
          name="description"
          content="Central hub for IELTS Listening – learning, practice, games, full mocks, and analytics in one place."
        />
      </Head>

      <main className="min-h-screen bg-background py-10">
        <Container>
          {/* Top hero */}
          <section className="mb-10 space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Icon name="Headphones" size={14} />
              <span>IELTS Listening · Mission Control</span>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  Hi {nameLabel}, let&apos;s fix your Listening first.
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  One place for everything: theory, drills, games, full mocks, and deep analytics. No fluff – just
                  what moves your band.
                </p>
              </div>

              <div className="flex flex-col items-end gap-2 text-right">
                <Badge variant="success" className="flex items-center gap-1">
                  <Icon name="Sparkles" size={14} />
                  <span>Listening module: Priority</span>
                </Badge>
                <p className="text-xs text-muted-foreground">
                  Finish Listening 100% before touching the other modules. That&apos;s the plan.
                </p>
              </div>
            </div>
          </section>

          {/* Quick nav pills */}
          <section aria-label="Listening module navigation" className="mb-8">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/listening/learn"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
              >
                <Icon name="GraduationCap" size={14} />
                Learn
              </Link>
              <Link
                href="/listening/practice"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
              >
                <Icon name="Headphones" size={14} />
                Practice
              </Link>
              <Link
                href="/listening/game"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
              >
                <Icon name="Gamepad2" size={14} />
                Game Mode
              </Link>
              <Link
                href="/mock/listening"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
              >
                <Icon name="ClipboardList" size={14} />
                Full Mock
              </Link>
              <Link
                href="/listening/analytics"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground hover:border-primary hover:text-primary"
              >
                <Icon name="BarChart2" size={14} />
                Analytics
              </Link>
            </div>
          </section>

          {/* Modules grid */}
          <section aria-label="Listening module areas">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {modules.map((module) => (
                <Card
                  key={module.key}
                  className="flex h-full flex-col justify-between border-border bg-card/60 shadow-sm transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Icon name={module.icon} size={18} className="text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-semibold text-foreground sm:text-base">
                            {module.label}
                          </h2>
                          <Badge variant="neutral" size="sm">
                            {module.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                          {module.description}
                        </p>
                      </div>
                    </div>

                    <Badge variant="primary" size="sm" className="shrink-0">
                      {module.badge}
                    </Badge>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-muted-foreground sm:text-xs">
                      {module.highlight}
                    </p>
                    <Link
                      href={module.href}
                      className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
                    >
                      <span>Go</span>
                      <Icon name="ArrowRight" size={14} />
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Bottom note */}
          <section className="mt-10 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground sm:text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p>
                Workflow: <span className="font-medium text-foreground">Learn → Practice → Game → Mock → Analytics</span>.
                Don&apos;t skip steps if you actually care about your score.
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground">
                <Icon name="Info" size={12} />
                Listening is the first module we&apos;re taking to 100%.
              </span>
            </div>
          </section>
        </Container>
      </main>
    </>
  );
};

export default ListeningHomePage;
