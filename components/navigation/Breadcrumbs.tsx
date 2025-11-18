// components/navigation/Breadcrumbs.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/router';

import { Container } from '@/components/design-system/Container';
import { buildBreadcrumbs } from '@/lib/breadcrumbs';
import { cn } from '@/lib/utils';

export const BreadcrumbsBar: React.FC<{ className?: string }> = ({ className }) => {
  const router = useRouter();
  const breadcrumbs = buildBreadcrumbs(router.pathname, router.query);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <div className={cn('border-b border-border/60 bg-background/80 backdrop-blur', className)}>
      <Container className="py-2">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
            {breadcrumbs.map((item, index) => (
              <li key={`${item.key}-${index}`} className="flex items-center gap-2">
                {item.href && !item.isCurrent ? (
                  <Link
                    href={item.href}
                    className="font-medium transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={cn('font-semibold text-foreground', !item.isCurrent && 'text-muted-foreground')}>
                    {item.label}
                  </span>
                )}
                {index < breadcrumbs.length - 1 && <span aria-hidden="true">/</span>}
              </li>
            ))}
          </ol>
        </nav>
      </Container>
    </div>
  );
};

export default BreadcrumbsBar;
