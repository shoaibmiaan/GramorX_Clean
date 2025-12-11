import * as React from 'react';

import { Button } from '@/components/design-system/Button';
import { Icon, type IconName } from '@/components/design-system/Icon';
import { cn } from '@/lib/utils';

export type ExamHeaderProps = {
  title: string;
  subtitle?: string;
  iconName?: IconName;
  meta?: React.ReactNode;
  timer?: React.ReactNode;
  primaryAction?: React.ReactNode;
  rightExtras?: React.ReactNode;
  onExit?: () => void;
  exitLabel?: string;
  className?: string;
};

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  title,
  subtitle,
  iconName,
  meta,
  timer,
  primaryAction,
  rightExtras,
  onExit,
  exitLabel = 'Exit exam',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex h-14 items-center gap-4 text-foreground',
        'w-full',
        className
      )}
      role="presentation"
    >
      <div className="flex min-w-0 items-center gap-3">
        {iconName && (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-subtle text-primary ring-1 ring-border/60">
            <Icon name={iconName} size={20} />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Mock Exam
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold leading-tight text-foreground sm:text-base">
            <span className="truncate">{title}</span>
            {subtitle && (
              <span className="truncate text-xs font-normal text-muted-foreground sm:text-sm">
                {subtitle}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center gap-4 text-sm text-muted-foreground">
        {meta}
        {timer}
      </div>

      <div className="flex flex-shrink-0 items-center justify-end gap-2">
        {rightExtras}
        {primaryAction}
        {onExit && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={onExit}
          >
            <Icon name="log-out" size={16} className="mr-1" />
            {exitLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ExamHeader;
