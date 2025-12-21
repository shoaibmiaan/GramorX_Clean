// components/writing/result/WritingResultEmptyState.tsx
import * as React from 'react';
import Link from 'next/link';

import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import { Container } from '@/components/design-system/Container';

type Props = {
  attemptId: string;
  reason: 'not_found' | 'no_access' | 'not_evaluated';
};

const reasonCopy: Record<Props['reason'], { title: string; detail: string }> = {
  not_found: {
    title: 'Result not found',
    detail: 'This attempt might be deleted or never existed.',
  },
  no_access: {
    title: 'You do not have access',
    detail: 'This attempt belongs to another user or is restricted.',
  },
  not_evaluated: {
    title: 'Not evaluated yet',
    detail: 'The attempt was found but does not have an evaluation stored.',
  },
};

export const WritingResultEmptyState: React.FC<Props> = ({ attemptId, reason }) => {
  const copy = reasonCopy[reason];

  return (
    <main className="min-h-[100dvh] bg-background">
      <Container className="max-w-3xl py-10">
        <Card className="rounded-ds-2xl border border-border/60 bg-card p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Icon name="AlertTriangle" size={20} />
          </div>

          <h1 className="mt-3 text-lg font-semibold text-foreground">{copy.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{copy.detail}</p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button asChild variant="secondary">
              <Link href="/mock/writing">Back to Writing mocks</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={`/mock/writing/attempt/${encodeURIComponent(attemptId)}`}>
                Go back to attempt
              </Link>
            </Button>
          </div>
        </Card>
      </Container>
    </main>
  );
};

export default WritingResultEmptyState;
