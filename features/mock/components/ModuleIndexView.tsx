import Link from 'next/link';
import * as React from 'react';

import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { ModuleMockShell, ModuleMockShellSection } from '@/components/mock-tests/ModuleMockShell';
import type { ModuleMockMeta } from '@/lib/mock/types';
import type { MockModuleId } from '@/types/mock';

import type { ModuleIndexPageProps } from '../pageBuilders';

const moduleCopy: Record<MockModuleId, { title: string; description: string }> = {
  listening: {
    title: 'Listening mock lab',
    description: 'Timed sections, autoplaying audio, and instant band approximations after submission.',
  },
  reading: {
    title: 'Reading mock library',
    description: 'Passage stacks, question variety, and full-length academic/GT practice sets.',
  },
  writing: {
    title: 'Writing studio',
    description: 'Task 1 + 2 prompts with focused timers and AI hints for structure and coverage.',
  },
  speaking: {
    title: 'Speaking simulator',
    description: 'Cue cards, part 1 warmups, and part 3 follow-ups in a guided CBE-style flow.',
  },
};

const moduleRoute = (module: MockModuleId) => `/mock/${module}`;

const overviewRoute = (module: MockModuleId, mockId: string) => `${moduleRoute(module)}/overview?mockId=${mockId}`;

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—';

const MockCard: React.FC<{ module: MockModuleId; mock: ModuleMockMeta }> = ({ module, mock }) => (
  <Card className="rounded-ds-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{module}</p>
        <h3 className="font-semibold text-foreground">{mock.title}</h3>
      </div>
      <Badge tone="info" size="sm">
        {mock.sectionCount ?? 1} parts
      </Badge>
    </div>
    <p className="mt-2 text-sm text-muted-foreground">{mock.description ?? 'Exam calibrated practice set.'}</p>
    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
      <div className="rounded-2xl border border-border/50 px-2 py-2">
        <p className="text-[10px] uppercase tracking-[0.24em]">Duration</p>
        <p className="text-base font-semibold text-foreground">{mock.durationMinutes}m</p>
      </div>
      <div className="rounded-2xl border border-border/50 px-2 py-2">
        <p className="text-[10px] uppercase tracking-[0.24em]">Questions</p>
        <p className="text-base font-semibold text-foreground">{mock.questionCount ?? 2}</p>
      </div>
      <div className="rounded-2xl border border-border/50 px-2 py-2">
        <p className="text-[10px] uppercase tracking-[0.24em]">Level</p>
        <p className="text-base font-semibold text-foreground">{mock.difficulty ?? '—'}</p>
      </div>
    </div>
    <div className="mt-4 flex flex-col gap-2">
      <Button asChild variant="primary" className="rounded-ds-2xl">
        <Link href={overviewRoute(module, mock.id)}>Overview & start</Link>
      </Button>
    </div>
  </Card>
);

export const ModuleIndexView: React.FC<ModuleIndexPageProps> = ({ module, mocks, history }) => {
  const copy = moduleCopy[module];
  const attempts = history.length;
  const lastAttempt = history[0];
  const band = typeof lastAttempt?.scoreSummary?.band === 'number' ? lastAttempt.scoreSummary?.band : lastAttempt?.band;

  return (
    <ModuleMockShell
      title={copy.title}
      description={copy.description}
      heroVariant="split"
      stats={[
        { label: 'Available mocks', value: mocks.length },
        { label: 'Attempts', value: attempts },
        { label: 'Last score', value: band ? `Band ${band}` : '—', helper: lastAttempt ? formatDate(lastAttempt.submittedAt) : '' },
      ]}
      actions={
        mocks[0] ? (
          <Button asChild variant="primary" size="lg" className="rounded-ds-2xl">
            <Link href={overviewRoute(module, mocks[0].id)}>Start latest mock</Link>
          </Button>
        ) : undefined
      }
    >
      <ModuleMockShellSection className="grid gap-4 lg:grid-cols-2">
        {mocks.map((mock) => (
          <MockCard key={mock.id} module={module} mock={mock} />
        ))}
      </ModuleMockShellSection>
    </ModuleMockShell>
  );
};

export default ModuleIndexView;
