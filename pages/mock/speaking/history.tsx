import * as React from 'react';
import Head from 'next/head';

import { Container } from '@/components/design-system/Container';
import MockEmptyState from '@/components/mock/MockEmptyState';
import MockPageHeader from '@/components/mock/MockPageHeader';

export default function SpeakingHistoryPage() {
  return (
    <>
      <Head>
        <title>Speaking mock history · GramorX</title>
      </Head>
      <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 pb-10">
        <Container className="space-y-6 py-10">
          <MockPageHeader
            title="Speaking mock history"
            subtitle="Access past Speaking recordings, transcripts, and feedback."
            backHref="/mock/history"
            badge={{ label: 'Speaking', tone: 'info' }}
            actions={[{ label: 'Start Speaking mock', href: '/mock/speaking', icon: 'Mic' }]}
          />

          <MockEmptyState
            title="No Speaking attempts yet"
            description="Record a Speaking mock to populate your history here."
            icon="Mic"
            primaryCta={{ label: 'Start Speaking mock', href: '/mock/speaking' }}
            secondaryCta={{ label: 'Back to Mock hub', href: '/mock' }}
          />
        </Container>
      </main>
    </>
  );
}
