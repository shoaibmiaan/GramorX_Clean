// ui/StreakBadge.tsx
//
// A compact badge component to display a streak value.  It shows a
// number inside a rounded circle with optional label beneath.  The
// badge uses generic styling and can be customised via props.

import * as React from 'react';

export interface StreakBadgeProps {
  /** The streak value to display. */
  value: number;
  /** Optional label shown below the number (e.g. "days"). */
  label?: string;
  /** Additional classes applied to the outer wrapper. */
  className?: string;
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ value, label = 'days', className }) => {
  const safeValue = Math.max(0, Math.trunc(value));
  return (
    <div className={['inline-flex flex-col items-center', className].filter(Boolean).join(' ')}>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold tabular-nums">
        {safeValue}
      </span>
      <span className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  );
};

export default StreakBadge;
