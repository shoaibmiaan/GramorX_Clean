// components/Layout.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// IMPORTANT: Header must be a **default** export.
// If your Header file also exports named, keep default as the primary export.
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FooterMini from '@/components/navigation/FooterMini';
import QuickAccessWidget from '@/components/navigation/QuickAccessWidget';

// Load BottomNav only on the client (avoid SSR hydration mismatches)
const BottomNav = dynamic(
  () => import('@/components/navigation/BottomNav').then((m) => m.default || m),
  { ssr: false }
);

type LayoutProps = {
  children: React.ReactNode;
};

// Routes where we show the compact FooterMini
const MINI_ROUTE_PATTERNS: RegExp[] = [
  /^\/(login|signup|verify|reset|onboarding)/,
  /^\/(dashboard|account|speaking|listening|reading|writing|ai|partners|admin)(\/|$)/,
];

// Routes where we hide the BottomNav entirely
const HIDE_BOTTOM_NAV_PATTERNS: RegExp[] = [
  /^\/(login|signup|verify|reset|admin)(\/|$)/,
];

// Helper to test route patterns
const matches = (patterns: RegExp[], path: string): boolean =>
  patterns.some((re) => re.test(path));

export default function Layout({ children }: LayoutProps) {
  const { pathname } = useRouter();

  // 🔹 All mock overview pages → force mini footer
  const isMockOverview = /^\/mock\/(listening|reading|writing|speaking)\/overview$/.test(
    pathname
  );

  // Mini footer for dashboard/auth/etc + mock overview pages
  const useMiniFooter = isMockOverview || matches(MINI_ROUTE_PATTERNS, pathname);

  // Hide mobile nav for restricted routes
  const showBottomNav = !matches(HIDE_BOTTOM_NAV_PATTERNS, pathname);

  return (
    <>
      <a id="top" aria-hidden="true" />
      <Header />

      <main className="min-h-[60vh] pt-safe pb-[calc(env(safe-area-inset-bottom,0px)+72px)] md:pb-16 lg:pb-20">
        {children}
      </main>

      {useMiniFooter ? <FooterMini /> : <Footer />}

      {showBottomNav && <BottomNav />}

      <QuickAccessWidget />
    </>
  );
}
