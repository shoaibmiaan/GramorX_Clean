// TODO: EPIC-6: Wire to real analytics endpoint once ready. Currently using mock data.
import { useMemo, useState } from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Link from 'next/link';

import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Container } from '@/components/design-system/Container';
import { Select } from '@/components/design-system/Select';
import { Separator } from '@/components/design-system/Separator';
import { BandProgressChart } from '@/components/mock/analytics/BandProgressChart';
import { ModuleComparisonChart } from '@/components/mock/analytics/ModuleComparisonChart';
import { mockAnalyticsResponse } from '@/lib/analytics/mockData';
import type { MockAnalyticsResponse, ModuleId, WeakAreaInsight } from '@/lib/analytics/mockTypes';

type ModuleFilter = ModuleId | 'all';
type TimeRange = '7' | '30' | '90' | 'all';

const moduleLabels: Record<ModuleFilter, string> = {
  all: 'All modules',
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
    new Date(value),
  );

const toDuration = (seconds: number | null | undefined) => {
  if (!seconds && seconds !== 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
};

const filterByRange = <T extends { date?: string; startedAt?: string }>(
  collection: T[],
  timeRange: TimeRange,
): T[] => {
  if (timeRange === 'all') return collection;
  const days = Number(timeRange);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - days);

  return collection.filter((item) => {
    const rawDate = 'date' in item ? item.date : item.startedAt;
    if (!rawDate) return false;
    return new Date(rawDate) >= threshold;
  });
};

const filterModule = <T extends { module: ModuleId | 'overall' }>(
  collection: T[],
  module: ModuleFilter | 'overall',
): T[] => {
  if (module === 'all') return collection;
  return collection.filter((item) => item.module === module);
};

interface MockAnalyticsPageProps {
  initialData: MockAnalyticsResponse;
}

