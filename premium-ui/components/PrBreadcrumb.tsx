import * as React from 'react';
import { twMerge } from 'tailwind-merge';

export type PrBreadcrumbItem = {
  /** Primary label that appears inside the chip. */
  label: string;
  /** Optional href. If omitted, the crumb renders as a button/span. */
  href?: string;
  /** Supplementary line shown under the label when space allows. */
  description?: string;
  /** Small metadata string rendered inside the chip (e.g., ID, locale). */
  meta?: string;
  /** Optional badge value. Shown as a pill appended to the label. */
  badge?: string;
  /** Tone applied to the badge + base chip. */
  status?: 'default' | 'success' | 'warning' | 'danger';
  /** Optional icon (React node) placed before the label. */
  icon?: React.ReactNode;
  /** For breadcrumb steps driven by callbacks instead of links. */
  onClick?: () => void;
};

export type PrBreadcrumbProps = {
  items: PrBreadcrumbItem[];
  /** Maximum number of visible crumbs before collapsing the middle. */
  maxVisible?: number;
  /** Adds tighter spacing / hides descriptions to fit narrow rails. */
  condensed?: boolean;
  className?: string;
};

type VisibleSegment =
  | { type: 'crumb'; item: PrBreadcrumbItem }
  | { type: 'overflow'; items: PrBreadcrumbItem[] };

const toneClasses: Record<NonNullable<PrBreadcrumbItem['status']>, string> = {
  default:
    'pr-bg-[color-mix(in_oklab,var(--pr-card)_72%,var(--pr-bg))] pr-text-[color-mix(in_oklab,var(--pr-fg)_25%,var(--pr-bg))]',
  success:
    'pr-bg-[color-mix(in_oklab,var(--pr-success)_20%,var(--pr-bg))] pr-text-[var(--pr-success)]',
  warning:
    'pr-bg-[color-mix(in_oklab,#f97316_22%,var(--pr-bg))] pr-text-[#f97316]',
  danger:
    'pr-bg-[color-mix(in_oklab,var(--pr-danger)_24%,var(--pr-bg))] pr-text-[var(--pr-danger)]',
};

const badgeTone: Record<NonNullable<PrBreadcrumbItem['status']>, string> = {
  default:
    'pr-border pr-border-transparent pr-text-[color-mix(in_oklab,var(--pr-fg)_25%,var(--pr-bg))]',
  success:
    'pr-border pr-border-[color-mix(in_oklab,var(--pr-success)_55%,transparent)] pr-text-[var(--pr-success)]',
  warning:
    'pr-border pr-border-[color-mix(in_oklab,#f97316_55%,transparent)] pr-text-[#fb923c]',
  danger:
    'pr-border pr-border-[color-mix(in_oklab,var(--pr-danger)_55%,transparent)] pr-text-[var(--pr-danger)]',
};

