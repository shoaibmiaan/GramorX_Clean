// components/mock/MockLayout.tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type MockLayoutProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: React.ReactNode;
};

const mockNavItems = [
  {
    label: 'Full Mock',
    href: '/mock',
    icon: 'Timer' as const,
  },
  {
    label: 'Listening',
    href: '/mock/listening/overview',
    icon: 'Headphones' as const,
  },
  {
    label: 'Reading',
    href: '/mock/reading/overview',
    icon: 'FileText' as const,
  },
  {
    label: 'Writing',
    href: '/mock/writing/overview',
    icon: 'PenSquare' as const,
  },
  {
    label: 'Speaking',
    href: '/mock/speaking/overview',
    icon: 'Microphone' as const,
  },
];

const MockLayout: React.FC<MockLayoutProps> = ({ title, subtitle, eyebrow, children }) => {
  const router = useRouter();

  return (
    <main className="bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 min-h-screen">
      {/* Header / hero for all mock pages */}
      <section className="pb-6 pt-16 md:pt-20">
        <Container>
          <div className="space-y-4">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                {eyebrow}
              </p>
            )}

            <h1 className="font-slab text-display text-gradient-primary">{title}</h1>

            {subtitle && (
              <p className="max-w-2xl text-body text-grayish">
                {subtitle}
              </p>
            )}

            {/* Mock nav strip */}
            <div className="mt-4 flex flex-wrap gap-2">
              {mockNavItems.map((item) => {
                const isActive =
                  router.pathname === item.href ||
                  router.pathname.startsWith(item.href.replace('/overview', ''));

                return (
                  <Link key={item.href} href={item.href}>
                    <span
                      className={[
                        'inline-flex items-center gap-2 rounded-ds-full px-3 py-1 text-xs font-medium ring-1 transition',
                        isActive
                          ? 'bg-primary text-primary-foreground ring-primary'
                          : 'bg-card/80 text-muted-foreground ring-border/60 hover:bg-card',
                      ].join(' ')}
                    >
                      <Icon name={item.icon} size={14} />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* Content shell */}
      <section className="pb-16">
        <Container>
          <Card className="rounded-ds-2xl border border-border/60 bg-card/85 p-5 md:p-6 lg:p-7">
            {children}
          </Card>
        </Container>
      </section>
    </main>
  );
};

export default MockLayout;
