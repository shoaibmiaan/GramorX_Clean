import * as React from 'react';
import { useRouter } from 'next/router';

import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Container } from '@/components/design-system/Container';
import Icon from '@/components/design-system/Icon';
import type { MockModuleId } from '@/types/mock';

import type { ModuleOverviewPageProps } from '../pageBuilders';
import { MockStepper } from '@/components/mock/MockStepper';

const moduleIcons: Record<MockModuleId, string> = {
  listening: 'Headphones',
  reading: 'BookOpenCheck',
  writing: 'PenSquare',
  speaking: 'Mic',
};

export const ModuleOverviewView: React.FC<ModuleOverviewPageProps> = ({ module, mock }) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const steps = [
    {
      id: 'overview',
      title: 'Overview',
      description: `${mock.title} • ${mock.durationMinutes} minutes • ${mock.questionCount ?? 2} questions`,
      checklist: ['IELTS-grade materials', 'Auto band estimation', 'Review mode after submission'],
    },
    {
      id: 'devices',
      title: module === 'speaking' ? 'Microphone + camera check' : 'Headset + screen check',
      description:
        module === 'speaking'
          ? 'Ensure your mic input works. Quiet room recommended.'
          : 'Use headphones and maximise your screen for full focus.',
      checklist: ['Stable internet', 'Do not refresh mid-test', 'Disable notifications'],
    },
    {
      id: 'honour',
      title: 'Honour code',
      description: 'No switching tabs, no screenshots. Treat this like your real slot.',
      checklist: ['Single attempt counted', 'Timer cannot be paused', 'Results logged for analytics'],
    },
  ];

  const handleAdvance = async () => {
    setError(null);
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/mock/${module}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mockId: mock.id }),
      });
      if (!res.ok) {
        throw new Error('Unable to start mock.');
      }
      const data = (await res.json()) as { attemptId: string };
      router.push(`/mock/${module}/run?attemptId=${data.attemptId}`);
    } catch (err) {
      console.error(err);
      setError('Could not start the mock. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 py-16">
      <Container className="space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <Icon name={moduleIcons[module]} className="h-5 w-5 text-primary" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">IELTS {module}</p>
              <h1 className="font-slab text-display text-foreground">{mock.title}</h1>
              <p className="text-sm text-muted-foreground">{mock.description ?? 'Full mock overview & start checklist.'}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <Badge tone="info" size="sm">
              {mock.durationMinutes} mins • {mock.questionCount ?? 2} questions
            </Badge>
            <Button variant="ghost" size="sm" className="rounded-ds-2xl" onClick={() => router.push(`/mock/${module}`)}>
              Back to module hub
            </Button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2.5fr)_minmax(0,1fr)]">
          <Card className="rounded-ds-3xl border border-border/60 bg-card/80 p-6 shadow-sm">
            <MockStepper
              steps={steps}
              currentIndex={currentStep}
              onAdvance={handleAdvance}
              onBack={currentStep === 0 ? undefined : () => setCurrentStep((prev) => Math.max(0, prev - 1))}
              ctaLabel={currentStep === steps.length - 1 ? (loading ? 'Starting…' : 'Start mock') : 'Next'}
              disabled={loading}
            />
            {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
          </Card>
          <aside className="space-y-3">
            <Card className="rounded-ds-3xl border border-border/60 bg-card/70 p-5 shadow-sm">
              <h3 className="font-semibold">What to expect</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Timer starts instantly</li>
                <li>• Progress auto-saves every 30 seconds</li>
                <li>• Submission triggers notifications + analytics</li>
              </ul>
            </Card>
          </aside>
        </div>
      </Container>
    </main>
  );
};

export default ModuleOverviewView;
