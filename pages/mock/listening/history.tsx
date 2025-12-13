import * as React from 'react';
import Head from 'next/head';

import { Container } from '@/components/design-system/Container';
import MockEmptyState from '@/components/mock/MockEmptyState';
import MockPageHeader from '@/components/mock/MockPageHeader';

export default function ListeningHistoryPage() {
  return (
    <>
      <Head>
        <title>Listening mock history · GramorX</title>
      </Head>
      <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 pb-10">
        <Container className="space-y-6 py-10">
          <MockPageHeader
            title="Listening mock history"
            subtitle="Find your Listening attempts, scores, and review links in one place."
            backHref="/mock/history"
            badge={{ label: 'Listening', tone: 'info' }}
            actions={[{ label: 'Start Listening mock', href: '/mock/listening', icon: 'Headphones' }]}
          />

          <MockEmptyState
            title="No Listening attempts yet"
            description="Take a Listening mock to populate your timeline and results here."
            icon="Headphones"
            primaryCta={{ label: 'Start Listening mock', href: '/mock/listening' }}
            secondaryCta={{ label: 'Back to Mock hub', href: '/mock' }}
          />
        </Container>
      </main>
    </>
  );
}
