import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { Container } from '@/components/design-system/Container';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import type { Crumb } from '@/components/design-system/Breadcrumbs';

import { MockBreadcrumbs } from './Breadcrumbs';
import { ExamLeaveConfirm } from './ExamLeaveConfirm';
import { isExamRoute } from './mockRoutes';

/**
 * Mock portal theme system
 * - MockTheme defines the allowed backgrounds for the entire mock surface.
 * - Theme-specific CSS tokens live in styles/semantic.css under the mock section.
 * - To add a new theme: extend the MockTheme union, add a class to themeClassMap, and
 *   define the matching .bg-mock-* class using existing DS color variables.
 */
type MockTheme = 'default' | 'gradient' | 'solid' | 'dark' | 'focus' | 'paper';

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
  const [theme, setTheme] = useState<MockTheme>('default');
  const router = useRouter();
  const themeClassMap: Record<MockTheme, string> = {
    default: 'bg-mock-default',
    gradient: 'bg-mock-gradient',
    solid: 'bg-mock-solid',
    dark: 'bg-mock-dark',
    focus: 'bg-mock-focus',
    paper: 'bg-mock-paper',
  };

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('mock_theme');
      if (
        stored === 'default' ||
        stored === 'gradient' ||
        stored === 'solid' ||
        stored === 'dark' ||
        stored === 'focus' ||
        stored === 'paper'
      ) {
        setTheme(stored);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem('mock_theme', theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const normalizedPathname = useMemo(() => {
    const raw = pathname ?? router.asPath ?? router.pathname;
    return typeof raw === 'string' ? raw.split('?')[0] : '/mock';
  }, [pathname, router.asPath, router.pathname]);

  const isExam = isExamRoute(normalizedPathname);
  const isActiveExam = isExam && !normalizedPathname.includes('/result') && !normalizedPathname.includes('/review');
  const appliedTheme = isExam && theme === 'gradient' ? 'focus' : theme;
  const appliedThemeClass = themeClassMap[appliedTheme];

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const leaveTargetRef = useRef<string | null>(null);

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

  useEffect(() => {
    const handleRouteChangeStart = (url: string) => {
      if (!isActiveExam) return;
      if (!router.asPath || url === router.asPath) return;

      if (showLeaveConfirm) {
        leaveTargetRef.current = url;
        router.events.emit('routeChangeError');
        // eslint-disable-next-line @typescript-eslint/no-throw-literal
        throw 'Abort route change. Confirmation pending.';
      }

      leaveTargetRef.current = url;
      setShowLeaveConfirm(true);

      router.events.emit('routeChangeError');
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw 'Abort route change. Confirmation pending.';
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
    };
  }, [isActiveExam, router, showLeaveConfirm]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isActiveExam) return;
      event.preventDefault();
      event.returnValue = '';
      return '';
    };

    if (isActiveExam) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }

    return undefined;
  }, [isActiveExam]);

  return (
    <div className={`min-h-screen ${appliedThemeClass}`}>
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

              <div className="flex min-w-[220px] flex-1 flex-wrap items-center justify-end gap-2">
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
                  {!isExam && (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground" htmlFor="mock-theme-picker">
                      <span className="hidden sm:inline">Background</span>
                      <select
                        id="mock-theme-picker"
                        aria-label="Mock background theme"
                        value={theme}
                        onChange={(event) => setTheme(event.target.value as MockTheme)}
                        className="h-8 rounded-ds-xl border border-border bg-input px-2 text-xs text-foreground shadow-sm transition focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="default">Default</option>
                        <option value="gradient">Gradient</option>
                        <option value="solid">Solid</option>
                        <option value="dark">Dark</option>
                        <option value="focus">Focus mode</option>
                        <option value="paper">Paper</option>
                      </select>
                    </label>
                  )}
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
                <div className={`${appliedThemeClass} px-4 py-6 sm:px-6 sm:py-8`}>{children}</div>
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

      {showLeaveConfirm && (
        <ExamLeaveConfirm
          onStay={() => {
            leaveTargetRef.current = null;
            setShowLeaveConfirm(false);
          }}
          onLeave={() => {
            const target = leaveTargetRef.current;
            leaveTargetRef.current = null;
            setShowLeaveConfirm(false);
            if (target) {
              void router.push(target);
            }
          }}
        />
      )}
    </div>
  );
};

export default MockPortalLayout;
