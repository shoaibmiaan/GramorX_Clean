import { useMemo } from 'react';

import { Breadcrumbs as BaseBreadcrumbs, Crumb } from '@/components/design-system/Breadcrumbs';

const titleCase = (segment: string) => {
  return segment
    .replace(/\[|\]/g, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const MockBreadcrumbs: React.FC<{ pathname: string }> = ({ pathname }) => {
  const items: Crumb[] = useMemo(() => {
    const safePath = pathname.split('?')[0] || '/mock';
    const segments = safePath.split('/').filter(Boolean);

    const trail: Crumb[] = [{ label: 'Mock Home', href: '/mock' }];
    if (segments[0] !== 'mock') return trail;

    let currentPath = '/mock';

    segments.slice(1).forEach((segment, index, arr) => {
      currentPath += `/${segment}`;
      const label = titleCase(segment);
      trail.push({
        label,
        href: index === arr.length - 1 ? undefined : currentPath,
      });
    });

    return trail;
  }, [pathname]);

  return (
    <div className="overflow-x-auto">
      <BaseBreadcrumbs items={items} className="min-w-0 whitespace-nowrap" />
    </div>
  );
};

export default MockBreadcrumbs;
