// components/listening/Mock/MockSectionNavigator.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type SectionNavQuestion = {
  id: string;
  label: string; // usually "1", "2", etc.
  status: 'unanswered' | 'answered' | 'flagged';
};

type SectionNavItem = {
  sectionNumber: number;
  questions: SectionNavQuestion[];
};

type Props = {
  sections: SectionNavItem[];
  currentSectionNumber: number;
  currentQuestionId: string | null;
  onSelectQuestion: (sectionNumber: number, questionId: string) => void;
};

const statusClass: Record<SectionNavQuestion['status'], string> = {
  unanswered: 'border-border bg-background text-muted-foreground',
  answered: 'border-primary/70 bg-primary/10 text-foreground',
  flagged: 'border-warning/70 bg-warning/10 text-warning',
};

const MockSectionNavigator: React.FC<Props> = ({
  sections,
  currentSectionNumber,
  currentQuestionId,
  onSelectQuestion,
}) => {
  return (
    <Card className="h-full border-border bg-card/60 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="Grid3X3" size={16} className="text-primary" />
          <h2 className="text-xs font-semibold text-foreground sm:text-sm">
            Question navigator
          </h2>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Tap to jump to a question.
        </p>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <div key={section.sectionNumber} className="space-y-1.5">
            <p className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              <Icon name="Layers" size={11} />
              <span>Section {section.sectionNumber}</span>
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {section.questions.map((q) => {
                const isActive =
                  section.sectionNumber === currentSectionNumber &&
                  q.id === currentQuestionId;

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => onSelectQuestion(section.sectionNumber, q.id)}
                    className={[
                      'flex h-8 w-8 items-center justify-center rounded-md border text-[11px] font-medium transition-colors',
                      statusClass[q.status],
                      isActive ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : '',
                    ].join(' ')}
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-1.5 text-[11px] text-muted-foreground">
        <p className="flex items-center gap-1">
          <span className="inline-flex h-3 w-3 rounded border border-border bg-background" />
          <span>Unanswered</span>
        </p>
        <p className="flex items-center gap-1">
          <span className="inline-flex h-3 w-3 rounded border border-primary/70 bg-primary/10" />
          <span>Answered</span>
        </p>
        <p className="flex items-center gap-1">
          <span className="inline-flex h-3 w-3 rounded border border-warning/70 bg-warning/10" />
          <span>Flagged</span>
        </p>
      </div>
    </Card>
  );
};

export default MockSectionNavigator;
