// components/listening/Mock/MockInstructions.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type Props = {
  testTitle: string;
  durationMinutes: number;
};

const MockInstructions: React.FC<Props> = ({ testTitle, durationMinutes }) => {
  return (
    <Card className="space-y-4 border-border bg-card/60 p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <Icon name="Headphones" size={18} className="text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground sm:text-base">
            {testTitle}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            This mock is designed to behave like the real IELTS computer-based Listening test.
            No extra pauses, no rewinds, no mercy.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground sm:p-4 sm:text-sm">
          <h3 className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-foreground">
            <Icon name="Info" size={13} />
            <span>Important rules</span>
          </h3>
          <ul className="list-disc space-y-1 pl-4">
            <li>Total time: {durationMinutes} minutes. The timer does not stop.</li>
            <li>Audio plays automatically. You cannot pause or rewind.</li>
            <li>Check spelling carefully. Wrong spelling = wrong answer.</li>
            <li>Follow word limits. Extra words can make a correct idea wrong.</li>
          </ul>
        </Card>

        <Card className="border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground sm:p-4 sm:text-sm">
          <h3 className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-foreground">
            <Icon name="Shield" size={13} />
            <span>Exam conditions</span>
          </h3>
          <ul className="list-disc space-y-1 pl-4">
            <li>Use headphones and sit somewhere quiet.</li>
            <li>No switching tabs once you start. In real exam, that&apos;s suspicious behaviour.</li>
            <li>Keep your phone away. This is a simulation, treat it seriously.</li>
            <li>When timer hits zero, your answers are auto-submitted.</li>
          </ul>
        </Card>
      </div>
    </Card>
  );
};

export default MockInstructions;
