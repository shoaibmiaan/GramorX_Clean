import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { GetServerSideProps, NextPage } from 'next';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';

type AttemptStatus = 'created' | 'in_progress' | 'submitted' | 'evaluated';

type WritingAttemptRow = {
  id: string;
  mode: 'academic' | 'general';
  status: AttemptStatus;
  started_at: string;
  submitted_at: string | null;
  evaluated_at: string | null;
};

type WritingStats = {
  totalAttempts: number;
  lastAttemptAt: string | null;
  statusCounts: Record<AttemptStatus, number>;
};

type ProgressPoint = {
  startedAt: string;
  label: string;
  band: number;
};

type PageProps = {
  stats: WritingStats;
  recentAttempts: Array<{
    id: string;
    mode: 'academic' | 'general';
    status: AttemptStatus;
    startedAt: string;
  }>;
  progress: {
    points: ProgressPoint[];
    latestBand: number | null;
    bestBand: number | null;
  };
  error?: string;
};

type StartAttemptResp =
  | {
      ok: true;
      attemptId: string;
      mode: 'academic' | 'general';
      status: 'created';
      startedAt: string;
      durationSeconds: number;
    }
  | { ok: false; error: string };

function formatRelativeDate(iso: string | null): string {
  if (!iso) return '—';
  const created = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - created.getTime()) / 86400000);

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays} days ago`;
  return created.toLocaleDateString();
}

function formatFullDateTimeClient(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/* ---------------- MODE PICKER MODAL ---------------- */

type ModePickerProps = {
  open: boolean;
  starting: null | 'academic' | 'general';
  errorText: string | null;
  onClose: () => void;
  onPick: (mode: 'academic' | 'general') => void;
};

function ModePickerModal({
  open,
  starting,
  errorText,
  onClose,
  onPick,
}: ModePickerProps) {
  if (!open) return null;
  const disabled = starting != null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-lg p-5 space-y-4 rounded-ds-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold">Choose writing mode</p>
            <p className="text-xs text-muted-foreground">
              Academic = report + essay, General = letter + essay
            </p>
          </div>
          <Button size="xs" variant="ghost" onClick={onClose} disabled={disabled}>
            <Icon name="X" size={16} />
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Button onClick={() => onPick('academic')} disabled={disabled}>
            Academic
          </Button>
          <Button
            variant="secondary"
            onClick={() => onPick('general')}
            disabled={disabled}
          >
            General
          </Button>
        </div>

        {errorText ? (
          <p className="text-xs text-destructive">{errorText}</p>
        ) : null}
      </Card>
    </div>
  );
}

/* ---------------- PAGE ---------------- */

const WritingMockIndexPage: NextPage<PageProps> = ({
  stats,
  recentAttempts,
  progress,
  error,
}) => {
  const router = useRouter();

  const [modeOpen, setModeOpen] = React.useState(false);
  const [starting, setStarting] =
    React.useState<null | 'academic' | 'general'>(null);
  const [startError, setStartError] = React.useState<string | null>(null);

  const lastAttemptLabel = formatRelativeDate(stats.lastAttemptAt);

  const startAttempt = async (mode: 'academic' | 'general') => {
    setStarting(mode);
    setStartError(null);

    try {
      const r = await fetch('/api/writing/start-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });

      const json = (await r.json()) as StartAttemptResp;
      if (!json.ok) throw new Error(json.error);

      await router.push(`/mock/writing/attempt/${json.attemptId}`);
    } catch (e) {
      setStartError(e instanceof Error ? e.message : 'Failed to start');
      setStarting(null);
    }
  };

  if (error) {
    return <p className="p-10 text-destructive">{error}</p>;
  }

  return (
    <>
      <Head>
        <title>IELTS Writing Mock Command Center · GramorX</title>
      </Head>

      <main>
        {/* HERO */}
        <section className="border-b py-8">
          <Container className="flex justify-between gap-6">
            <div>
              <h1 className="text-h2 font-slab">
                Writing mocks with real exam flow
              </h1>
              <p className="text-muted-foreground">
                Task 1 + Task 2 · 60 minutes · AI evaluation
              </p>
            </div>

            <Card className="p-4 space-y-2 w-64">
              <p className="text-xs text-muted-foreground">Total attempts</p>
              <p className="text-lg font-semibold">{stats.totalAttempts}</p>
              <p className="text-xs">Last: {lastAttemptLabel}</p>

              <Button onClick={() => setModeOpen(true)}>
                Start writing mock
              </Button>
            </Card>
          </Container>
        </section>

        {/* BODY */}
        <section className="py-10">
          <Container className="grid gap-8 lg:grid-cols-2">
            {/* LEFT */}
            <Card className="p-6">
              <h2 className="font-semibold mb-4">Band progress</h2>

              {progress.points.length < 2 ? (
                <p className="text-xs text-muted-foreground">
                  Complete 2+ evaluated mocks to see progress.
                </p>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progress.points}>
                      <CartesianGrid strokeOpacity={0.1} />
                      <XAxis dataKey="label" />
                      <YAxis domain={[0, 9]} />
                      <Tooltip />
                      <Line dataKey="band" stroke="currentColor" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* RIGHT */}
            <Card className="p-6 space-y-3">
              <h2 className="font-semibold">Recent attempts</h2>

              {recentAttempts.map((a) => (
                <div
                  key={a.id}
                  className="flex justify-between items-center border p-3 rounded-ds-lg"
                >
                  <div>
                    <p className="font-medium">
                      {a.mode === 'academic' ? 'Academic' : 'General'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFullDateTimeClient(a.startedAt)}
                    </p>
                  </div>

                  <Badge size="xs">{a.status}</Badge>
                </div>
              ))}
            </Card>
          </Container>
        </section>

        <ModePickerModal
          open={modeOpen}
          starting={starting}
          errorText={startError}
          onClose={() => setModeOpen(false)}
          onPick={startAttempt}
        />
      </main>
    </>
  );
};

export default WritingMockIndexPage;
