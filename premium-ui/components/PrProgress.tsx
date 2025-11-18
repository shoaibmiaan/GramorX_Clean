import * as React from 'react';

export type PrProgressProps = {
  value: number;
  'aria-label'?: string;
};

export function PrProgress({ value, 'aria-label': ariaLabel }: PrProgressProps) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label={ariaLabel}
      className="pr-w-full pr-h-2 pr-rounded-full pr-bg-[color-mix(in_oklab,var(--pr-card)_92%,black_8%)] pr-overflow-hidden pr-border pr-border-[color-mix(in_oklab,var(--pr-border)_70%,transparent)]"
    >
      <div
        className="pr-h-full pr-bg-[var(--pr-primary)] pr-transition-all pr-duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
