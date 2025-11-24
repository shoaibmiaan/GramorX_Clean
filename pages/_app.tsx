// pages/_app.tsx
import type { AppProps } from 'next/app';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { ThemeProvider } from 'next-themes';
import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import { Poppins, Roboto_Slab } from 'next/font/google';

import '@/styles/tokens.css';
import '@/styles/semantic.css';
import '@/styles/globals.css';
import '@/styles/themes/index.css';
import '@/styles/premium.css';

import 'aos/dist/aos.css';
import { AnimationProvider } from '@/components/providers/AnimationProvider';

import { ToastProvider } from '@/components/design-system/Toaster';
import { supabaseBrowser as supabaseClientSource } from '@/lib/supabaseBrowser';
import { env } from '@/lib/env';
import { LocaleProvider, useLocale } from '@/lib/locale';
import { initIdleTimeout } from '@/utils/idleTimeout';
import useRouteGuard from '@/hooks/useRouteGuard';
import { destinationByRole } from '@/lib/routeAccess';
import { refreshClientFlags, flagsHydratedRef } from '@/lib/flags/refresh';
import { InstalledAppProvider } from '@/hooks/useInstalledApp';

import { PremiumThemeProvider } from '@/premium-ui/theme/PremiumThemeProvider';
import AppLayoutManager from '@/components/layouts/AppLayoutManager';

import { UserProvider, useUserContext } from '@/context/UserContext';
import { OrgProvider } from '@/lib/orgs/context';
import { HighContrastProvider } from '@/context/HighContrastContext';

import { loadTranslations } from '@/lib/i18n';
import type { SupportedLocale } from '@/lib/i18n/config';
import type { SubscriptionTier } from '@/lib/navigation/types';
import { getRouteConfig, isAttemptPath } from '@/lib/routes/routeLayoutMap';

import { Container } from '@/components/design-system/Container';

// ---- Safe Supabase getter (works for both factory or instance exports)
function getSupa() {
  const v: any = supabaseClientSource as any;
  return typeof v === 'function' ? v() : v;
}

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
});
const slab = Roboto_Slab({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-display',
});

const IS_CI = process.env.NEXT_PUBLIC_CI === 'true';

function GuardSkeleton() {
  return (
    <div className="grid min-h-[100dvh] place-items-center">
      <div className="h-6 w-40 animate-pulse rounded bg-border" />
    </div>
  );
}

// ---------- Route type helpers ----------
const isAuthPage = (pathname: string) =>
  /^\/(login|signup|register)(\/|$)/.test(pathname) ||
  /^\/auth\/(login|signup|register|mfa|verify)(\/|$)/.test(pathname) ||
  pathname === '/forgot-password';

const isPremiumRoomRoute = (pathname: string) =>
  pathname.startsWith('/premium/') && !pathname.startsWith('/premium-pin');

// Attempts only (used by older code that referenced “flow”)
const isMockTestsFlowRoute = (pathname: string) => {
  const isMockAttempt = /^\/mock\/[^/]+$/.test(pathname);
  const isWritingMockAttempt = /^\/writing\/mock\/[^/]+$/.test(pathname);
  return isMockAttempt || isWritingMockAttempt;
};

// ---------- Enhanced route loading ----------
const ROUTE_LOADING_DELAY_MS = 260;
const ROUTE_LOADING_MIN_VISIBLE_MS = 400;
const ROUTE_LOADING_FALLBACK_MS = 12000;

