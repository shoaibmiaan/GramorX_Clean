import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { Icon, type IconName } from '@/components/design-system/Icon';
import { cn } from '@/lib/utils';

const HUMANIZE = (value: string) =>
  value
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

const SEGMENT_MAP: Record<string, { label: string; icon?: IconName }> = {
  dashboard: { label: 'Dashboard', icon: 'home' },
  reading: { label: 'Reading', icon: 'book-open' },
  listening: { label: 'Listening', icon: 'headphones' },
  writing: { label: 'Writing', icon: 'pen-square' },
  speaking: { label: 'Speaking', icon: 'mic' },
  mock: { label: 'Mock Tests', icon: 'test-tube' },
  ai: { label: 'AI', icon: 'sparkles' },
  coach: { label: 'Coach', icon: 'user' },
  profile: { label: 'Profile', icon: 'user' },
  account: { label: 'Account', icon: 'id-badge' },
  settings: { label: 'Settings', icon: 'settings' },
  billing: { label: 'Billing', icon: 'credit-card' },
  analytics: { label: 'Analytics', icon: 'bar-chart-3' },
  pricing: { label: 'Pricing', icon: 'badge-dollar-sign' },
  reports: { label: 'Reports', icon: 'file-text' },
  teacher: { label: 'Teacher', icon: 'graduation-cap' },
};

const ROUTE_MAP: Record<string, { label: string; icon?: IconName }> = {
  '/mock/reading': { label: 'Reading Mocks', icon: 'book-open' },
  '/mock/writing': { label: 'Writing Mocks', icon: 'pen-square' },
  '/mock/listening': { label: 'Listening Mocks', icon: 'headphones' },
  '/mock/speaking': { label: 'Speaking Mocks', icon: 'mic' },
  '/ai/coach': { label: 'AI Coach', icon: 'sparkles' },
};

const looksDynamic = (segment: string) =>
  /\d+/.test(segment) ||
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i.test(segment);

export const EnterpriseBreadcrumbs: React.FC<{ className?: string }> = ({ className }) => {
  const router = useRouter();
  const path = React.useMemo(() => router.asPath.split('#')[0].split('?')[0], [router.asPath]);
  const segments = React.useMemo(() => path.split('/').filter(Boolean), [path]);

  const crumbs = React.useMemo(() => {
    return segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      const descriptor = ROUTE_MAP[href] ?? SEGMENT_MAP[segment];

      const label = descriptor?.label
        ? descriptor.label
        : looksDynamic(segment)
        ? 'Details'
        : HUMANIZE(segment);

      return {
        href,
        label,
        icon: descriptor?.icon,
        isLast: index === segments.length - 1,
      };
    });
  }, [segments]);

  if (!crumbs.length) return null;

  return (
    <div
      className={cn(
        'w-full border-b border-border/50 bg-muted/50 backdrop-blur supports-[backdrop-filter]:bg-muted/70',
        'flex items-center h-10 px-4',
        className,
      )}
    >
      <nav className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link
          href="/"
          className="flex items-center gap-1 rounded px-1 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Icon name="home" className="h-3.5 w-3.5" />
          <span className="sr-only">Home</span>
        </Link>

        {crumbs.map((crumb) => (
          <React.Fragment key={crumb.href}>
            <span className="text-muted-foreground/40">/</span>
            {crumb.isLast ? (
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                {crumb.icon && <Icon name={crumb.icon} className="h-3.5 w-3.5" />}
                <span className="truncate max-w-[180px]">{crumb.label}</span>
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="flex items-center gap-1.5 rounded px-1 transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {crumb.icon && <Icon name={crumb.icon} className="h-3.5 w-3.5" />}
                <span className="truncate max-w-[160px]">{crumb.label}</span>
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
};

export default EnterpriseBreadcrumbs;
