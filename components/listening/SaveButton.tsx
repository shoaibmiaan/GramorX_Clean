import * as React from 'react';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export type SaveButtonProps = {
  state: SaveState;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  /**
   * Optional last saved timestamp. Can be Date or ISO string.
   */
  lastSavedAt?: Date | string | null;
};

function formatLastSaved(lastSavedAt?: Date | string | null): string | null {
  if (!lastSavedAt) return null;
  const date =
    lastSavedAt instanceof Date ? lastSavedAt : new Date(lastSavedAt);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Small DS-compliant save button for Listening/Writing-style autosave UI.
 * Designed to sit in exam headers / toolbars.
 */
export const SaveButton: React.FC<SaveButtonProps> = ({
  state,
  disabled,
  onClick,
  className = '',
  lastSavedAt,
}) => {
  const saving = state === 'saving';
  const errored = state === 'error';
  const saved = state === 'saved';

  let label = 'Save progress';
  if (saving) label = 'Saving…';
  else if (saved) label = 'Saved';
  else if (errored) label = 'Retry save';

  let tone: 'neutral' | 'primary' | 'danger' = 'neutral';
  if (saved) tone = 'primary';
  if (errored) tone = 'danger';

  const savedTime = formatLastSaved(lastSavedAt);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        type="button"
        size="xs"
        variant="outline"
        tone={tone}
        disabled={disabled || saving}
        onClick={onClick}
        className="inline-flex items-center gap-1 rounded-full text-[11px]"
      >
        {saving ? (
          <>
            <span className="inline-block h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent" />
            <span>{label}</span>
          </>
        ) : (
          <>
            {saved && <Icon name="CheckCircle" className="h-3.5 w-3.5" />}
            {errored && <Icon name="AlertTriangle" className="h-3.5 w-3.5" />}
            {!saved && !errored && (
              <Icon name="Save" className="h-3.5 w-3.5" />
            )}
            <span>{label}</span>
          </>
        )}
      </Button>

      <p className="text-[10px] text-muted-foreground">
        {saving && 'Auto-saving your answers…'}
        {!saving && saved && savedTime && `Saved at ${savedTime}`}
        {!saving && saved && !savedTime && 'All changes saved'}
        {!saving &&
          !saved &&
          !errored &&
          savedTime &&
          `Last saved at ${savedTime}`}
        {!saving && errored && 'Could not save. Check your connection.'}
      </p>
    </div>
  );
};

export default SaveButton;
