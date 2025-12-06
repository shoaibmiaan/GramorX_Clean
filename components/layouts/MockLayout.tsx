// components/layouts/MockLayout.tsx
import React, { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { cn } from '@/lib/utils';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import { Badge } from '@/components/design-system/Badge';
import { Separator } from '@/components/design-system/Separator';
import { Card } from '@/components/design-system/Card';

interface MockLayoutProps {
  children: ReactNode;
  userRole?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  description?: string;
  badge?: string;
  badgeVariant?: 'success' | 'info' | 'warning' | 'neutral';
}

type BgVariant = 'gradient' | 'solid' | 'muted';

const MockLayout: React.FC<MockLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { pathname } = router;
  const [bgVariant, setBgVariant] = useState<BgVariant>('gradient');

  const mainNavItems: NavItem[] = [
    {
      href: '/mock',
      label: 'Mock Dashboard',
      icon: 'LayoutDashboard',
      description: 'Control room for all mocks',
    },
    {
      href: '/mock/full',
      label: 'Full IELTS Mock',
      icon: 'Timer',
      description: 'Complete exam simulation',
      badge: 'Recommended',
      badgeVariant: 'success',
    },
  ];

  const moduleNavItems: NavItem[] = [
    {
      href: '/mock/reading',
      label: 'Reading',
      icon: 'BookOpenCheck',
      description: '3 passages, 40 questions',
    },
    {
      href: '/mock/listening',
      label: 'Listening',
      icon: 'Headphones',
      description: '4 sections, single-play audio',
    },
    {
      href: '/mock/writing',
      label: 'Writing',
      icon: 'PenSquare',
      description: 'Task 1 + Task 2 with AI feedback',
      badge: 'Beta',
      badgeVariant: 'info',
    },
    {
      href: '/mock/speaking',
      label: 'Speaking',
      icon: 'Mic',
      description: 'Parts 1–3 with recording',
      badge: 'Preview',
      badgeVariant: 'info',
    },
  ];

  const utilityNavItems: NavItem[] = [
    {
      href: '/mock/history',
      label: 'Attempt History',
      icon: 'History',
      description: 'View all mock results',
    },
    {
      href: '/mock/analytics',
      label: 'Mock Analytics',
      icon: 'TrendingUp',
      description: 'Band scores & progress',
    },
    {
      href: '/ai?source=mock',
      label: 'AI Lab Review',
      icon: 'Sparkles',
      description: 'Get detailed feedback',
    },
    {
      href: '/resources/mock-strategies',
      label: 'Test Strategies',
      icon: 'Lightbulb',
      description: 'IELTS exam tips',
    },
  ];

  const isActive = (href: string) => {
    if (href === '/mock') return pathname === '/mock';
    return pathname.startsWith(href);
  };

  const bgClass = (() => {
    switch (bgVariant) {
      case 'solid':
        return 'bg-lightBg';
      case 'muted':
        return 'bg-muted/30';
      case 'gradient':
      default:
        return 'bg-gradient-to-br from-lightBg via-muted/40 to-lightBg';
    }
  })();

  return (
    <div className={cn('flex min-h-screen text-foreground', bgClass)}>
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border/40 bg-card/60 lg:flex">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
              <Icon name="Timer" className="text-primary" size={20} />
            </div>
            <div className="space-y-0.5">
              <h2 className="text-lg font-semibold tracking-tight leading-snug">
                Mock Tests
              </h2>
              <p className="text-xs leading-snug text-muted-foreground">
                IELTS Exam Room
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-6 px-4 pb-4">
          <div>
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Access
            </h3>
            <nav className="space-y-1">
              {mainNavItems.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant={isActive(item.href) ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'w-full justify-start px-3',
                    isActive(item.href) && 'bg-secondary/80 font-medium'
                  )}
                >
                  <Link href={item.href}>
                    <Icon name={item.icon} className="mr-3" size={16} />
                    <div className="flex flex-1 flex-col items-start space-y-0.5 leading-snug">
                      <span>{item.label}</span>
                      {item.description && (
                        <span className="text-[11px] text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </div>
                    {item.badge && (
                      <Badge
                        variant={item.badgeVariant || 'neutral'}
                        size="xs"
                        className="ml-2"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Module Mocks
            </h3>
            <nav className="space-y-1">
              {moduleNavItems.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant={isActive(item.href) ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'w-full justify-start px-3',
                    isActive(item.href) && 'bg-secondary/80 font-medium'
                  )}
                >
                  <Link href={item.href}>
                    <Icon name={item.icon} className="mr-3" size={16} />
                    <div className="flex flex-1 flex-col items-start space-y-0.5 leading-snug">
                      <span>{item.label}</span>
                      {item.description && (
                        <span className="text-[11px] text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </div>
                    {item.badge && (
                      <Badge
                        variant={item.badgeVariant || 'neutral'}
                        size="xs"
                        className="ml-2"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </Button>
              ))}
            </nav>
          </div>

          <Separator />

          <div>
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Review & Analysis
            </h3>
            <nav className="space-y-1">
              {utilityNavItems.map((item) => (
                <Button
                  key={item.href}
                  asChild
                  variant={isActive(item.href) ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'w-full justify-start px-3',
                    isActive(item.href) && 'bg-secondary/80 font-medium'
                  )}
                >
                  <Link href={item.href}>
                    <Icon name={item.icon} className="mr-3" size={16} />
                    <div className="flex flex-1 flex-col items-start space-y-0.5 leading-snug">
                      <span>{item.label}</span>
                      {item.description && (
                        <span className="text-[11px] text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </div>
                  </Link>
                </Button>
              ))}
            </nav>
          </div>
        </div>

        <div className="border-t border-border/40 p-4">
          <div className="rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Icon name="Zap" className="text-primary" size={14} />
              <span>Mock tip</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              One serious full mock per week beats five half-hearted ones.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="flex w-full flex-col lg:hidden">
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                <Icon name="Timer" className="text-primary" size={16} />
              </div>
              <div>
                <h2 className="text-sm font-semibold leading-snug">Mock Tests</h2>
              </div>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/mock/full">
                <Icon name="Timer" className="mr-2" size={14} />
                Start Full Mock
              </Link>
            </Button>
          </div>
          <div className="flex overflow-x-auto border-t border-border/20 px-2 py-2">
            {[...mainNavItems, ...moduleNavItems].map((item) => (
              <Button
                key={item.href}
                asChild
                variant={isActive(item.href) ? 'secondary' : 'ghost'}
                size="sm"
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full',
                  isActive(item.href) && 'font-medium'
                )}
              >
                <Link href={item.href}>
                  <Icon name={item.icon} className="mr-2" size={14} />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </header>
      </div>

      {/* Main Content */}
      <main className="relative flex-1 overflow-auto">
        <div className="min-h-screen p-4 lg:p-6">{children}</div>

        {/* Background switcher */}
        <div className="pointer-events-auto fixed bottom-4 right-4 z-40 max-w-xs">
          <Card className="flex items-center gap-3 rounded-ds-2xl border border-border/70 bg-card/90 px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon name="Image" size={16} />
              </span>
              <div className="text-[11px] leading-tight">
                <p className="font-medium">Mock room theme</p>
                <p className="text-muted-foreground">Change background without leaving.</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ThemePill
                label="Solid"
                active={bgVariant === 'solid'}
                onClick={() => setBgVariant('solid')}
              />
              <ThemePill
                label="Gradient"
                active={bgVariant === 'gradient'}
                onClick={() => setBgVariant('gradient')}
              />
              <ThemePill
                label="Soft"
                active={bgVariant === 'muted'}
                onClick={() => setBgVariant('muted')}
              />
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

const ThemePill: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <Button
    type="button"
    size="xs"
    variant={active ? 'accent' : 'ghost'}
    className={cn(
      'rounded-ds-full px-2 text-[11px] leading-none',
      !active && 'text-muted-foreground hover:text-foreground'
    )}
    onClick={onClick}
  >
    {label}
  </Button>
);

export default MockLayout;
