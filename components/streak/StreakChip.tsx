// ui/StreakChip.tsx
//
// A pill‑shaped chip showing the user’s streak in days.  Optionally
// renders as a link when an href is provided.  Displays a fire icon
// alongside the count.  Use this component in headers or profile
// summaries to give a quick glance at the current streak.

import * as React from 'react';

type Props = {
  /** The number of days in the current streak. */
  value: number;
  /** If provided, the chip will render as an anchor linking to this URL. */
  href?: string;
  /** When true, renders placeholder content. */
  loading?: boolean;
  /** Additional classes on the outer element. */
  className?: string;
};

const FireIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden fill="currentColor">
    <path d="M12 2c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1 .2-1.9.6-2.8C6 8 4 10.3 4 13.5A7.5 7.5 0 0 0 11.5 21h1A7.5 7.5 0 0 0 20 13.5C20 7.5 14 6 12 2z" />
  </svg>
);

function ChipContent({ value, loading }: { value: number; loading?: boolean }) {
  const label = loading ? '—' : value;
  const description = loading ? 'Loading streak' : `${value} day${value === 1 ? '' : 's'} streak`;
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-small font-semibold text-foreground shadow-sm"
      aria-live="polite"
    >
      <FireIcon size={16} />
      <span className="tabular-nums text-body">{label}</span>
      <span className="text-xs uppercase tracking-wide text-muted-foreground">days</span>
      <span className="sr-only">{description}</span>
    </span>
  );
}

/**
 * Renders a streak chip.  When `href` is provided, the chip wraps its
 * content in an anchor tag to make it navigable.  Otherwise it
 * renders a span.  When `loading` is true it displays placeholders
 * instead of the actual value.
 */
export const StreakChip: React.FC<Props> = ({ value, href, loading, className }) => {
  const chip = <ChipContent value={value} loading={loading} />;
  if (!href) {
    return <span className={className}>{chip}</span>;
  }
  return (
    <a
      href={href}
      className={[
        'inline-flex items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label={loading ? 'Loading streak' : `${value}-day streak`}
    >
      {chip}
    </a>
  );
};

export default StreakChip;
