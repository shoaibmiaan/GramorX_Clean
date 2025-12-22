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

export default function AuthLayout({
  title,
  subtitle,
  children,
  right,
  hideRightOnMobile,
  footerLink,
  className,
}: Props) {
  return (
    <div className="relative min-h-[100dvh] bg-background text-foreground">
      {/* Theme toggle */}
      <div className="absolute right-4 top-[calc(env(safe-area-inset-top,0px)+1rem)] z-40">
        <ThemeToggle />
      </div>

      <div className="mx-auto grid min-h-[100dvh] max-w-6xl grid-cols-1 lg:grid-cols-2">
        {/* LEFT */}
        <div className="flex flex-col justify-center px-6 py-10">
          <div className={clsx('w-full max-w-md space-y-6', className)}>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">{title}</h1>
              {subtitle ? (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>

            {children}

            {footerLink ? (
              <p className="pt-4 text-xs text-muted-foreground">
                <Link href={footerLink.href} className="underline">
                  {footerLink.label}
                </Link>
              </p>
            ) : null}
          </div>
        </div>

        {/* RIGHT */}
        <div
          className={clsx(
            'relative hidden items-center justify-center bg-muted lg:flex',
            hideRightOnMobile && 'hidden lg:flex',
          )}
        >
          {right ?? (
            <Image
              src="/brand/logo.png"
              alt="GramorX"
              width={420}
              height={420}
              priority
            />
          )}
        </div>
      </div>
    </div>
  );
}