function useRouteLoading() {
  const router = useRouter();
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const routeLoadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeLoadingFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeLoadingHideDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPathRef = useRef<string | null>(null);
  const visibleSinceRef = useRef<number | null>(null);

  useEffect(() => {
    const toComparablePath = (value: string) => {
      if (!value) return '/';
      const withoutOrigin = value.replace(/^https?:\/\/[^/]+/, '');
      const withoutHash = withoutOrigin.split('#')[0] ?? '';
      const withoutQuery = withoutHash.split('?')[0] ?? '';
      return (withoutQuery || '/').replace(/\/+$/, '') || '/';
    };

    const hasMeaningfulPathChange = (nextUrl: string) => {
      const nextPath = toComparablePath(nextUrl);
      const currentPath = toComparablePath(router.asPath);
      return nextPath !== currentPath;
    };

    const clearTimers = () => {
      if (routeLoadingTimeoutRef.current) {
        clearTimeout(routeLoadingTimeoutRef.current);
        routeLoadingTimeoutRef.current = null;
      }
      if (routeLoadingFallbackRef.current) {
        clearTimeout(routeLoadingFallbackRef.current);
        routeLoadingFallbackRef.current = null;
      }
      if (routeLoadingHideDelayRef.current) {
        clearTimeout(routeLoadingHideDelayRef.current);
        routeLoadingHideDelayRef.current = null;
      }
    };

    const startLoading = (url: string, options: { shallow?: boolean } = {}) => {
      if (options.shallow) return;
      if (!hasMeaningfulPathChange(url)) {
        pendingPathRef.current = null;
        clearTimers();
        return;
      }
      pendingPathRef.current = toComparablePath(url);
      clearTimers();
      routeLoadingTimeoutRef.current = setTimeout(() => {
        visibleSinceRef.current = Date.now();
        setIsRouteLoading(true);
        routeLoadingFallbackRef.current = setTimeout(() => {
          pendingPathRef.current = null;
          visibleSinceRef.current = null;
          setIsRouteLoading(false);
        }, ROUTE_LOADING_FALLBACK_MS);
      }, ROUTE_LOADING_DELAY_MS);
    };

    const stopLoading = (url?: string | null) => {
      const finalize = () => {
        pendingPathRef.current = null;
        clearTimers();
        visibleSinceRef.current = null;
        setIsRouteLoading(false);
      };

      if (pendingPathRef.current && url) {
        const normalizedUrl = toComparablePath(url);
        if (normalizedUrl !== pendingPathRef.current) {
          return;
        }
      }

      const ensureMinimumVisibility = () => {
        if (visibleSinceRef.current == null) {
          finalize();
          return;
        }

        const elapsed = Date.now() - visibleSinceRef.current;
        if (elapsed >= ROUTE_LOADING_MIN_VISIBLE_MS) {
          finalize();
          return;
        }

        const remaining = ROUTE_LOADING_MIN_VISIBLE_MS - elapsed;
        routeLoadingHideDelayRef.current = setTimeout(() => {
          visibleSinceRef.current = null;
          finalize();
        }, remaining);
      };

      if (typeof window !== 'undefined') {
        requestAnimationFrame(() =>
          requestAnimationFrame(ensureMinimumVisibility)
        );
        return;
      }

      ensureMinimumVisibility();
    };

    const handleRouteError = (_err: unknown, url: string) => stopLoading(url);

    const handleBeforeHistoryChange = (
      url: string | { pathname?: string | null } = '',
      opts: { shallow?: boolean } = {}
    ) => {
      const rawUrl = typeof url === 'string' ? url : url?.pathname ?? '';

      if (opts.shallow) {
        if (!pendingPathRef.current) {
          stopLoading();
        }
        return;
      }

      if (!hasMeaningfulPathChange(rawUrl)) {
        pendingPathRef.current = null;
        stopLoading();
        return;
      }

      pendingPathRef.current = toComparablePath(rawUrl);
    };

    router.events.on('routeChangeStart', startLoading as any);
    router.events.on('beforeHistoryChange', handleBeforeHistoryChange as any);
    router.events.on('routeChangeComplete', stopLoading as any);
    router.events.on('routeChangeError', handleRouteError as any);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stopLoading();
    };
    const handlePageHide = () => stopLoading();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      router.events.off('routeChangeStart', startLoading as any);
      router.events.off('beforeHistoryChange', handleBeforeHistoryChange as any);
      router.events.off('routeChangeComplete', stopLoading as any);
      router.events.off('routeChangeError', handleRouteError as any);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      clearTimers();
    };
  }, [router]);

  useEffect(() => {
    if (routeLoadingFallbackRef.current) {
      clearTimeout(routeLoadingFallbackRef.current);
      routeLoadingFallbackRef.current = null;
    }
    pendingPathRef.current = null;
    setIsRouteLoading(false);
  }, [router.asPath]);

  return isRouteLoading;
}

