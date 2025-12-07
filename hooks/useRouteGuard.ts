'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient'; // Replaced supabaseBrowser
import { useLocale } from '@/lib/locale';
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

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

function getUserFromSession(
  session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']
) {
  const user = session?.user ?? null;
  const role: AppRole | null = getUserRole(user);
  return { user, role };
}

export function useRouteGuard() {
  const router = useRouter();
  const { setLocale } = useLocale();
  const pathname = router.pathname;
  const path = router.asPath || pathname;

  const [authStatus, setAuthStatus] = useState<AuthStatus>('checking');
  const [sessionUser, setSessionUser] = useState<ReturnType<typeof getUserFromSession>>({
    user: null,
    role: null,
  });
  const hasRedirected = useRef(false); // prevent double redirects in StrictMode/dev

  useEffect(() => {
    if (!router.isReady) return;
    let mounted = true;
    let resolved = false;

    const timeoutId = setTimeout(() => {
      if (!resolved && mounted) {
        resolved = true;
        setAuthStatus('unauthenticated');
        setSessionUser({ user: null, role: null });
      }
    }, 12000);

    (async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (!mounted) return;

        resolved = true;

        if (error) {
          setAuthStatus('unauthenticated');
          setSessionUser({ user: null, role: null });
          return;
        }

        const details = getUserFromSession(session);
        setSessionUser(details);
        setAuthStatus(session ? 'authenticated' : 'unauthenticated');
      } catch (error) {
        if (mounted) {
          resolved = true;
          setAuthStatus('unauthenticated');
          setSessionUser({ user: null, role: null });
        }
      }
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      if (!mounted) return;
      resolved = true;
      const details = getUserFromSession(session);
      setSessionUser(details);
      setAuthStatus(session ? 'authenticated' : 'unauthenticated');
    });

    return () => {
      mounted = false;
      resolved = true;
      clearTimeout(timeoutId);
      subscription?.unsubscribe?.();
    };
  }, [router.isReady]);

  useEffect(() => {
    if (!router.isReady) return;
    if (authStatus === 'checking') return;

    let mounted = true;
    const authed = authStatus === 'authenticated' && !!sessionUser.user;
    const user = sessionUser.user;
    const role = sessionUser.role;

    const publicR = isPublicRoute(path);
    const guestOnlyR = isGuestOnlyRoute(path);

    const hydrateLocale = async () => {
      if (authed && user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!mounted) return;
        const lang = profile?.preferred_language || 'en';
        setLocale(lang);
      }
    };

    void hydrateLocale();

    if (hasRedirected.current) return;

    (async () => {
      // Guest-only routes (e.g., /login, /signup): if authed, go away
      if (guestOnlyR) {
        if (authed) {
          hasRedirected.current = true;

          const target = safeNext(router.query.next) || '/welcome';
          if (target && router.asPath !== target) {
            try {
              await router.replace(target);
            } catch (err: any) {
              if (
                typeof err?.message === 'string' &&
                err.message.includes('attempted to hard navigate to the same URL')
              ) {
                // dev-only invariant – ignore
              } else {
                throw err;
              }
            }
          }
        }
        return;
      }

      // Public routes (e.g., /, /pricing, /community)
      if (publicR) {
        return;
      }

      // Protected routes begin here
      if (!authed) {
        hasRedirected.current = true;

        const targetQuery = { next: router.asPath };
        const targetAsPath = `/login?${new URLSearchParams(targetQuery).toString()}`;

        if (router.asPath !== targetAsPath) {
          try {
            await router.replace({
              pathname: '/login',
              query: targetQuery,
            });
          } catch (err: any) {
            if (
              typeof err?.message === 'string' &&
              err.message.includes('attempted to hard navigate to the same URL')
            ) {
              // dev-only invariant – ignore
            } else {
              throw err;
            }
          }
        }
        return;
      }

      // Role-guarded routes
      if (!canAccess(pathname, role)) {
        const need = requiredRolesFor(pathname);
        hasRedirected.current = true;

        if (!role) {
          const targetQuery = {
            next: router.asPath,
            need: Array.isArray(need) ? need.join(',') : need ?? '',
          };
          const targetAsPath = `/login?${new URLSearchParams(targetQuery).toString()}`;

          if (router.asPath !== targetAsPath) {
            try {
              await router.replace({
                pathname: '/login',
                query: targetQuery,
              });
            } catch (err: any) {
              if (
                typeof err?.message === 'string' &&
                err.message.includes('attempted to hard navigate to the same URL')
              ) {
                // dev-only invariant – ignore
              } else {
                throw err;
              }
            }
          }
        } else {
          const target = '/403';
          if (router.asPath !== target) {
            try {
              await router.replace('/403');
            } catch (err: any) {
              if (
                typeof err?.message === 'string' &&
                err.message.includes('attempted to hard navigate to the same URL')
              ) {
                // ignore
              } else {
                throw err;
              }
            }
          }
        }
        return;
      }
    })();

    return () => {
      mounted = false;
    };
  }, [authStatus, path, pathname, router, sessionUser.role, sessionUser.user, setLocale]);

  return { authStatus, isChecking: authStatus === 'checking' };
}

export default useRouteGuard;
