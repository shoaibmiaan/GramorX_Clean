import * as React from 'react';
import Link from 'next/link';

import { Icon } from '@/components/design-system/Icon';
import { cn } from '@/lib/utils';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('w-full overflow-x-auto', className)}>
      <ol className="flex flex-wrap items-center gap-2 text-small text-muted-foreground sm:flex-nowrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          const content = item.href && !isLast ? (
            <Link
              href={item.href}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium transition-colors hover:bg-muted/70 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              {item.label}
            </Link>
          ) : (
            <span
              aria-current={isLast ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold text-foreground',
                isLast ? 'bg-primary/10 text-primary' : 'bg-muted/60',
              )}
            >
              {item.label}
            </span>
          );

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {content}
              {!isLast && <Icon name="chevron-right" className="h-4 w-4 text-border" aria-hidden />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