// ---------- Auth bridge ----------
function useAuthBridge() {
  const router = useRouter();
  const syncingRef = useRef(false);
  const lastBridgeKeyRef = useRef<string | null>(null);
  const subscribedRef = useRef(false);

  const bridgeSession = useCallback(
    async (event: AuthChangeEvent, sessionNow: Session | null) => {
      const shouldPost =
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'TOKEN_REFRESHED';
      if (!shouldPost) return;

      if (event !== 'SIGNED_OUT' && !sessionNow?.access_token) return;

      const token = sessionNow?.access_token ?? '';
      const dedupeKey = `${event}:${token}`;

      if (event !== 'SIGNED_OUT' && lastBridgeKeyRef.current === dedupeKey) return;
      lastBridgeKeyRef.current = event === 'SIGNED_OUT' ? null : dedupeKey;

      try {
        await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ event, session: sessionNow }),
        });
      } catch (err) {
        console.error('Failed to bridge auth session:', err);
      }
    },
    []
  );

  useEffect(() => {
    if (IS_CI) return;

    if (typeof window !== 'undefined') {
      if ((window as any).__GX_AUTH_BRIDGE_ACTIVE) return;
      (window as any).__GX_AUTH_BRIDGE_ACTIVE = true;
    }

    let cancelled = false;

    (async () => {
      const supa = getSupa();

      syncingRef.current = true;
      const {
        data: { session },
      } = await supa.auth.getSession();

      if (!cancelled) {
        if (session) {
          await bridgeSession('SIGNED_IN', session);
        } else {
          await bridgeSession('SIGNED_OUT', null);
        }

        if (!flagsHydratedRef.current) {
          void refreshClientFlags();
        }

        if (session?.user && isAuthPage(router.pathname)) {
          const pathname = router.pathname;
          const isSpecialAuthHandler =
            pathname === '/auth/callback' ||
            pathname === '/auth/confirm' ||
            pathname === '/auth/verify';

          if (!isSpecialAuthHandler) {
            const url = new URL(window.location.href);
            const next = url.searchParams.get('next');
            const target =
              next && next.startsWith('/')
                ? next
                : destinationByRole(session.user) ?? '/';

            router.replace(target);
          }
        }
      }

      syncingRef.current = false;
    })();

    if (!subscribedRef.current) {
      const supa = getSupa();

      const {
        data: { subscription },
      } = supa.auth.onAuthStateChange((event, sessionNow) => {
        (async () => {
          if (cancelled) return;

          await bridgeSession(event, sessionNow);

          if (event === 'SIGNED_IN' && sessionNow?.user) {
            const pathname = router.pathname;
            const isSpecialAuthHandler =
              pathname === '/auth/callback' ||
              pathname === '/auth/confirm' ||
              pathname === '/auth/verify';

            if (!isSpecialAuthHandler) {
              const url = new URL(window.location.href);
              const next = url.searchParams.get('next');

              if (next && next.startsWith('/')) {
                router.replace(next);
              } else if (isAuthPage(pathname)) {
                router.replace(destinationByRole(sessionNow.user));
              }
            }
          }

          if (event === 'SIGNED_OUT') {
            if (!['/login', '/signup', '/forgot-password'].includes(router.pathname)) {
              router.replace('/login');
            }
          }
        })();
      });

      subscribedRef.current = true;

      return () => {
        cancelled = true;
        (subscription as any)?.unsubscribe?.();
        subscribedRef.current = false;
        if (typeof window !== 'undefined') {
          (window as any).__GX_AUTH_BRIDGE_ACTIVE = false;
        }
      };
    }
  }, [router, bridgeSession]);
}

