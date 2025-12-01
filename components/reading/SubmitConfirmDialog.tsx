// components/reading/SubmitConfirmDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from '@/components/design-system/Dialog';
import { Button } from '@/components/design-system/Button';

type Props = {
  open: boolean;
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export function SubmitConfirmDialog({ open, onCancel, onConfirm, count }: Props) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="max-w-md rounded-xl">
        <DialogHeader>
          <h3 className="text-lg font-semibold text-foreground">
            Submit test?
          </h3>
          <p className="text-sm text-muted-foreground">
            You still have {count} unanswered questions. Submit anyway?
          </p>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Continue
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Submit Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
