// components/listening/ListeningNavTabs.tsx
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const TABS = [
  { key: 'learn', label: 'Learn', href: '/listening/learn' },
  { key: 'practice', label: 'Practice', href: '/listening/practice' },
  { key: 'game', label: 'Game', href: '/listening/game' },
  { key: 'mock', label: 'Mock', href: '/mock/listening' },
  { key: 'analytics', label: 'Analytics', href: '/listening/analytics' },
];

type Props = {
  activeKey?: string;
};

const ListeningNavTabs: React.FC<Props> = ({ activeKey }) => {
  const router = useRouter();
  const current = activeKey ?? router.pathname.split('/')[2] ?? '';

  return (
    <nav className="mb-6 overflow-x-auto">
      <ul className="flex items-center gap-1">
        {TABS.map((tab) => {
          const active = current === tab.key;

          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                className={[
                  'inline-flex items-center rounded-md px-3 py-1.5 text-sm transition',
                  active
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                ].join(' ')}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default ListeningNavTabs;
