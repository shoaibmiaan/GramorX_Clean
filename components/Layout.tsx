// components/Layout.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// IMPORTANT: Header must be a **default** export.
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FooterMini from '@/components/navigation/FooterMini';
import QuickAccessWidget from '@/components/navigation/QuickAccessWidget';

const BottomNav = dynamic(
  () => import('@/components/navigation/BottomNav').then((m) => m.default || m),
  { ssr: false }
);

type LayoutProps = {
  children: React.ReactNode;
};

// Default layout logic
const MINI_ROUTE_PATTERNS: RegExp[] = [
  /^\/(login|signup|verify|reset|onboarding)/,
  /^\/(dashboard|account|speaking|listening|reading|writing|ai|partners|admin)(\/|$)/,
];

const HIDE_BOTTOM_NAV_PATTERNS: RegExp[] = [
  /^\/(login|signup|verify|reset|admin)(\/|$)/,
];

// NEW: All mock exam routes → /mock/*
const MOCK_ROUTE_PATTERNS: RegExp[] = [
  /^\/mock(\/|$)/,
];

const matches = (patterns: RegExp[], path: string) =>
  patterns.some((re) => re.test(path));

export default function Layout({ children }: LayoutProps) {
  const { pathname } = useRouter();

  const useMiniFooter = matches(MINI_ROUTE_PATTERNS, pathname);
  const showBottomNav = !matches(HIDE_BOTTOM_NAV_PATTERNS, pathname);

  const isMockRoute = matches(MOCK_ROUTE_PATTERNS, pathname);

  return (
    <>
      <a id="top" aria-hidden="true" />
      <Header />

      <main className="min-h-[60vh] pt-safe pb-[calc(env(safe-area-inset-bottom,0px)+72px)] md:pb-16 lg:pb-20">
        {children}
      </main>

      {isMockRoute ? (
        // 🔥 For ALL mock exam pages, always use FooterMini
        <FooterMini />
      ) : (
        // Same old behavior for all other pages
        useMiniFooter ? <FooterMini /> : <Footer />
      )}

      {showBottomNav && <BottomNav />}

      <QuickAccessWidget />
    </>
  );
}
