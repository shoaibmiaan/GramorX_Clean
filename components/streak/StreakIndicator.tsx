// ui/StreakIndicator.tsx
//
// A simple visual indicator for a user’s current streak and remaining
// shields.  It shows a fire icon alongside the streak count and a
// shield icon with the shield count.  The component is purely
// presentational and accepts props to control its appearance.  It
// does not perform any network requests or side effects.

import * as React from 'react';

// Utility to join CSS class names
const cx = (...xs: Array<string | false | null | undefined>) => xs.filter(Boolean).join(' ');

type Tone = 'electric' | 'primary' | 'accent';

export interface StreakIndicatorProps {
  /** Additional classes applied to the outer container. */
  className?: string;
  /** Current streak value. */
  value: number;
  /** Number of shields or recovery tokens. */
  shields?: number;
  /** If true, renders a more compact indicator. */
  compact?: boolean;
  /** Colour tone (affects border and background). */
  tone?: Tone;
}

const FireIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" {...p}>
    <path fill="currentColor" d="M12 2c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1 .2-1.9.6-2.8C6 8 4 10.3 4 13.5A7.5 7.5 0 0 0 11.5 21h1A7.5 7.5 0 0 0 20 13.5C20 7.5 14 6 12 2z" />
  </svg>
);

const ShieldIcon = (p: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" {...p}>
    <path fill="currentColor" d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z" />
  </svg>
);

/**
 * Renders a streak indicator with icons and counts.  Use the
 * `compact` prop to shrink padding and reduce font size.  The `tone`
 * prop controls accent colours; by default it uses an electric blue.
 */
export const StreakIndicator: React.FC<StreakIndicatorProps> = ({
  className = '',
  value,
  shields = 0,
  compact = false,
  tone = 'electric',
}) => {
  const streakValue = Math.max(0, Math.trunc(value));
  const shieldCount = Math.max(0, Math.trunc(shields));

  const toneCls =
    tone === 'primary'
      ? 'border-primary/30 bg-primary/10 text-primary'
      : tone === 'accent'
      ? 'border-accent/30 bg-accent/10 text-accent'
      : 'border-electricBlue/30 bg-electricBlue/10 text-electricBlue';
  const density = compact ? 'px-2.5 py-1.5 text-small' : 'px-3.5 py-2';

  return (
    <div
      className={cx(
        'inline-flex items-center gap-2 rounded-ds border dark:border-current/40',
        toneCls,
        density,
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={`Current streak ${streakValue} days, ${shieldCount} shields`}
      title={`Streak: ${streakValue}`}
    >
      <FireIcon />
      <span className="font-semibold tabular-nums">{streakValue}</span>
      <span className="mx-1 opacity-40">•</span>
      <ShieldIcon />
      <span className="font-semibold tabular-nums">{shieldCount}</span>
    </div>
  );
};

export default StreakIndicator;
