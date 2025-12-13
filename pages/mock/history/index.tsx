import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Icon } from '@/components/design-system/Icon';
import MockEmptyState from '@/components/mock/MockEmptyState';
import MockPageHeader from '@/components/mock/MockPageHeader';

const moduleHistoryLinks = [
  { id: 'reading', label: 'Reading history', href: '/mock/reading/history', icon: 'BookOpenCheck' },
  { id: 'listening', label: 'Listening history', href: '/mock/listening/history', icon: 'Headphones' },
  { id: 'writing', label: 'Writing history', href: '/mock/writing/history', icon: 'PenSquare' },
  { id: 'speaking', label: 'Speaking history', href: '/mock/speaking/history', icon: 'Mic' },
];

export default function MockHistoryIndex() {
  return (
    <>
      <Head>
        <title>Mock results & history · GramorX</title>
      </Head>
      <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 pb-12">
        <Container className="space-y-6 py-10">
          <MockPageHeader
            title="Mock results & history"
            subtitle="Jump into module-specific histories to view scores, reviews, and download reports."
            badge={{ label: 'Unified hub', tone: 'info' }}
            backHref="/mock"
            backLabel="Back to Mock hub"
          />

          <Card className="grid gap-4 border border-border/70 bg-card/70 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {moduleHistoryLinks.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex items-center gap-3 rounded-ds-xl bg-muted/40 p-3 transition hover:bg-muted/70"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon name={item.icon as React.ComponentProps<typeof Icon>['name']} size={18} />
                </span>
                <span className="font-medium text-foreground">{item.label}</span>
              </Link>
            ))}
          </Card>

          <MockEmptyState
            title="Aggregated results coming soon"
            description="We’re building a unified leaderboard and exportable report across all mock modules."
            icon="BarChart3"
            primaryCta={{ label: 'Back to Mock hub', href: '/mock' }}
            secondaryCta={{ label: 'Go to analytics', href: '/mock/analytics' }}
          />
        </Container>
      </main>
    </>
  );
}
