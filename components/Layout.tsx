'use client';

import React from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

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
  hideFooter?: boolean;        // 🔥 NEW — controlled by AppLayoutManager
  isPremiumRoute?: boolean;    // (kept for future)
};

// Routes where mini footer usually appears
const MINI_ROUTE_PATTERNS: RegExp[] = [
  /^\/(login|signup|verify|reset|onboarding)/,
  /^\/(dashboard|account|speaking|listening|reading|writing|ai|partners|admin)(\/|$)/,
];

// Routes where BottomNav is hidden
const HIDE_BOTTOM_NAV_PATTERNS: RegExp[] = [
  /^\/(login|signup|verify|reset|admin)(\/|$)/,
];

const matches = (patterns: RegExp[], path: string): boolean =>
  patterns.some((re) => re.test(path));

export default function Layout({ children, hideFooter }: LayoutProps) {
  const { pathname } = useRouter();

  // Mock overview pages
  const isMockOverview = /^\/mock\/(listening|reading|writing|speaking)\/overview$/.test(pathname);

  // Default mini footer logic
  const defaultMiniFooter = isMockOverview || matches(MINI_ROUTE_PATTERNS, pathname);

  // Bottom nav visible?
  const showBottomNav = !matches(HIDE_BOTTOM_NAV_PATTERNS, pathname);

  // 🔥 FINAL FOOTER DECISION:
  // - If hideFooter=true → show FooterMini ALWAYS (never full Footer)
  // - Else → normal logic (mini or full)
  const footerToRender = hideFooter
    ? <FooterMini />
    : defaultMiniFooter
      ? <FooterMini />
      : <Footer />;

  return (
    <>
      <a id="top" aria-hidden="true" />

      <Header />

      <main className="min-h-[60vh] pt-safe pb-[calc(env(safe-area-inset-bottom,0px)+72px)] md:pb-16 lg:pb-20">
        {children}
      </main>

      {footerToRender}

      {showBottomNav && <BottomNav />}

      <QuickAccessWidget />
    </>
  );
}
