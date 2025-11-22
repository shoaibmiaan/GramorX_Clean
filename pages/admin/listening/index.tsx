// pages/admin/listening/index.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

type ListeningAdminOverview = {
  totalTests: number;
  practiceTests: number;
  mockTests: number;
  totalAttempts: number;
  practiceAttempts: number;
  mockAttempts: number;
  avgBandScore: number | null;
};

type Props = {
  stats: ListeningAdminOverview;
};

const AdminListeningIndexPage: NextPage<Props> = ({ stats }) => {
  const {
    totalTests,
    practiceTests,
    mockTests,
    totalAttempts,
    practiceAttempts,
    mockAttempts,
    avgBandScore,
  } = stats;

  return (
    <>
      <Head>
        <title>Admin • Listening Overview • GramorX</title>
        <meta
          name="description"
          content="Admin overview for the IELTS Listening module – tests, attempts, and health summary."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Admin · Listening module
              </p>
              <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                Listening admin overview
              </h1>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Control tests, watch attempts, and keep the Listening module exam-accurate.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/listening/tests">
                  <Icon name="FileText" size={14} />
                  <span>Manage tests</span>
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/admin/listening/question-bank">
                  <Icon name="Database" size={14} />
                  <span>Question bank</span>
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/admin/listening/attempts">
                  <Icon name="ListChecks" size={14} />
                  <span>View attempts</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Stat cards */}
          <section className="mb-6 grid gap-3 md:grid-cols-3">
            <Card className="border-border bg-card/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Listening tests
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {totalTests}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {practiceTests} practice · {mockTests} mock
                  </p>
                </div>
                <Icon name="Headphones" size={20} className="text-primary" />
              </div>
            </Card>

            <Card className="border-border bg-card/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Total attempts
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {totalAttempts}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {practiceAttempts} practice · {mockAttempts} mock
                  </p>
                </div>
                <Icon name="Activity" size={20} className="text-primary" />
              </div>
            </Card>

            <Card className="border-border bg-card/60 p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Avg Listening band (submitted mocks)
                  </p>
                  <p className="mt-1 text-xl font-semibold text-foreground">
                    {avgBandScore != null ? avgBandScore.toFixed(1) : '—'}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Based on submitted mock attempts only.
                  </p>
                </div>
                <Icon name="LineChart" size={20} className="text-primary" />
              </div>
            </Card>
          </section>

          {/* Quick links */}
          <section className="grid gap-4 md:grid-cols-3">
            <Card className="flex flex-col justify-between border-border bg-card/60 p-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Test definitions
                </p>
                <p className="text-xs text-muted-foreground">
                  Create, edit, and mark tests as practice vs mock. Attach audio, duration, and band
                  ranges.
                </p>
              </div>
              <div className="mt-3">
                <Button asChild size="sm" className="w-full justify-center">
                  <Link href="/admin/listening/tests">
                    <Icon name="FileText" size={14} />
                    <span>Open tests manager</span>
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="flex flex-col justify-between border-border bg-card/60 p-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Question bank
                </p>
                <p className="text-xs text-muted-foreground">
                  Inspect questions by test, section, and type. Make sure real IELTS style is
                  preserved.
                </p>
              </div>
              <div className="mt-3">
                <Button asChild size="sm" className="w-full justify-center">
                  <Link href="/admin/listening/question-bank">
                    <Icon name="Database" size={14} />
                    <span>Open question bank</span>
                  </Link>
                </Button>
              </div>
            </Card>

            <Card className="flex flex-col justify-between border-border bg-card/60 p-4">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Attempts & health
                </p>
                <p className="text-xs text-muted-foreground">
                  See who is actually using Listening, how often, and at what band level.
                </p>
              </div>
              <div className="mt-3">
                <Button asChild size="sm" className="w-full justify-center">
                  <Link href="/admin/listening/attempts">
                    <Icon name="ListChecks" size={14} />
                    <span>View attempts</span>
                  </Link>
                </Button>
              </div>
            </Card>
          </section>
        </Container>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent('/admin/listening')}`,
        permanent: false,
      },
    };
  }

  // Tests stats
  const { data: testRows } = await supabase
    .from('listening_tests')
    .select('id, is_mock');

  const totalTests = testRows?.length ?? 0;
  const practiceTests = testRows?.filter((t: any) => !t.is_mock).length ?? 0;
  const mockTests = testRows?.filter((t: any) => !!t.is_mock).length ?? 0;

  // Attempts stats
  const { data: attemptsRows } = await supabase
    .from('attempts_listening')
    .select('id, mode, band_score')
    .eq('status', 'submitted');

  const totalAttempts = attemptsRows?.length ?? 0;
  const practiceAttempts =
    attemptsRows?.filter((a: any) => a.mode === 'practice').length ?? 0;
  const mockAttempts =
    attemptsRows?.filter((a: any) => a.mode === 'mock').length ?? 0;

  const mockBandScores =
    attemptsRows?.filter((a: any) => a.mode === 'mock' && a.band_score != null) ??
    [];

  const avgBandScore =
    mockBandScores.length > 0
      ? mockBandScores.reduce((sum: number, row: any) => sum + Number(row.band_score), 0) /
        mockBandScores.length
      : null;

  return {
    props: {
      stats: {
        totalTests,
        practiceTests,
        mockTests,
        totalAttempts,
        practiceAttempts,
        mockAttempts,
        avgBandScore,
      },
    },
  };
};

export default AdminListeningIndexPage;
