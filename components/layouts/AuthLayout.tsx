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

const DefaultRightPanel = () => {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-ds-2xl bg-muted">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-muted" />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-8 text-center">
        {/* 🔥 ONLY CHANGE: BIGGER LOGO */}
        <div className="mb-10">
          <Image
            src="/brand/logo.png"
            alt="GramorX"
            width={260}              // ⬅ increased
            height={260}             // ⬅ increased
            className="h-60 w-60 object-contain" // ⬅ increased
            priority
          />
        </div>

        {/* unchanged */}
        <p className="font-slab text-h3 text-foreground">Your IELTS Companion</p>
        <p className="mt-2 max-w-sm text-small text-muted-foreground">
          Practice, mocks, AI feedback, and analytics — all in one clean workspace.
        </p>
      </div>
    </div>
  );
};

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
    <main className={clsx('min-h-screen bg-lightBg dark:bg-dark', className)}>
      <div className="mx-auto flex min-h-screen max-w-6xl items-stretch px-4 py-8 md:py-10">
        <div className="relative w-full rounded-ds-2xl border border-border/60 bg-card/80 shadow-sm">
          <div className="absolute right-4 top-4 z-10">
            <ThemeToggle />
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

              <div className="mb-6 space-y-2">
                <h1 className="font-slab text-h1 text-foreground">{title}</h1>
                {subtitle ? (
                  <p className="text-body text-muted-foreground">{subtitle}</p>
                ) : null}
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
