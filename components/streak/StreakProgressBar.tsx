// ui/StreakProgressBar.tsx
//
// A basic progress bar used to visualize progress towards a target
// number of days. The bar fills horizontally based on the
// proportion of `current` to `goal`. It is purely presentational.

/* eslint-disable ds-guard/no-inline-style */

import * as React from 'react';

interface Props {
  /** The current value contributing to progress. */
  current: number;
  /** The target value at which the bar will be fully filled. */
  goal: number;
  /** Additional classes applied to the outer bar container. */
  className?: string;
}

export const StreakProgressBar: React.FC<Props> = ({ current, goal, className }) => {
  const safeGoal = goal > 0 ? goal : 1;
  const ratio = Math.max(0, Math.min(current / safeGoal, 1));

  return (
    <div
      className={[
        'w-full bg-muted/20 rounded-full h-3 overflow-hidden',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className="bg-primary h-full rounded-full transition-width"
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
};

export default StreakProgressBar;