// ---------- Route configuration ----------
function useRouteConfiguration(pathname: string) {
  const { user } = useUserContext();

  return useMemo(() => {
    const routeConfig = getRouteConfig(pathname);
    const derivedIsAuth = routeConfig.layout === 'auth' || isAuthPage(pathname);

    const isAttempt = isAttemptPath(pathname);

    const isNoChromeRoute =
      derivedIsAuth ||
      routeConfig.layout === 'proctoring' ||
      pathname.startsWith('/premium') ||
      /\/focus-mode(\/|$)/.test(pathname) ||
      routeConfig.showChrome === false ||
      isAttempt ||
      isMockTestsFlowRoute(pathname);

    const showLayout = !pathname.startsWith('/premium') && !isNoChromeRoute;

    return {
      isAuthPage: derivedIsAuth,
      isProctoringRoute: routeConfig.layout === 'proctoring',
      showLayout,
      forceLayoutOnAuthPage: derivedIsAuth && !!user,
      isAdminRoute: routeConfig.layout === 'admin',
      isInstitutionsRoute: routeConfig.layout === 'institutions',
      isDashboardRoute:
        routeConfig.layout === 'dashboard' ||
        routeConfig.layout === 'profile' ||
        routeConfig.layout === 'billing' ||
        routeConfig.layout === 'analytics',
      isMarketplaceRoute: routeConfig.layout === 'marketplace',
      isLearningRoute:
        routeConfig.layout === 'learning' || routeConfig.layout === 'resources',
      isCommunityRoute:
        routeConfig.layout === 'community' || routeConfig.layout === 'communication',
      isReportsRoute: routeConfig.layout === 'reports',
      isMarketingRoute:
        routeConfig.layout === 'marketing' || routeConfig.layout === 'support',
      needPremium: pathname.startsWith('/premium'),
      isPremiumRoute: isPremiumRoomRoute(pathname),
      routeConfig,
    };
  }, [pathname, user]);
}

// ---------- Access checks ----------
function useRouteAccessCheck(pathname: string, role?: string | null) {
  const router = useRouter();

  useEffect(() => {
    const config = getRouteConfig(pathname);
    if (!config.requiresAuth) return;

    if (role === undefined) return;

    if (!role) {
      router.replace('/login');
      return;
    }

    if (config.allowedRoles && role && !config.allowedRoles.includes(role)) {
      router.replace('/restricted');
    }
  }, [pathname, role, router]);
}

function InnerApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const pathname = router.pathname;
  const { locale: activeLocale } = useLocale();

  const isRouteLoading = useRouteLoading();
  useAuthBridge();

  useEffect(() => {
    void loadTranslations(activeLocale as SupportedLocale);
  }, [activeLocale]);

  useEffect(() => {
    const logRoute = (url: string) => {
      if (!url) return;
    };
    logRoute(router.asPath);
    const handleRouteChange = (url: string) => logRoute(url);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router]);

  const { user, role, isTeacherApproved } = useUserContext() as {
    user: SupabaseUser | null;
    role?: string | null;
    isTeacherApproved?: boolean | null;
  };
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');

  useEffect(() => {
    const metadata = (user?.user_metadata ?? {}) as { tier?: SubscriptionTier | null };
    const appMeta = (user?.app_metadata ?? {}) as { tier?: SubscriptionTier | null };
    const nextTier = metadata.tier ?? appMeta.tier ?? 'free';
    setSubscriptionTier(nextTier);
  }, [user]);

  useEffect(() => {
    const handleTierUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ tier?: SubscriptionTier }>).detail;
      if (detail?.tier) setSubscriptionTier(detail.tier);
    };
    window.addEventListener('subscription:tier-updated', handleTierUpdated as EventListener);
    return () =>
      window.removeEventListener('subscription:tier-updated', handleTierUpdated as EventListener);
  }, []);

  const routeConfiguration = useRouteConfiguration(pathname);
  const forceLayoutOnAuthPage = routeConfiguration.isAuthPage && !!user;

  useRouteAccessCheck(pathname, role);

  useEffect(() => {
    if (!role) return;
    if (role === 'teacher') {
      const onTeacherArea =
        pathname.startsWith('/teacher') || routeConfiguration.isAuthPage;
      if (!onTeacherArea) router.replace('/teacher');
    }
  }, [role, pathname, routeConfiguration.isAuthPage, router]);

  const idleMinutes = useMemo(() => {
    try {
      const minutes =
        env?.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES ??
        process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES ??
        '30';
      return Number(minutes) || 30;
    } catch {
      return 30;
    }
  }, []);

  useEffect(() => {
    if (IS_CI) return;
    if (typeof initIdleTimeout !== 'function') return;
    try {
      const cleanup = initIdleTimeout(idleMinutes);
      return cleanup;
    } catch {
      // noop
    }
  }, [idleMinutes]);

  const { isChecking } = useRouteGuard();
  if (isChecking) return <GuardSkeleton />;

  const basePage =
    routeConfiguration.needPremium || routeConfiguration.isPremiumRoute ? (
      <PremiumThemeProvider>
        <Component {...pageProps} key={router.asPath} />
      </PremiumThemeProvider>
    ) : (
      <Component {...pageProps} key={router.asPath} />
    );

  const shouldShowGlobalHeader =
    routeConfiguration.isMarketingRoute ||
    pathname === '/' ||
    pathname === '/pricing' ||
    pathname.startsWith('/pricing/');

  const pageHideFooter =
    (Component as unknown as { hideFooter?: boolean }).hideFooter === true;

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <HighContrastProvider>
        <div
          className={`${poppins.className} ${slab.className} min-h-screen min-h-[100dvh] bg-background text-foreground antialiased`}
        >
          <AnimationProvider>
            <AppLayoutManager
              isAuthPage={routeConfiguration.isAuthPage}
              isProctoringRoute={routeConfiguration.isProctoringRoute}
              showLayout={routeConfiguration.showLayout}
              forceLayoutOnAuthPage={forceLayoutOnAuthPage}
              isAdminRoute={routeConfiguration.isAdminRoute}
              isInstitutionsRoute={routeConfiguration.isInstitutionsRoute}
              isDashboardRoute={routeConfiguration.isDashboardRoute}
              isMarketplaceRoute={routeConfiguration.isMarketplaceRoute}
              isLearningRoute={routeConfiguration.isLearningRoute}
              isCommunityRoute={routeConfiguration.isCommunityRoute}
              isReportsRoute={routeConfiguration.isReportsRoute}
              isMarketingRoute={routeConfiguration.isMarketingRoute}
              isPremiumRoute={routeConfiguration.isPremiumRoute}
              subscriptionTier={subscriptionTier}
              isRouteLoading={isRouteLoading}
              role={role}
              isTeacherApproved={isTeacherApproved}
              guardFallback={() => <GuardSkeleton />}
              hideFooter={pageHideFooter}
            >
              {shouldShowGlobalHeader ? (
                <>
                  <header className="border-b border-subtle bg-background/80 backdrop-blur">
                    <Container className="flex h-14 items-center justify-between">
                      <div className="text-sm font-semibold">GramorX</div>
                    </Container>
                  </header>
                  {basePage}
                </>
              ) : (
                <>{basePage}</>
              )}
            </AppLayoutManager>
          </AnimationProvider>
        </div>
      </HighContrastProvider>
    </ThemeProvider>
  );
}

export default function App(props: AppProps) {
  return (
    <LocaleProvider initialLocale="en">
      <ToastProvider>
        <UserProvider>
          <OrgProvider>
            <InstalledAppProvider>
              <InnerApp {...props} />
            </InstalledAppProvider>
          </OrgProvider>
        </UserProvider>
      </ToastProvider>
    </LocaleProvider>
  );
}
