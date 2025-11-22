// pages/landing/ielts-masterportal.tsx

import React, { useEffect, useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useTheme } from 'next-themes';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

type TimeLeft = {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
};

type WordOfDay = {
  word: string;
  meaning: string;
  example: string;
};

const WORDS: WordOfDay[] = [
  {
    word: 'serendipity',
    meaning: 'the occurrence of events by chance in a happy or beneficial way',
    example: 'Finding this platform was pure serendipity – it helped me achieve my target band!',
  },
  {
    word: 'ubiquitous',
    meaning: 'present, appearing, or found everywhere',
    example: 'Mobile phones have become ubiquitous in modern society.',
  },
  {
    word: 'eloquent',
    meaning: 'fluent or persuasive in speaking or writing',
    example: 'Her eloquent speech impressed the examiners during the speaking test.',
  },
  {
    word: 'pragmatic',
    meaning: 'dealing with things sensibly and realistically',
    example: 'A pragmatic approach to IELTS preparation focuses on the most effective strategies.',
  },
  {
    word: 'diligent',
    meaning: 'showing care and conscientiousness in one’s work or duties',
    example: 'Diligent students who practice daily see the fastest improvement.',
  },
];

const LAUNCH_COUNTDOWN_DAYS = 7;

const IeltsMasterPortalLandingPage: NextPage = () => {
  const { theme, setTheme } = useTheme();

  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: '07',
    hours: '00',
    minutes: '00',
    seconds: '00',
  });

  const [streak, setStreak] = useState<number>(0);
  const [word, setWord] = useState<WordOfDay>(WORDS[0]);
  const [markingToday, setMarkingToday] = useState(false);

  // Countdown timer: always 7 days from *now* (like original)
  useEffect(() => {
    const launchDate = new Date();
    launchDate.setDate(launchDate.getDate() + LAUNCH_COUNTDOWN_DAYS);

    const updateCountdown = () => {
      const now = new Date();
      const diff = launchDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({
          days: '00',
          hours: '00',
          minutes: '00',
          seconds: '00',
        });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor(
        (diff % (1000 * 60 * 60)) / (1000 * 60),
      );
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const format = (value: number) => value.toString().padStart(2, '0');

      setTimeLeft({
        days: format(days),
        hours: format(hours),
        minutes: format(minutes),
        seconds: format(seconds),
      });
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Streak + word-of-day init from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedStreak = window.localStorage.getItem('ieltsStreak');
      const savedLast = window.localStorage.getItem('ieltsLastLearned');

      let initialStreak = 0;
      let lastLearnedDate: Date | null = null;

      if (savedStreak) {
        initialStreak = Number.parseInt(savedStreak, 10) || 0;
      }

      if (savedLast) {
        const parsed = new Date(savedLast);
        if (!Number.isNaN(parsed.getTime())) {
          lastLearnedDate = parsed;
        }
      }

      if (lastLearnedDate) {
        const today = new Date();
        const sameDay =
          today.toDateString() === lastLearnedDate.toDateString();

        // If more than 1 full day has passed without learning, reset streak
        const diffMs = today.getTime() - lastLearnedDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
          initialStreak = 0;
          window.localStorage.setItem('ieltsStreak', '0');
        }

        setMarkingToday(sameDay);
      }

      setStreak(initialStreak);

      // random word
      const randomIndex = Math.floor(Math.random() * WORDS.length);
      setWord(WORDS[randomIndex]);
    } catch {
      // ignore localStorage issues
    }
  }, []);

  const handleToggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next ?? 'dark');
  };

  const handleMarkLearned = () => {
    if (typeof window === 'undefined') return;
    if (markingToday) return;

    const today = new Date();

    setStreak((prev) => {
      const nextStreak = prev + 1;
      try {
        window.localStorage.setItem('ieltsStreak', String(nextStreak));
        window.localStorage.setItem(
          'ieltsLastLearned',
          today.toISOString(),
        );
      } catch {
        // ignore
      }
      return nextStreak;
    });

    setMarkingToday(true);
  };

  const streakValueDollars = (streak * 0.5).toFixed(1);

  return (
    <>
      <Head>
        <title>IELTS MasterPortal • AI-Powered IELTS Prep</title>
        <meta
          name="description"
          content="AI-powered IELTS preparation platform with realistic mocks, band score simulation, and performance analytics."
        />
      </Head>

      <main className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
          <Container className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon name="Globe2" size={18} />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight">
                IELTS MasterPortal
              </span>
            </div>

            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="#modules"
                className="text-sm font-medium text-muted-foreground transition hover:text-primary"
              >
                Modules
              </Link>
              <Link
                href="#testimonials"
                className="text-sm font-medium text-muted-foreground transition hover:text-primary"
              >
                Success Stories
              </Link>
              <Link
                href="#pricing"
                className="text-sm font-medium text-muted-foreground transition hover:text-primary"
              >
                Pricing
              </Link>
              <Link
                href="#waitlist"
                className="text-sm font-medium text-muted-foreground transition hover:text-primary"
              >
                Join Waitlist
              </Link>

              {/* Header streak pill */}
              <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-foreground">
                <Icon name="Flame" size={14} />
                <span>{streak}</span>
                <span className="text-muted-foreground">day streak</span>
              </div>

              {/* Theme toggle */}
              <button
                type="button"
                onClick={handleToggleTheme}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground transition hover:bg-muted/80"
                aria-label="Toggle theme"
              >
                <Icon
                  name={theme === 'light' ? 'Moon' : 'Sun'}
                  size={16}
                />
              </button>
            </nav>
          </Container>
        </header>

        {/* Hero */}
        <section className="border-b border-border/60 bg-gradient-to-br from-background via-background to-muted/40 py-10 md:py-16">
          <Container className="grid gap-10 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)] md:items-center">
            {/* Left: text + countdown + word of day */}
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Icon name="Sparkles" size={14} />
                  Pre-launch IELTS platform
                </p>
                <h1 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-5xl">
                  Achieve your dream IELTS band with{' '}
                  <span className="text-primary">AI-powered preparation</span>
                </h1>
                <p className="max-w-xl text-sm text-muted-foreground md:text-base">
                  Master all four IELTS skills with personalized feedback,
                  adaptive learning paths, and realistic computer-based
                  mock tests that feel like the real exam.
                </p>
              </div>

              {/* Countdown */}
              <Card className="max-w-md border-primary/30 bg-primary/5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      Pre-launch access in
                    </p>
                    <div className="inline-flex items-center gap-2 rounded-full bg-background/60 px-2 py-1 text-[10px] font-medium text-muted-foreground">
                      <Icon name="Lock" size={12} />
                      Limited early-bird spots
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {([
                      ['Days', timeLeft.days],
                      ['Hours', timeLeft.hours],
                      ['Minutes', timeLeft.minutes],
                      ['Seconds', timeLeft.seconds],
                    ] as const).map(([label, value]) => (
                      <div
                        key={label}
                        className="flex flex-col items-center rounded-md bg-background/80 px-2 py-2"
                      >
                        <span className="font-mono text-xl font-semibold text-primary md:text-2xl">
                          {value}
                        </span>
                        <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Word of the day + streak */}
              <Card className="max-w-md border-border bg-background/80">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 text-accent-foreground">
                      <Icon name="BookOpen" size={16} />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-accent-foreground">
                        Word of the day
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Build your IELTS vocab one word at a time.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <h2 className="font-display text-2xl font-semibold text-accent-foreground">
                        {word.word}
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        IELTS-level vocabulary
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {word.meaning}
                    </p>
                    <p className="border-l-2 border-accent/40 pl-3 text-sm italic text-accent-foreground/90">
                      “{word.example}”
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleMarkLearned}
                      disabled={markingToday}
                    >
                      <Icon
                        name={markingToday ? 'CheckCircle2' : 'CircleCheck'}
                        size={16}
                        className="mr-2"
                      />
                      {markingToday ? 'Marked for today' : 'Mark as learned'}
                    </Button>

                    <div className="flex-1 min-w-[180px] rounded-lg bg-muted/60 px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Icon
                          name="Flame"
                          size={14}
                          className="text-destructive"
                        />
                        <p className="font-medium">
                          {streak}{' '}
                          {streak === 1 ? 'day streak' : 'day streak'}
                        </p>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        At launch, your streak converts to{' '}
                        <span className="font-semibold">
                          ${streakValueDollars}
                        </span>{' '}
                        credit on your subscription.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild>
                  <Link href="#waitlist">
                    <Icon name="Sparkles" size={16} className="mr-2" />
                    Join exclusive waitlist
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="#modules">
                    Explore features
                    <Icon name="ArrowRight" size={16} className="ml-2" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right: visual / modules rings */}
            <div className="relative hidden md:block">
              <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-destructive/20 blur-3xl" />
              <Card className="relative flex h-full min-h-[320px] flex-col items-center justify-center border-border/80 bg-background/80">
                <div className="relative flex h-72 w-72 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-primary/30" />
                  <div className="absolute inset-6 rounded-full border border-accent/30" />
                  <div className="absolute inset-12 rounded-full border border-destructive/30" />
                  <div className="absolute inset-18 rounded-full border border-emerald-400/30" />

                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-background px-2 py-1 text-xs font-semibold text-primary shadow-sm">
                    Listening
                  </span>
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-background px-2 py-1 text-xs font-semibold text-emerald-500 shadow-sm">
                    Speaking
                  </span>
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-background px-2 py-1 text-xs font-semibold text-accent-foreground shadow-sm">
                    Reading
                  </span>
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-background px-2 py-1 text-xs font-semibold text-destructive shadow-sm">
                    Writing
                  </span>

                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <div className="text-center">
                      <p className="text-[10px] font-medium uppercase tracking-wide">
                        Target Band
                      </p>
                      <p className="text-2xl font-bold">8.5</p>
                    </div>
                  </div>
                </div>

                <p className="mt-4 max-w-xs text-center text-xs text-muted-foreground">
                  Exact computer-based IELTS experience: timed sections,
                  realistic UI, and AI-powered band simulation after every
                  mock.
                </p>
              </Card>
            </div>
          </Container>
        </section>

        {/* Modules */}
        <section
          id="modules"
          className="border-b border-border/60 bg-background py-12 md:py-16"
        >
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Modules
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold md:text-3xl">
                Comprehensive IELTS preparation modules
              </h2>
              <p className="mt-3 text-sm text-muted-foreground md:text-base">
                We combine AI with proven exam strategies across all four
                skills so you don&apos;t waste time guessing what to study.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* User Module */}
              <Card className="relative h-full border-border/80 bg-muted/40">
                <span className="absolute right-3 top-3 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                  Complete
                </span>
                <div className="flex h-full flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon name="User" size={18} />
                    </span>
                    <div>
                      <h3 className="font-semibold">User Module</h3>
                      <p className="text-xs text-muted-foreground">
                        Accounts, profiles & goals.
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>Registration & login (email / social / phone)</li>
                    <li>Profile with target band and current level</li>
                    <li>Role-based access (student / teacher / admin)</li>
                    <li>Daily streak tracking & study calendar</li>
                    <li>Bookmarking and saved content</li>
                    <li>Multi-language preferences</li>
                  </ul>
                </div>
              </Card>

              {/* Learning Module */}
              <Card className="relative h-full border-border/80 bg-muted/40">
                <span className="absolute right-3 top-3 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                  In progress
                </span>
                <div className="flex h-full flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon name="GraduationCap" size={18} />
                    </span>
                    <div>
                      <h3 className="font-semibold">Learning Module</h3>
                      <p className="text-xs text-muted-foreground">
                        Lessons, drills & strategy.
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>Structured Academic & General courses</li>
                    <li>Grammar & vocabulary micro-lessons</li>
                    <li>IELTS strategy guides for all skills</li>
                    <li>AI-generated practice drills</li>
                    <li>Progressively unlocked learning paths</li>
                    <li>Collocations and phrasebank</li>
                  </ul>
                </div>
              </Card>

              {/* Mock Test Module */}
              <Card className="relative h-full border-border/80 bg-muted/40">
                <span className="absolute right-3 top-3 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                  In progress
                </span>
                <div className="flex h-full flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon name="ClipboardList" size={18} />
                    </span>
                    <div>
                      <h3 className="font-semibold">Mock Test Module</h3>
                      <p className="text-xs text-muted-foreground">
                        Full exam simulations.
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>Full-length timed IELTS mocks</li>
                    <li>Section-wise computer-based practice</li>
                    <li>Band score simulation per attempt</li>
                    <li>Real-time exam timer & progress</li>
                    <li>Basic anti-cheat (tab-switch detection)</li>
                    <li>Performance analytics per test</li>
                  </ul>
                </div>
              </Card>

              {/* AI Evaluation */}
              <Card className="relative h-full border-border/80 bg-muted/40">
                <span className="absolute right-3 top-3 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                  Complete
                </span>
                <div className="flex h-full flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon name="Brain" size={18} />
                    </span>
                    <div>
                      <h3 className="font-semibold">AI Evaluation</h3>
                      <p className="text-xs text-muted-foreground">
                        Instant band estimates & feedback.
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>Writing Task 1 & 2 with band score</li>
                    <li>GT letter writing evaluation</li>
                    <li>Speaking audio evaluation & transcription</li>
                    <li>Pronunciation & fluency scoring</li>
                    <li>Model answers & re-evaluation option</li>
                    <li>Clear breakdown by band descriptors</li>
                  </ul>
                </div>
              </Card>

              {/* Speaking Practice */}
              <Card className="relative h-full border-border/80 bg-muted/40">
                <span className="absolute right-3 top-3 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
                  Complete
                </span>
                <div className="flex h-full flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon name="Mic" size={18} />
                    </span>
                    <div>
                      <h3 className="font-semibold">Speaking Practice</h3>
                      <p className="text-xs text-muted-foreground">
                        Realistic speaking simulation.
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>Full speaking test (Parts 1–3)</li>
                    <li>Recording & playback of responses</li>
                    <li>AI speaking partner for practice</li>
                    <li>Accent profiles (UK / US / AUS)</li>
                    <li>Role-play conversations</li>
                    <li>Detailed speaking performance report</li>
                  </ul>
                </div>
              </Card>

              {/* Performance Analytics */}
              <Card className="relative h-full border-border/80 bg-muted/40">
                <span className="absolute right-3 top-3 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
                  In progress
                </span>
                <div className="flex h-full flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon name="BarChart3" size={18} />
                    </span>
                    <div>
                      <h3 className="font-semibold">Performance Analytics</h3>
                      <p className="text-xs text-muted-foreground">
                        See your band trajectory clearly.
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    <li>Skill-wise band progression over time</li>
                    <li>Weekly / monthly performance reports</li>
                    <li>Weakness detection & next-step suggestions</li>
                    <li>Study time tracking & consistency</li>
                    <li>Leaderboards & percentile rank</li>
                    <li>AI-generated improvement roadmap</li>
                  </ul>
                </div>
              </Card>
            </div>
          </Container>
        </section>

        {/* Testimonials */}
        <section
          id="testimonials"
          className="border-b border-border/60 bg-muted/60 py-12 md:py-16"
        >
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Social proof
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold md:text-3xl">
                Success stories from real candidates
              </h2>
              <p className="mt-3 text-sm text-muted-foreground md:text-base">
                Learners use our AI feedback and realistic mocks to jump
                from &quot;stuck&quot; to their dream university or visa band.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <Card className="h-full border-border/80 bg-background">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    MJ
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Michael Johnson</p>
                    <p className="text-xs text-muted-foreground">
                      Band 7.5 → 8.0 in 6 weeks
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  “The AI writing evaluation was a game-changer. It
                  pinpointed my grammar mistakes and task response issues in
                  a way no human teacher ever did.”
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                  <Icon name="Medal" size={14} />
                  Overall band: 8.0
                </div>
              </Card>

              <Card className="h-full border-border/80 bg-background">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    SR
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Sarah Rodriguez</p>
                    <p className="text-xs text-muted-foreground">
                      Band 6.5 → 7.5 in 8 weeks
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  “The speaking simulator killed my exam anxiety. Practising
                  with the AI partner made the real speaking test feel like
                  just another session.”
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                  <Icon name="Medal" size={14} />
                  Overall band: 7.5
                </div>
              </Card>

              <Card className="h-full border-border/80 bg-background">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    DK
                  </div>
                  <div>
                    <p className="text-sm font-semibold">David Kim</p>
                    <p className="text-xs text-muted-foreground">
                      Band 6.0 → 7.0 in 4 weeks
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  “The adaptive learning module saved me a stupid amount of
                  time. It showed me exactly which question types to fix
                  instead of drowning in random YouTube videos.”
                </p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500">
                  <Icon name="Medal" size={14} />
                  Overall band: 7.0
                </div>
              </Card>
            </div>
          </Container>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="border-b border-border/60 bg-background py-12 md:py-16"
        >
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Pricing
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold md:text-3xl">
                Flexible plans for every IELTS journey
              </h2>
              <p className="mt-3 text-sm text-muted-foreground md:text-base">
                Start simple, upgrade when you&apos;re serious about your
                exam date. Early-bird discounts apply at launch.
              </p>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {/* Basic */}
              <Card className="flex h-full flex-col border-border/80 bg-muted/40">
                <div className="mb-4">
                  <p className="text-sm font-semibold">Basic</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight">
                    $19<span className="text-base font-medium">/mo</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    For casual learners & first-timers.
                  </p>
                </div>
                <ul className="flex-1 space-y-1.5 text-xs text-muted-foreground">
                  <li>All core learning content</li>
                  <li>2 full mock tests per month</li>
                  <li>5 AI writing evaluations</li>
                  <li>3 speaking practice sessions</li>
                  <li>Basic performance dashboard</li>
                  <li>Email support</li>
                </ul>
                <Button asChild className="mt-5 w-full">
                  <Link href="#waitlist">Join waitlist</Link>
                </Button>
              </Card>

              {/* Premium */}
              <Card className="relative flex h-full flex-col border-primary bg-primary/5">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
                  Most popular
                </span>
                <div className="mb-4">
                  <p className="text-sm font-semibold">Premium</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight">
                    $34<span className="text-base font-medium">/mo</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    For serious candidates chasing band 7+.
                  </p>
                </div>
                <ul className="flex-1 space-y-1.5 text-xs text-muted-foreground">
                  <li>Unlimited full mocks & section tests</li>
                  <li>Unlimited AI writing evaluations</li>
                  <li>Unlimited speaking practice sessions</li>
                  <li>Advanced analytics dashboard</li>
                  <li>Adaptive learning paths</li>
                  <li>Priority support</li>
                  <li>Teacher review options (2 / month)</li>
                </ul>
                <Button asChild className="mt-5 w-full">
                  <Link href="#waitlist">Get early access</Link>
                </Button>
              </Card>

              {/* Institutional */}
              <Card className="flex h-full flex-col border-border/80 bg-muted/40">
                <div className="mb-4">
                  <p className="text-sm font-semibold">Institutional</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight">
                    Custom
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    For academies, schools & coaching centers.
                  </p>
                </div>
                <ul className="flex-1 space-y-1.5 text-xs text-muted-foreground">
                  <li>Bulk student accounts</li>
                  <li>Teacher & admin dashboards</li>
                  <li>Custom content & test upload</li>
                  <li>Usage analytics & exports</li>
                  <li>Dedicated account manager</li>
                  <li>API access & custom branding</li>
                </ul>
                <Button variant="outline" asChild className="mt-5 w-full">
                  <Link href="#waitlist">Contact sales</Link>
                </Button>
              </Card>
            </div>
          </Container>
        </section>

        {/* Waitlist */}
        <section
          id="waitlist"
          className="border-b border-border/60 bg-muted/60 py-12 md:py-16"
        >
          <Container>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Pre-launch
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold md:text-3xl">
                Join the exclusive pre-launch list
              </h2>
              <p className="mt-3 text-sm text-muted-foreground md:text-base">
                Be among the first to get access. Your streak credit will
                stack on top of early-bird discounts.
              </p>
            </div>

            <Card className="mx-auto mt-8 max-w-2xl border-border/80 bg-background">
              <form
                className="grid gap-4 md:grid-cols-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  // hook this into your real waitlist API later
                }}
              >
                <div className="space-y-1">
                  <label
                    htmlFor="name"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Full name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="h-9 w-full rounded-md border border-border bg-muted px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="email"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="h-9 w-full rounded-md border border-border bg-muted px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="target-band"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Target IELTS band
                  </label>
                  <input
                    id="target-band"
                    name="targetBand"
                    type="text"
                    className="h-9 w-full rounded-md border border-border bg-muted px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    placeholder="e.g. 7.5"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="test-date"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Planned test date
                  </label>
                  <input
                    id="test-date"
                    name="testDate"
                    type="text"
                    className="h-9 w-full rounded-md border border-border bg-muted px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    placeholder="Month / Year"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label
                    htmlFor="experience"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    Current IELTS experience
                  </label>
                  <input
                    id="experience"
                    name="experience"
                    type="text"
                    className="h-9 w-full rounded-md border border-border bg-muted px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    placeholder="First-time taker, retaker, etc."
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <Button type="submit" className="w-full">
                    <Icon name="Lock" size={16} className="mr-2" />
                    Secure your early access
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    First 500 sign-ups get an additional{' '}
                    <span className="font-semibold">30% off</span> for the
                    first 3 months, on top of streak credit.
                  </p>
                </div>
              </form>
            </Card>
          </Container>
        </section>

        {/* Footer */}
        <footer className="bg-background py-10">
          <Container>
            <div className="grid gap-8 md:grid-cols-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon name="Globe2" size={16} />
                  </span>
                  <span className="font-display text-sm font-semibold">
                    IELTS MasterPortal
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  An AI-powered IELTS preparation platform built for students
                  who are done wasting time on random content.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">IELTS resources</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>Preparation guide</li>
                  <li>Band score calculator</li>
                  <li>Writing task samples</li>
                  <li>Speaking question bank</li>
                  <li>Vocabulary builder</li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Quick links</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>
                    <Link href="#modules">Features</Link>
                  </li>
                  <li>
                    <Link href="#testimonials">Success stories</Link>
                  </li>
                  <li>
                    <Link href="#pricing">Pricing</Link>
                  </li>
                  <li>FAQ</li>
                  <li>Blog</li>
                </ul>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Contact</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>Support: 24/7</li>
                  <li>Location: Global / Online</li>
                  <li>Email integration goes here</li>
                </ul>
              </div>
            </div>

            <div className="mt-8 border-t border-border/60 pt-4 text-center text-[11px] text-muted-foreground">
              © {new Date().getFullYear()} IELTS MasterPortal. All rights
              reserved.
            </div>
          </Container>
        </footer>
      </main>
    </>
  );
};

export default IeltsMasterPortalLandingPage;
