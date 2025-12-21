// components/layouts/AuthLayout.tsx
'use client';

import * as React from 'react';
import clsx from 'clsx';
import Image from 'next/image';
import Link from 'next/link';

import { ThemeToggle } from '@/components/design-system/ThemeToggle';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  right?: React.ReactNode;
  hideRightOnMobile?: boolean;
  footerLink?: {
    label: string;
    href: string;
  };
  className?: string;
};

const DefaultRight = () => (
  <div className="relative h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-purpleVibe/20 via-electricBlue/10 to-neonGreen/10">
    <Image
      src="/brand/logo.png"
      alt="GramorX Logo"
      width={120}
      height={120}
      className="h-24 w-24 md:h-32 md:w-32 object-contain drop-shadow-lg"
      priority
    />
    <h2 className="mt-6 text-h3 font-semibold text-grayish dark:text-mutedText">Your IELTS Companion</h2>
  </div>
);

export default function AuthLayout({
  title,
  subtitle,
  children,
  right,
  hideRightOnMobile = true,
  footerLink,
  className,
}: Props) {
  return (
    <div className="relative min-h-[100dvh] bg-background text-foreground">
      {/* Theme toggle */}
      <div className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+1rem)] z-40">
        <ThemeToggle />
      </div>

      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1200px] flex-col px-4 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] pt-[calc(env(safe-area-inset-top,0px)+5rem)] sm:px-6 md:px-0 md:pt-[calc(env(safe-area-inset-top,0px)+6rem)]">
        {showRightOnMobile && (
          <div className="mb-6 flex justify-center md:hidden">
            <div
              role="tablist"
              aria-label="Authentication layout views"
              className="inline-flex w-full max-w-sm items-center justify-center gap-1 rounded-full bg-muted/70 p-1 text-small font-medium shadow-sm backdrop-blur"
            >
              <button
                type="button"
                role="tab"
                id={leftTabId}
                aria-controls={leftPanelId}
                aria-selected={mobileView === 'left'}
                tabIndex={mobileView === 'left' ? 0 : -1}
                onClick={() => setMobileView('left')}
                className={`flex-1 rounded-full px-4 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  mobileView === 'left'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-mutedText hover:text-foreground'
                }`}
              >
                {primaryLabel}
              </button>
              <button
                type="button"
                role="tab"
                id={rightTabId}
                aria-controls={rightPanelId}
                aria-selected={mobileView === 'right'}
                tabIndex={mobileView === 'right' ? 0 : -1}
                onClick={() => setMobileView('right')}
                className={`flex-1 rounded-full px-4 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  mobileView === 'right'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-mutedText hover:text-foreground'
                }`}
              >
                {secondaryLabel}
              </button>
            </div>
          </div>

          <div className="grid min-h-[680px] grid-cols-1 gap-0 md:grid-cols-2">
            {/* LEFT PANEL — unchanged */}
            <section className="flex flex-col justify-center px-5 py-10 md:px-10">
              <div className="mb-6 flex items-center gap-3">
                <Link href="/" className="inline-flex items-center gap-2">
                  <Image
                    src="/brand/logo.png"
                    alt="GramorX"
                    width={36}
                    height={36}
                    className="h-9 w-9 object-contain"
                    priority
                  />
                  <span className="font-slab text-h3 text-gradient-primary">
                    GramorX
                  </span>
                </Link>
              </div>

              <div className="space-y-2">
                <h1 className="font-slab text-h1 sm:text-display font-bold text-foreground dark:text-white">{title}</h1>
                {subtitle && (
                  <p className="text-small text-grayish dark:text-grayish">{subtitle}</p>
                )}
              </div>

              <div className="w-full max-w-md">{children}</div>

              {footerLink ? (
                <div className="mt-6 text-small text-muted-foreground">
                  <Link
                    href={footerLink.href}
                    className="text-primary hover:underline"
                  >
                    {footerLink.label}
                  </Link>
                </div>
              ) : null}
            </section>

            {/* RIGHT PANEL — unchanged except logo size */}
            <section
              className={clsx(
                'p-6 md:p-8',
                hideRightOnMobile ? 'hidden md:block' : 'block',
              )}
            >
              {right ?? <DefaultRightPanel />}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