const separator = (
  <svg
    aria-hidden
    viewBox="0 0 16 16"
    width={14}
    height={14}
    className="pr-text-[color-mix(in_oklab,var(--pr-fg)_55%,var(--pr-bg))]"
  >
    <path
      d="M5.75 3.5L10.25 8l-4.5 4.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function PrBreadcrumb({
  items,
  maxVisible = 5,
  condensed = false,
  className,
}: PrBreadcrumbProps) {
  if (!items?.length) return null;

  const clamped = Math.max(3, maxVisible);
  const visibleSegments = React.useMemo<VisibleSegment[]>(() => {
    if (items.length <= clamped) {
      return items.map((item) => ({ type: 'crumb', item }));
    }

    const first = items[0];
    const tailCount = clamped - 2; // reserve 1 slot for overflow control
    const tail = items.slice(-tailCount);
    const hidden = items.slice(1, items.length - tail.length);

    return [
      { type: 'crumb', item: first },
      { type: 'overflow', items: hidden },
      ...tail.map((item) => ({ type: 'crumb', item })),
    ];
  }, [items, clamped]);

  return (
    <nav aria-label="Breadcrumb" className={twMerge('pr-text-sm pr-w-full', className)}>
      <ol className="pr-flex pr-flex-wrap pr-items-center pr-gap-1.5">
        {visibleSegments.map((segment, index) => {
          const isLast = index === visibleSegments.length - 1;
          return (
            <React.Fragment key={index}>
              <li className="pr-flex pr-items-center pr-gap-1.5">
                {segment.type === 'crumb' ? (
                  <Crumb
                    item={segment.item}
                    isCurrent={isLast}
                    condensed={condensed}
                  />
                ) : (
                  <OverflowCrumb hiddenItems={segment.items} condensed={condensed} />
                )}
              </li>
              {!isLast && <li aria-hidden>{separator}</li>}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

type CrumbProps = {
  item: PrBreadcrumbItem;
  isCurrent: boolean;
  condensed: boolean;
};

function Crumb({ item, isCurrent, condensed }: CrumbProps) {
  const status = item.status ?? 'default';
  const Component = (item.href ? 'a' : item.onClick ? 'button' : 'span') as
    | 'a'
    | 'button'
    | 'span';
  const actionableProps = item.href
    ? { href: item.href }
    : item.onClick
    ? { onClick: item.onClick, type: 'button' as const }
    : {};

  const chip = (
    <Component
      {...actionableProps}
      aria-current={isCurrent ? 'page' : undefined}
      className={twMerge(
        'pr-group pr-inline-flex pr-items-center pr-gap-2 pr-rounded-2xl pr-border pr-border-transparent pr-px-3 pr-py-1.5 pr-transition pr-duration-150 pr-backdrop-blur-sm',
        isCurrent
          ? 'pr-bg-[color-mix(in_oklab,var(--pr-fg)_86%,var(--pr-bg))] pr-text-[var(--pr-bg)] pr-font-semibold'
          : toneClasses[status],
        item.onClick && 'pr-cursor-pointer pr-outline-none focus-visible:pr-ring-2 focus-visible:pr-ring-[var(--pr-primary)]',
        item.href && 'pr-no-underline hover:pr-border-[var(--pr-primary)] hover:pr-text-[var(--pr-fg)]',
      )}
    >
      {item.icon && <span className="pr-text-base pr-opacity-80">{item.icon}</span>}
      <span className="pr-flex pr-flex-col pr-text-left">
        <span className="pr-flex pr-items-center pr-gap-2">
          <span className="pr-font-medium">{item.label}</span>
          {item.meta && (
            <span className="pr-text-[11px] pr-uppercase pr-tracking-wide pr-text-[color-mix(in_oklab,var(--pr-fg)_35%,var(--pr-bg))]">
              {item.meta}
            </span>
          )}
        </span>
        {!condensed && item.description && (
          <span className="pr-text-[12px] pr-text-[color-mix(in_oklab,var(--pr-fg)_40%,var(--pr-bg))]">
            {item.description}
          </span>
        )}
      </span>
      {item.badge && (
        <span
          className={twMerge(
            'pr-rounded-full pr-px-2 pr-py-0.5 pr-text-[11px] pr-font-medium',
            badgeTone[status],
          )}
        >
          {item.badge}
        </span>
      )}
    </Component>
  );

  return chip;
}

type OverflowProps = {
  hiddenItems: PrBreadcrumbItem[];
  condensed: boolean;
};

function OverflowCrumb({ hiddenItems, condensed }: OverflowProps) {
  const detailsRef = React.useRef<HTMLDetailsElement>(null);

  const close = React.useCallback(() => {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
  }, []);

  return (
    <details ref={detailsRef} className="pr-relative pr-inline-block">
      <summary
        className="pr-inline-flex pr-h-9 pr-w-9 pr-items-center pr-justify-center pr-rounded-full pr-border pr-border-[color-mix(in_oklab,var(--pr-border)_60%,transparent)] pr-bg-[color-mix(in_oklab,var(--pr-card)_65%,var(--pr-bg))] pr-text-[color-mix(in_oklab,var(--pr-fg)_30%,var(--pr-bg))] pr-cursor-pointer focus-visible:pr-outline-none focus-visible:pr-ring-2 focus-visible:pr-ring-[var(--pr-primary)]"
        aria-label={`Show ${hiddenItems.length} more levels`}
      >
        …
      </summary>
      <div className="pr-absolute pr-z-30 pr-mt-2 pr-min-w-[240px] pr-rounded-2xl pr-border pr-border-[color-mix(in_oklab,var(--pr-border)_55%,transparent)] pr-bg-[color-mix(in_oklab,var(--pr-card)_55%,var(--pr-bg))] pr-p-2 pr-shadow-lg">
        <span className="pr-block pr-p-2 pr-text-[11px] pr-font-semibold pr-text-[color-mix(in_oklab,var(--pr-fg)_35%,var(--pr-bg))]">
          Previous levels
        </span>
        <ul className="pr-flex pr-flex-col pr-gap-1">
          {hiddenItems.map((item, idx) => {
            const status = item.status ?? 'default';
            const Component = (item.href ? 'a' : item.onClick ? 'button' : 'span') as
              | 'a'
              | 'button'
              | 'span';
            const actionableProps = item.href
              ? { href: item.href }
              : item.onClick
              ? {
                  onClick: () => {
                    item.onClick?.();
                    close();
                  },
                  type: 'button' as const,
                }
              : {};

            return (
              <li key={`${item.label}-${idx}`}>
                <Component
                  {...actionableProps}
                  className={twMerge(
                    'pr-flex pr-w-full pr-items-center pr-gap-2 pr-rounded-2xl pr-border pr-border-transparent pr-px-3 pr-py-2 pr-text-left pr-text-sm pr-transition hover:pr-border-[var(--pr-primary)]',
                    toneClasses[status],
                  )}
                  onClick={item.href ? close : undefined}
                >
                  <span className="pr-flex pr-flex-col">
                    <span className="pr-font-medium">{item.label}</span>
                    {!condensed && item.description && (
                      <span className="pr-text-[12px] pr-text-[color-mix(in_oklab,var(--pr-fg)_40%,var(--pr-bg))]">
                        {item.description}
                      </span>
                    )}
                  </span>
                  {item.badge && (
                    <span
                      className={twMerge(
                        'pr-ml-auto pr-rounded-full pr-px-2 pr-py-0.5 pr-text-[11px] pr-font-medium',
                        badgeTone[status],
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Component>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}
