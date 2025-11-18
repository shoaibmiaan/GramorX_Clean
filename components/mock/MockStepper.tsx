import * as React from 'react';

import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';

export type Step = {
  id: string;
  title: string;
  description: string;
  checklist?: string[];
};

export type MockStepperProps = {
  steps: Step[];
  currentIndex: number;
  onAdvance?: () => void;
  onBack?: () => void;
  ctaLabel?: string;
  disabled?: boolean;
};

export const MockStepper: React.FC<MockStepperProps> = ({ steps, currentIndex, onAdvance, onBack, ctaLabel, disabled }) => {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        return (
          <Card
            key={step.id}
            className={`rounded-ds-3xl border ${isActive ? 'border-primary/60 bg-card' : 'border-border/70 bg-card/60'} p-5`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Step {index + 1}</p>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
              </div>
              <span className="text-sm font-semibold text-primary">{isActive ? 'Current' : ''}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            {step.checklist ? (
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                {step.checklist.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            ) : null}
          </Card>
        );
      })}
      <div className="flex justify-between">
        <Button variant="ghost" disabled={!onBack} onClick={onBack}>
          Back
        </Button>
        <Button variant="primary" onClick={onAdvance} disabled={disabled}>
          {ctaLabel ?? 'Continue'}
        </Button>
      </div>
    </div>
  );
};

export default MockStepper;
