import { ReactNode, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { Container } from '@/components/design-system/Container';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import type { Crumb } from '@/components/design-system/Breadcrumbs';

import { MockBreadcrumbs } from './Breadcrumbs';

type MockPortalLayoutProps = {
  children: ReactNode;
  pathname?: string;
  onExitAttempt?: () => void;
};

export const MockPortalLayout: React.FC<MockPortalLayoutProps> = ({
  children,
  pathname,
  onExitAttempt,
}) => {
  const router = useRouter();
  const normalizedPathname = useMemo(() => {
    const raw = pathname ?? router.asPath ?? router.pathname;
    return typeof raw === 'string' ? raw.split('?')[0] : '/mock';
  }, [pathname, router.asPath, router.pathname]);

  const isExam = normalizedPathname.includes('/exam/');

  const quickActions: Crumb[] = useMemo(
    () => [
      { label: 'Mock Home', href: '/mock' },
      { label: 'Dashboard', href: '/dashboard' },
    ],
    []
  );

  const handleExit = () => {
    if (onExitAttempt) {
      onExitAttempt();
      return;
    }
    void router.push('/mock');
  };

  return (
    <div className="min-h-screen bg-app-mock">
      <div className="flex min-h-screen flex-col">
        {!isExam && (
          <header className="border-b border-border bg-app-mock-light backdrop-blur">
            <Container className="flex flex-wrap items-center justify-between gap-4 py-4">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1 text-[11px] text-muted-foreground shadow-sm ring-1 ring-border/60">
                    <Icon name="gauge" size={14} />
                    Mock Tests
                  </span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Icon name="map-pin" size={14} />
                    Mission Control
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-3 text-lg font-semibold text-foreground sm:text-xl">
                    <span className="font-slab">Mock Layout Hub</span>
                    <span className="hidden h-6 w-px bg-border sm:inline" aria-hidden />
                    <span className="text-sm font-normal text-muted-foreground">
                      Aligned with IELTS Mission Control
                    </span>
                  </div>
                  <MockBreadcrumbs pathname={normalizedPathname} />
                </div>
              </div>

              <div className="flex flex-1 flex-wrap items-center justify-end gap-2 min-w-[220px]">
                <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs text-muted-foreground" aria-label="Quick links">
                  {quickActions.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href ?? '#'}
                      className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 font-medium text-muted-foreground shadow-sm ring-1 ring-border/60 transition hover:text-foreground hover:ring-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Icon name="chevron-right" size={14} />
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="soft"
                    tone="secondary"
                    size="sm"
                    className="shadow-sm"
                    leadingIcon={<Icon name="sun" size={16} />}
                    aria-label="Open mock theme switcher"
                  >
                    Theme
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="border border-border/80"
                    leadingIcon={<Icon name="arrow-left" size={16} />}
                    onClick={handleExit}
                  >
                    Exit mock
                  </Button>
                </div>
              </div>
            </Container>
          </header>
        )}

        <main className="flex-1">
          <Container className="py-6 sm:py-8 lg:py-12">
            <div className="overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-border/70">
              <div className="bg-primary/5 px-4 py-3 sm:px-6">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Icon name="shield" size={16} className="text-primary" />
                  <span>Unified mock experience • Navigation locked to IELTS modules</span>
                </div>
              </div>
              <div className="bg-app-mock px-4 py-6 sm:px-6 sm:py-8">{children}</div>
            </div>
          </Container>
        </main>

        {!isExam && (
          <footer className="mt-auto border-t border-border bg-app-mock-light">
            <Container className="flex flex-wrap items-center justify-between gap-2 py-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Icon name="book-open" size={16} />
                <span>Mock navigation aligned with Portal Hub modules.</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 ring-1 ring-border/70">
                  <Icon name="lock" size={14} />
                  Exit callbacks ready
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 ring-1 ring-border/70">
                  <Icon name="sparkles" size={14} />
                  Consistent paddings & backgrounds
                </span>
              </div>
            </Container>
          </footer>
        )}
      </div>
    </div>
  );
};

export default MockPortalLayout;
