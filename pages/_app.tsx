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

// Animations (for Homepage sections using data-aos)
import 'aos/dist/aos.css';
import { AnimationProvider } from '@/components/providers/AnimationProvider';

import { ToastProvider } from '@/components/design-system/Toaster';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { supabaseBrowser } from '@/lib/supabaseBrowser';
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

// Route type guards
const isAuthPage = (pathname: string) =>
  /^\/(login|signup|register)(\/|$)/.test(pathname) ||
  /^\/auth\/(login|signup|register|mfa|verify)(\/|$)/.test(pathname) ||
  pathname === '/forgot-password';

const isPremiumRoomRoute = (pathname: string) =>
  pathname.startsWith('/premium/') && !pathname.startsWith('/premium-pin');

const isMockTestsFlowRoute = (pathname: string) => {
  const isMockTestsRoute = pathname.startsWith('/mock');
  const isMockTestsLanding = pathname === '/mock';
  const isWritingMockRoute = pathname.startsWith('/writing/mock');
  return (isMockTestsRoute && !isMockTestsLanding) || isWritingMockRoute;
};

// Enhanced route loading hook
function useRouteLoading() {
  const router = useRouter();
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const routeLoadingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeLoadingFallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingPathRef = useRef<string | null>(null);

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
        setIsRouteLoading(true);
        routeLoadingFallbackRef.current = setTimeout(() => {
          pendingPathRef.current = null;
          setIsRouteLoading(false);
        }, 12000);
      }, 160);
    };

    const stopLoading = (url?: string) => {
      if (url && pendingPathRef.current) {
        const completedPath = toComparablePath(url);
        if (completedPath !== pendingPathRef.current) {
          pendingPathRef.current = null;
        }
      } else {
        pendingPathRef.current = null;
      }
      clearTimers();
      setIsRouteLoading(false);
    };

    const handleRouteError = () => stopLoading();

    router.events.on('routeChangeStart', startLoading as any);
    router.events.on('beforeHistoryChange', (url, opts) => {
      if (!opts?.shallow && hasMeaningfulPathChange(url as string)) {
        pendingPathRef.current = toComparablePath(url as string);
      } else {
        stopLoading();
      }
    });
    router.events.on('routeChangeComplete', stopLoading as any);
    router.events.on('routeChangeError', handleRouteError);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stopLoading();
    };
    const handlePageHide = () => stopLoading();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      router.events.off('routeChangeStart', startLoading as any);
      router.events.off('beforeHistoryChange', stopLoading as any);
      router.events.off('routeChangeComplete', stopLoading as any);
      router.events.off('routeChangeError', handleRouteError);
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

