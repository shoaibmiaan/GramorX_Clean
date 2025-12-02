// components/exam/ExamHeader.tsx
import * as React from 'react';
import Link from 'next/link';

import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import { cn } from '@/lib/utils';

export type ExamHeaderProps = {
  /** e.g. "IELTS Reading Test" */
  examLabel: string;
  /** Main title – usually the test title */
  title: string;
  /** Optional smaller line under the title */
  subtitle?: string;
  /** Optional breadcrumbs strip above label (kept generic) */
  breadcrumbs?: React.ReactNode;
  /** Left meta block – e.g. "40 questions • 3 passages • 60 minutes" */
  metaLeft?: React.ReactNode;
  /** Right meta block – usually timer + band / mode chips */
  metaRight?: React.ReactNode;
  /** If provided, shows a small "Exit test" button on the right */
  onExitHref?: string;
  className?: string;
};

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  examLabel,
  title,
  subtitle,
  breadcrumbs,
  metaLeft,
  metaRight,
  onExitHref,
  className,
}) => {
  return (
    <header
      className={cn(
        'w-full border-b border-border/60 bg-background/95',
        'backdrop-blur supports-[backdrop-filter]:bg-background/80',
        'shadow-sm',
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3">
        {breadcrumbs ? (
          <div className="text-[11px] text-muted-foreground">{breadcrumbs}</div>
        ) : null}

        <div className="flex items-start justify-between gap-4">
          {/* LEFT: exam label + title + subtitle + meta */}
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {examLabel}
            </div>

            <h1 className="mt-0.5 line-clamp-1 text-base font-semibold text-foreground">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {subtitle}
              </p>
            ) : null}

            {metaLeft ? (
              <div className="mt-2 text-[11px] text-muted-foreground">
                {metaLeft}
              </div>
            ) : null}
          </div>

          {/* RIGHT: timer + actions */}
          <div className="flex flex-col items-end gap-2">
            {metaRight ? <div className="text-xs">{metaRight}</div> : null}

            {onExitHref ? (
              <Link href={onExitHref} className="inline-flex">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-[11px] font-medium"
                >
                  <Icon name="log-out" className="mr-1.5 h-3.5 w-3.5" />
                  Exit test
                </Button>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default ExamHeader;
