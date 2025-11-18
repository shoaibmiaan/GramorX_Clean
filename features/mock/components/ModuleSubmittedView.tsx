import Link from 'next/link';
import * as React from 'react';

import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Container } from '@/components/design-system/Container';
import Icon from '@/components/design-system/Icon';

import type { ModuleSubmittedPageProps } from '../pageBuilders';

export const ModuleSubmittedView: React.FC<ModuleSubmittedPageProps> = ({ module, attempt, mock }) => {
  const band = typeof attempt.score?.band === 'number' ? attempt.score.band : null;
  const accuracy = typeof attempt.score?.accuracy === 'number' ? Math.round(attempt.score.accuracy * 100) : null;

  return (
    <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 py-16">
      <Container className="space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">IELTS {module}</p>
            <h1 className="font-slab text-display text-foreground">{mock.title} — Results</h1>
            <p className="text-sm text-muted-foreground">
              Submitted {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString('en-GB') : 'just now'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" className="rounded-ds-2xl">
              <Link href={`/mock/${module}`}>Back to hub</Link>
            </Button>
            <Button asChild variant="primary" className="rounded-ds-2xl">
              <Link href={`/mock/${module}/overview?mockId=${mock.id}`}>Retry mock</Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="rounded-ds-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-3xl bg-primary/15 px-4 py-2 text-sm font-semibold text-primary">
                Band {band ?? '—'}
              </div>
              {accuracy !== null ? (
                <Badge tone="success" size="sm">{accuracy}% accuracy</Badge>
              ) : null}
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {attempt.score?.summary ?? 'Your attempt has been recorded. Detailed analytics will appear shortly.'}
            </p>
          </Card>
          <Card className="rounded-ds-3xl border border-border/60 bg-card/70 p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Icon name="Bell" className="h-4 w-4 text-primary" />
              <p className="text-sm text-foreground">Notifications sent</p>
            </div>
            <p className="text-sm text-muted-foreground">
              We just logged this mock in your notifications feed so you can revisit the band, stats, and review link anytime.
            </p>
          </Card>
        </div>
      </Container>
    </main>
  );
};

export default ModuleSubmittedView;
