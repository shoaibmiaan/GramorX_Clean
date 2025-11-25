'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useLocale } from '@/lib/locale';
import { useUserContext } from '@/context/UserContext';
import {
  isGuestOnlyRoute,
  isPublicRoute,
  canAccess,
  requiredRolesFor,
  getUserRole,
  type AppRole,
} from '@/lib/routeAccess';

function safeNext(next?: string | string[] | null) {
  const n = typeof next === 'string' ? next : Array.isArray(next) ? next[0] : '';
  if (!n) return '';
  if (n.startsWith('http')) return ''; // block open redirects
  if (n === '/login') return ''; // avoid loops
  return n;
}

export function useRouteGuard() {
  const router = useRouter();
  const { setLocale } = useLocale();
  const pathname = router.pathname;
  const path = router.asPath || pathname;
  const { user, role, loading } = useUserContext();

  const hasRedirected = useRef(false); // prevent double redirects in StrictMode/dev

  useEffect(() => {
    if (!router.isReady || loading) return;

    const authed = !!user;
    const normalizedRole: AppRole | null =
      role && role !== 'guest' ? (role as AppRole) : getUserRole(user);

    const publicR = isPublicRoute(path);
    const guestOnlyR = isGuestOnlyRoute(path);

    if (authed) {
      const preferredLanguage =
        (user?.user_metadata as Record<string, unknown> | undefined)?.preferred_language;
      if (typeof preferredLanguage === 'string' && preferredLanguage) {
        setLocale(preferredLanguage);
      }
    }

    // Prevent duplicate redirects
    if (hasRedirected.current) return;

    // Guest-only routes (e.g., /login, /signup): if authed, go away
    if (guestOnlyR) {
      if (authed) {
        hasRedirected.current = true;
        const target = safeNext(router.query.next) || '/welcome';
        if (target && router.asPath !== target) {
          void router.replace(target);
        }
      }
      return;
    }

    // Public routes (e.g., /, /pricing, /community)
    if (publicR) return;

    // Protected routes begin here
    if (!authed) {
      hasRedirected.current = true;

      // IMPORTANT: do NOT encode twice. URLSearchParams will handle encoding.
      const targetQuery = { next: router.asPath };
      const targetAsPath = `/login?${new URLSearchParams(targetQuery).toString()}`;

      if (router.asPath !== targetAsPath) {
        void router.replace({
          pathname: '/login',
          query: targetQuery,
        });
      }
      return;
    }

    // Role-guarded routes
    if (!canAccess(pathname, normalizedRole)) {
      const need = requiredRolesFor(pathname);
      hasRedirected.current = true;

      if (!normalizedRole) {
        const targetQuery = {
          next: router.asPath,
          need: Array.isArray(need) ? need.join(',') : need ?? '',
        };
        const targetAsPath = `/login?${new URLSearchParams(targetQuery).toString()}`;

        if (router.asPath !== targetAsPath) {
          void router.replace({
            pathname: '/login',
            query: targetQuery,
          });
        }
      } else if (router.asPath !== '/403') {
        void router.replace('/403');
      }
      return;
    }

  }, [
    loading,
    user,
    role,
    router.isReady,
    router.pathname,
    router.asPath,
    path,
    setLocale,
    pathname,
    router.query.next,
  ]);

  return { isChecking: false };
}

export default useRouteGuard;
