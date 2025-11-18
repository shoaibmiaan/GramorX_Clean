import * as React from 'react';

import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Container } from '@/components/design-system/Container';
import Icon from '@/components/design-system/Icon';
import type { MockModuleId } from '@/types/mock';

import { TimerBar } from './TimerBar';

export type MockShellProps = {
  module: MockModuleId;
  title: string;
  description?: string;
  timer: {
    totalSeconds: number;
    remainingSeconds: number;
  };
  onSubmit?: () => void;
  submitLabel?: string;
  isSubmitting?: boolean;
  sidebar?: React.ReactNode;
  navigator?: React.ReactNode;
  children: React.ReactNode;
};

const moduleIcons: Record<MockModuleId, string> = {
  listening: 'Headphones',
  reading: 'BookOpenCheck',
  writing: 'PenSquare',
  speaking: 'Mic',
};

export const MockShell: React.FC<MockShellProps> = ({
  module,
  title,
  description,
  timer,
  onSubmit,
  submitLabel = 'Submit mock',
  isSubmitting,
  sidebar,
  navigator,
  children,
}) => {
  const icon = moduleIcons[module];

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface via-surface/80 to-background">
      <header className="border-b border-border/60 bg-card/70 backdrop-blur-sm">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15">
              <Icon name={icon} className="h-5 w-5 text-primary" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">IELTS {module}</p>
              <h1 className="font-slab text-h5 text-foreground">{title}</h1>
            </div>
          </div>
          <div className="min-w-[200px]">
            <TimerBar totalSeconds={timer.totalSeconds} remainingSeconds={timer.remainingSeconds} />
          </div>
          {onSubmit ? (
            <Button variant="primary" size="lg" className="rounded-ds-2xl" onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting…' : submitLabel}
            </Button>
          ) : null}
        </Container>
      </header>

      <main className="py-8">
        <Container className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(280px,1fr)]">
          <div className="space-y-6">
            {navigator ? <Card className="rounded-ds-3xl border border-border/60 p-4">{navigator}</Card> : null}
            <Card className="rounded-ds-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
              {description ? <p className="mb-4 text-sm text-muted-foreground">{description}</p> : null}
              <div className="space-y-4">{children}</div>
            </Card>
          </div>
          {sidebar ? (
            <aside className="space-y-4">
              <Card className="rounded-ds-3xl border border-border/60 bg-card/70 p-5 shadow-sm">{sidebar}</Card>
            </aside>
          ) : null}
        </Container>
      </main>
    </div>
  );
};

export default MockShell;
