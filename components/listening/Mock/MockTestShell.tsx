// components/listening/Mock/MockTestShell.tsx
import * as React from 'react';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import ListeningNavTabs from '@/components/listening/ListeningNavTabs';
import GameTimer from '@/components/listening/Game/GameTimer';
import MockSectionNavigator from '@/components/listening/Mock/MockSectionNavigator';

type SectionNavQuestion = {
  id: string;
  label: string;
  status: 'unanswered' | 'answered' | 'flagged';
};

type SectionNavItem = {
  sectionNumber: number;
  questions: SectionNavQuestion[];
};

type Props = {
  testTitle: string;
  durationSeconds: number;
  elapsedSeconds: number;
  navSections: SectionNavItem[];
  currentSectionNumber: number;
  currentQuestionId: string | null;
  onSelectQuestion: (sectionNumber: number, questionId: string) => void;
  children: React.ReactNode;
};

const MockTestShell: React.FC<Props> = ({
  testTitle,
  durationSeconds,
  elapsedSeconds,
  navSections,
  currentSectionNumber,
  currentQuestionId,
  onSelectQuestion,
  children,
}) => {
  return (
    <main className="min-h-screen bg-background py-6 sm:py-8">
      <Container>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Full mock · Listening
            </p>
            <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
              {testTitle}
            </h1>
          </div>
          <div className="w-full max-w-xs">
            <GameTimer
              elapsedSeconds={elapsedSeconds}
              targetTimeSeconds={durationSeconds}
            />
          </div>
        </div>

        <ListeningNavTabs activeKey="mock" />

        <div className="grid gap-4 lg:grid-cols-[3fr,1.1fr]">
          <Card className="border-border bg-card/60 p-3 sm:p-4 lg:p-5">
            {children}
          </Card>

          <MockSectionNavigator
            sections={navSections}
            currentSectionNumber={currentSectionNumber}
            currentQuestionId={currentQuestionId}
            onSelectQuestion={onSelectQuestion}
          />
        </div>
      </Container>
    </main>
  );
};

export default MockTestShell;