const MockAnalyticsPage: NextPage<MockAnalyticsPageProps> = ({ initialData }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('90');
  const [module, setModule] = useState<ModuleFilter>('all');

  const filteredTrajectory = useMemo(() => {
    const sorted = [...initialData.bandTrajectory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const scoped = filterModule(sorted, module === 'all' ? 'overall' : module);
    const scopeAdjusted =
      module === 'all'
        ? sorted.filter((point) => point.module === 'overall')
        : scoped;
    return filterByRange(scopeAdjusted, timeRange);
  }, [initialData.bandTrajectory, module, timeRange]);

  const filteredModules = useMemo(() => {
    const scopedModules = filterModule(initialData.modules, module);
    return scopedModules;
  }, [initialData.modules, module]);

  const filteredWeakAreas: WeakAreaInsight[] = useMemo(() => {
    const scoped = filterModule(initialData.weakAreas, module);
    return scoped;
  }, [initialData.weakAreas, module]);

  const filteredAttempts = useMemo(() => {
    const scoped = filterModule(initialData.recentAttempts, module);
    return filterByRange(scoped, timeRange);
  }, [initialData.recentAttempts, module, timeRange]);

  const overview = useMemo(() => {
    const attemptsWithScores = filteredAttempts.filter((attempt) => attempt.bandScore !== null);
    const avgBand =
      attemptsWithScores.length > 0
        ? attemptsWithScores.reduce((acc, attempt) => acc + (attempt.bandScore || 0), 0) /
          attemptsWithScores.length
        : null;

    const improvement = (() => {
      if (filteredTrajectory.length < 2) return null;
      const first = filteredTrajectory[0].bandScore;
      const last = filteredTrajectory[filteredTrajectory.length - 1].bandScore;
      return Number((last - first).toFixed(1));
    })();

    const mostAttemptedModule = filteredModules.reduce<{ module: ModuleId | null; attempts: number }>(
      (best, entry) => {
        if (entry.attempts > best.attempts) return { module: entry.module, attempts: entry.attempts };
        return best;
      },
      { module: null, attempts: 0 },
    );

    return {
      avgBand,
      totalAttempts: filteredAttempts.length,
      improvement,
      mostAttemptedModule: mostAttemptedModule.module,
    };
  }, [filteredAttempts, filteredModules, filteredTrajectory]);

  const strongestWeakest = useMemo(() => {
    const sorted = [...filteredModules].filter((m) => m.avgBand !== null).sort((a, b) => (b.avgBand || 0) - (a.avgBand || 0));
    return {
      strongest: sorted[0]?.module,
      weakest: sorted[sorted.length - 1]?.module,
    };
  }, [filteredModules]);

  return (
    <Container className="py-8 space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Analytics</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-foreground">Mock Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Track your mock performance over time and pinpoint where you are losing bands.
            </p>
          </div>
          <div className="flex gap-3">
            <Select
              label="Time range"
              value={timeRange}
              onValueChange={(value) => setTimeRange(value as TimeRange)}
              options={[
                { label: 'Last 7 days', value: '7' },
                { label: 'Last 30 days', value: '30' },
                { label: 'Last 90 days', value: '90' },
                { label: 'All time', value: 'all' },
              ]}
            />
            <Select
              label="Module"
              value={module}
              onValueChange={(value) => setModule(value as ModuleFilter)}
              options={Object.entries(moduleLabels).map(([value, label]) => ({ label, value }))}
            />
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Average band" value={overview.avgBand ? overview.avgBand.toFixed(1) : '—'} />
        <KpiCard title="Total attempts" value={overview.totalAttempts} />
        <KpiCard
          title="Improvement"
          value={overview.improvement !== null ? `${overview.improvement >= 0 ? '+' : ''}${overview.improvement}` : '—'}
          helper="vs first attempt in range"
        />
        <KpiCard
          title="Most attempted"
          value={overview.mostAttemptedModule ? moduleLabels[overview.mostAttemptedModule] : '—'}
        />
      </section>

      <Card className="space-y-4 rounded-ds-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Band trajectory</h2>
            <p className="text-sm text-muted-foreground">Follow your improvement over time.</p>
          </div>
          {strongestWeakest.strongest && strongestWeakest.weakest && (
            <Badge variant="secondary" size="sm">
              Strongest: {moduleLabels[strongestWeakest.strongest]} · Weakest: {moduleLabels[strongestWeakest.weakest]}
            </Badge>
          )}
        </div>
        <BandProgressChart data={filteredTrajectory} />
      </Card>

      <Card className="space-y-4 rounded-ds-2xl p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">Module comparison</h2>
          <p className="text-sm text-muted-foreground">Average bands and attempt depth per module.</p>
        </div>
        <ModuleComparisonChart data={filteredModules} />
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {strongestWeakest.strongest && <Badge variant="success">Strongest: {moduleLabels[strongestWeakest.strongest]}</Badge>}
          {strongestWeakest.weakest && <Badge variant="danger">Weakest: {moduleLabels[strongestWeakest.weakest]}</Badge>}
        </div>
      </Card>

      <Card className="space-y-4 rounded-ds-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Weak areas & recommendations</h2>
            <p className="text-sm text-muted-foreground">
              Target the question types where accuracy drops.
            </p>
          </div>
          <Badge variant="secondary">Filtered: {moduleLabels[module]}</Badge>
        </div>
        {filteredWeakAreas.length === 0 ? (
          <p className="text-sm text-muted-foreground">No weak areas detected for this scope.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredWeakAreas.map((insight) => (
              <WeakAreaCard key={`${insight.module}-${insight.label}`} insight={insight} />
            ))}
          </div>
        )}
      </Card>

      <Card className="space-y-4 rounded-ds-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Recent attempts</h2>
            <p className="text-sm text-muted-foreground">Jump into results or reviews straight from here.</p>
          </div>
          <Badge variant="secondary">{filteredAttempts.length} shown</Badge>
        </div>
        {filteredAttempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attempts found for this range.</p>
        ) : (
          <div className="overflow-hidden rounded-ds-xl border border-border/60">
            <div className="grid grid-cols-6 bg-muted/40 px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span>Date</span>
              <span>Module</span>
              <span>Test</span>
              <span>Band</span>
              <span>Time</span>
              <span className="text-right">Action</span>
            </div>
            <div className="divide-y divide-border/60">
              {filteredAttempts.map((attempt) => (
                <div key={attempt.id} className="grid grid-cols-6 items-center px-4 py-3 text-sm">
                  <span className="font-medium text-foreground">{formatDate(attempt.startedAt)}</span>
                  <span className="text-muted-foreground">{moduleLabels[attempt.module]}</span>
                  <span className="text-muted-foreground">{attempt.testSlug}</span>
                  <span className="font-semibold text-foreground">{attempt.bandScore ?? '—'}</span>
                  <span className="text-muted-foreground">{toDuration(attempt.durationSeconds)}</span>
                  <div className="flex justify-end">
                    <Link href={`/mock/${attempt.module}/result/${attempt.attemptId}`}>
                      <Button size="sm" variant="ghost">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </Container>
  );
};

interface KpiCardProps {
  title: string;
  value: string | number | null;
  helper?: string;
}

const KpiCard = ({ title, value, helper }: KpiCardProps) => (
  <Card className="space-y-2 rounded-ds-2xl p-4">
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{title}</p>
    <p className="text-2xl font-semibold text-foreground">{value}</p>
    {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
  </Card>
);

const WeakAreaCard = ({ insight }: { insight: WeakAreaInsight }) => (
  <div className="rounded-ds-xl border border-border/60 bg-muted/30 p-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-semibold text-foreground">{insight.label}</p>
        <p className="text-xs text-muted-foreground capitalize">{moduleLabels[insight.module]}</p>
      </div>
      <Badge variant={insight.accuracy >= 0.7 ? 'success' : 'danger'}>
        {(insight.accuracy * 100).toFixed(0)}%
      </Badge>
    </div>
    <Separator className="my-3" />
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>{insight.attempts} attempts</span>
      <Button size="sm" variant="ghost" asChild>
        <Link href={`/mock/${insight.module}`}>Practice</Link>
      </Button>
    </div>
  </div>
);

export const getServerSideProps: GetServerSideProps<MockAnalyticsPageProps> = async () => {
  return {
    props: {
      initialData: mockAnalyticsResponse,
    },
  };
};

export default MockAnalyticsPage;