// Enhanced auth bridge hook
function useAuthBridge() {
  const router = useRouter();
  const syncingRef = useRef(false);
  const lastBridgeKeyRef = useRef<string | null>(null);
  const subscribedRef = useRef(false);

  const bridgeSession = useCallback(async (event: AuthChangeEvent, sessionNow: Session | null) => {
    const shouldPost = event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED';
    if (!shouldPost) return;

    if (event !== 'SIGNED_OUT' && !sessionNow?.access_token) return;

    const token = sessionNow?.access_token ?? '';
    const dedupeKey = `${event}:${token}`;
    if (event !== 'SIGNED_OUT' && lastBridgeKeyRef.current === dedupeKey) return;

    if (syncingRef.current) return;
    syncingRef.current = true;

    const previousKey = lastBridgeKeyRef.current;
    try {
      await fetch('/api/auth/set-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ event, session: sessionNow }),
      });
      lastBridgeKeyRef.current = dedupeKey;
    } catch {
      lastBridgeKeyRef.current = previousKey;
    } finally {
      syncingRef.current = false;
    }

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') {
      void refreshClientFlags();
    }
  }, []);

  useEffect(() => {
    if (IS_CI) return;

    if (typeof window !== 'undefined') {
      if ((window as any).__GX_AUTH_BRIDGE_ACTIVE) return;
      (window as any).__GX_AUTH_BRIDGE_ACTIVE = true;
    }

    let isMounted = true;

    (async () => {
      const { data: { session } } = await supabaseBrowser.auth.getSession();
      if (!isMounted) return;

      if (session) {
        await bridgeSession('SIGNED_IN', session);
      } else {
        await bridgeSession('SIGNED_OUT', null);
      }

      if (!flagsHydratedRef.current) {
        void refreshClientFlags();
      }

      if (session?.user && isAuthPage(router.pathname)) {
        const url = new URL(window.location.href);
        const next = url.searchParams.get('next');
        const target = next && next.startsWith('/') ? next : destinationByRole(session.user) ?? '/';
        router.replace(target);
      }
    })();

    if (!subscribedRef.current) {
      const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((event, sessionNow) => {
        (async () => {
          await bridgeSession(event, sessionNow);

          if (event === 'SIGNED_IN' && sessionNow?.user) {
            const url = new URL(window.location.href);
            const next = url.searchParams.get('next');
            if (next && next.startsWith('/')) router.replace(next);
            else if (isAuthPage(router.pathname)) router.replace(destinationByRole(sessionNow.user));
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
        isMounted = false;
        subscription?.unsubscribe();
        subscribedRef.current = false;
        if (typeof window !== 'undefined') {
          (window as any).__GX_AUTH_BRIDGE_ACTIVE = false;
        }
      };
    }
  }, [router, bridgeSession]);
}

// Enhanced route configuration using comprehensive route map
function useRouteConfiguration(pathname: string) {
  const { user } = useUserContext();

  return useMemo(() => {
    const routeConfig = getRouteConfig(pathname);

    // Define routes that should NOT show chrome (header/footer)
    const isNoChromeRoute =
      routeConfig.layout === 'exam' ||
      routeConfig.layout === 'proctoring' ||
      routeConfig.layout === 'auth' ||
      pathname.startsWith('/premium') ||
      isMockTestsFlowRoute(pathname) ||
      /\/focus-mode(\/|$)/.test(pathname) ||
      routeConfig.showChrome === false;

    const showLayout = !pathname.startsWith('/premium') && !isNoChromeRoute;

    // Map to AppLayoutManager props
    return {
      isAuthPage: routeConfig.layout === 'auth',
      isProctoringRoute: routeConfig.layout === 'proctoring',
      showLayout: !isAttemptPath(pathname) && showLayout,
      forceLayoutOnAuthPage: routeConfig.layout === 'auth' && !!user,
      isAdminRoute: routeConfig.layout === 'admin',
      isInstitutionsRoute: routeConfig.layout === 'institutions',
      isDashboardRoute:
        routeConfig.layout === 'dashboard' ||
        routeConfig.layout === 'profile' ||
        routeConfig.layout === 'billing' ||
        routeConfig.layout === 'analytics',
      isMarketplaceRoute: routeConfig.layout === 'marketplace',
      isLearningRoute:
        routeConfig.layout === 'learning' ||
        routeConfig.layout === 'resources',
      isCommunityRoute:
        routeConfig.layout === 'community' ||
        routeConfig.layout === 'communication',
      isReportsRoute: routeConfig.layout === 'reports',
      isMarketingRoute: routeConfig.layout === 'marketing' || routeConfig.layout === 'support',
      needPremium: pathname.startsWith('/premium'),
      isPremiumRoute: isPremiumRoomRoute(pathname),
      routeConfig, // Pass full config for additional checks
    };
  }, [pathname, user]);
}

// Route access check hook
function useRouteAccessCheck(pathname: string, role?: string | null) {
  const router = useRouter();

  useEffect(() => {
    const config = getRouteConfig(pathname);

    // Skip access checks for public routes
    if (!config.requiresAuth) return;

    if (config.requiresAuth && !role) {
      router.replace('/login');
      return;
    }

    if (config.allowedRoles && role && !config.allowedRoles.includes(role)) {
      router.replace('/restricted');
      return;
    }
  }, [pathname, role, router]);
}

function InnerApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const pathname = router.pathname;
  const { locale: activeLocale } = useLocale();

  // Enhanced hooks
  const isRouteLoading = useRouteLoading();
  useAuthBridge();

  // ---------- i18n ----------
  useEffect(() => {
    void loadTranslations(activeLocale as SupportedLocale);
  }, [activeLocale]);

  // ---------- Route analytics ----------
  useEffect(() => {
    const logRoute = (url: string) => {
      if (!url) return;
      // Add analytics logging here if needed
    };
    logRoute(router.asPath);
    const handleRouteChange = (url: string) => logRoute(url);
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => router.events.off('routeChangeComplete', handleRouteChange);
  }, [router]);

  // ---------- User / Tier ----------
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
    return () => window.removeEventListener('subscription:tier-updated', handleTierUpdated as EventListener);
  }, []);

  // ---------- Enhanced Route Configuration ----------
  const routeConfiguration = useRouteConfiguration(pathname);
  const forceLayoutOnAuthPage = routeConfiguration.isAuthPage && !!user;

  // Apply route access checks
  useRouteAccessCheck(pathname, role);

  // ---------- Teacher hard-redirect ----------
  useEffect(() => {
    if (!role) return;
    if (role === 'teacher') {
      const onTeacherArea = pathname.startsWith('/teacher') || routeConfiguration.isAuthPage;
      if (!onTeacherArea) {
        router.replace('/teacher');
      }
    }
  }, [role, pathname, routeConfiguration.isAuthPage, router]);

  // ---------- Idle timeout ----------
  const idleMinutes = useMemo(() => {
    try {
      const minutes = env?.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES ??
        process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES ??
        '30';
      return Number(minutes) || 30;
    } catch (error) {
      console.warn('Failed to parse idle timeout minutes, using default 30:', error);
      return 30;
    }
  }, []);

  useEffect(() => {
    if (IS_CI) return;

    if (typeof initIdleTimeout !== 'function') {
      console.warn('initIdleTimeout is not available');
      return;
    }

    try {
      const cleanup = initIdleTimeout(idleMinutes);
      return cleanup;
    } catch (error) {
      console.error('Failed to initialize idle timeout:', error);
    }
  }, [idleMinutes]);

  const { isChecking } = useRouteGuard();
  if (isChecking) return <GuardSkeleton />;

  // Premium wrapper only for premium room routes
  const basePage = routeConfiguration.needPremium || routeConfiguration.isPremiumRoute ? (
    <PremiumThemeProvider>
      <Component {...pageProps} />
    </PremiumThemeProvider>
  ) : (
    <Component {...pageProps} />
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <HighContrastProvider>
        {/* Removed manual <Head><link rel="stylesheet" /></Head> to satisfy @next/next/no-css-tags */}

        <div className={`${poppins.className} ${slab.className} min-h-screen min-h-[100dvh] bg-background text-foreground antialiased`}>
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
              subscriptionTier={subscriptionTier}
              isRouteLoading={isRouteLoading}
              role={role}
              isTeacherApproved={isTeacherApproved}
              guardFallback={() => <GuardSkeleton />}
            >
              {basePage}
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
        <NotificationProvider>
          <UserProvider>
            <OrgProvider>
              <InstalledAppProvider>
                <InnerApp {...props} />
              </InstalledAppProvider>
            </OrgProvider>
          </UserProvider>
        </NotificationProvider>
      </ToastProvider>
    </LocaleProvider>
  );
}
