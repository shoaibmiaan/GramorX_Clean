import * as React from 'react';

import { cn } from '@/lib/utils';

export type ExamContentProps = {
  children: React.ReactNode;
  className?: string;
};

export const ExamContent: React.FC<ExamContentProps> = ({
  children,
  className,
}) => {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 lg:py-8',
        className,
      )}
    >
      {children}
    </div>
  );
};

export default ExamContent;
