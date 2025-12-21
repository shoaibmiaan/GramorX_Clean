// components/writing/result/WritingResultLoading.tsx
import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import { Container } from '@/components/design-system/Container';

export const WritingResultLoading: React.FC = () => {
  return (
    <main className="min-h-[100dvh] bg-background">
      <Container className="max-w-6xl py-10">
        <div className="space-y-4">
          <div className="h-10 w-60 rounded-lg bg-muted animate-pulse" />
          <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-6">
            <div className="h-5 w-40 rounded-md bg-muted animate-pulse" />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="h-24 rounded-xl bg-muted animate-pulse" />
              <div className="h-24 rounded-xl bg-muted animate-pulse" />
            </div>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="rounded-ds-2xl border border-border/60 bg-card/70 p-4">
                <div className="h-16 rounded-xl bg-muted animate-pulse" />
              </Card>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
};

export default WritingResultLoading;
