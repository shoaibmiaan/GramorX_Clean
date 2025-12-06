import * as React from 'react';

import { cn } from '@/lib/utils';

export const MockExamRoomLayout: React.FC<{
  header: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}> = ({ header, sidebar, children, className }) => {
  return (
    <div className={cn('min-h-screen flex flex-col bg-exam-room text-foreground', className)}>
      <header className="sticky top-0 z-20 border-b border-border bg-surface-elevated">
        <div className="h-14 flex items-center justify-between px-4 sm:px-6">
          {header}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {sidebar && (
          <aside className="hidden w-72 overflow-y-auto border-r border-border bg-surface-subtle lg:block">
            {sidebar}
          </aside>
        )}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MockExamRoomLayout;
