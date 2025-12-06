import * as React from 'react';

import { cn } from '@/lib/utils';

export type ExamSidebarProps = {
  title?: string;
  header?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export const ExamSidebar: React.FC<ExamSidebarProps> = ({
  title,
  header,
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex h-full flex-col gap-4 px-4 py-5 text-foreground',
        className,
      )}
    >
      {(title || header) && (
        <div className="space-y-1">
          {title && (
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {title}
            </p>
          )}
          {header}
        </div>
      )}
      <div className="space-y-2 overflow-y-auto pr-1 text-sm text-muted-foreground">
        {children}
      </div>
    </div>
  );
};

export default ExamSidebar;
