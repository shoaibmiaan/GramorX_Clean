import * as React from 'react';
import Head from 'next/head';

import { Container } from '@/components/design-system/Container';
import MockEmptyState from '@/components/mock/MockEmptyState';
import MockPageHeader from '@/components/mock/MockPageHeader';

export default function ReadingHistoryPage() {
  return (
    <>
      <Head>
        <title>Reading mock history · GramorX</title>
      </Head>
      <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 pb-10">
        <Container className="space-y-6 py-10">
          <MockPageHeader
            title="Reading mock history"
            subtitle="Review your Reading attempts, resumes, and feedback."
            backHref="/mock/history"
            badge={{ label: 'Reading', tone: 'success' }}
            actions={[{ label: 'Start a mock', href: '/mock/reading', icon: 'Play' }]}
          />

          <MockEmptyState
            title="No Reading attempts yet"
            description="Start a Reading mock to see your scores, mistakes, and review links here."
            icon="BookOpenCheck"
            primaryCta={{ label: 'Start Reading mock', href: '/mock/reading' }}
            secondaryCta={{ label: 'Back to Mock hub', href: '/mock' }}
          />
        </Container>
      </main>
    </>
  );
}
