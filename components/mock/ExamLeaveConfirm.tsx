import { useEffect, useRef } from 'react';

import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';

export type ExamLeaveConfirmProps = {
  onStay: () => void;
  onLeave: () => void;
};

const focusableSelector =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export const ExamLeaveConfirm: React.FC<ExamLeaveConfirmProps> = ({
  onStay,
  onLeave,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const stayButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousActive = document.activeElement as HTMLElement | null;
    stayButtonRef.current?.focus();
    return () => {
      previousActive?.focus();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onStay();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onStay]);

  const titleId = 'exam-leave-confirm-title';

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onStay}
    >
      <div ref={dialogRef} onClick={(event) => event.stopPropagation()} className="w-full max-w-md">
        <Card className="rounded-ds-2xl p-5 shadow-xl">
          <div className="space-y-2">
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              Leave mock exam?
            </h2>
            <p className="text-sm text-muted-foreground">
              If you leave now, your current attempt may be submitted or lost. Are you sure you want to exit this mock?
            </p>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button ref={stayButtonRef} variant="ghost" size="sm" onClick={onStay}>
              Stay in exam
            </Button>
            <Button variant="destructive" size="sm" onClick={onLeave}>
              Leave exam
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ExamLeaveConfirm;
