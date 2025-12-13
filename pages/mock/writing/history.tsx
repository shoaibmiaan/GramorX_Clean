import * as React from 'react';
import Head from 'next/head';

import { Container } from '@/components/design-system/Container';
import MockEmptyState from '@/components/mock/MockEmptyState';
import MockPageHeader from '@/components/mock/MockPageHeader';

export default function WritingHistoryPage() {
  return (
    <>
      <Head>
        <title>Writing mock history · GramorX</title>
      </Head>
      <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 pb-10">
        <Container className="space-y-6 py-10">
          <MockPageHeader
            title="Writing mock history"
            subtitle="Review your Task 1 and Task 2 submissions, band feedback, and downloads."
            backHref="/mock/history"
            badge={{ label: 'Writing', tone: 'info' }}
            actions={[{ label: 'Start Writing mock', href: '/mock/writing', icon: 'PenSquare' }]}
          />

          <MockEmptyState
            title="No Writing attempts yet"
            description="Complete a Writing mock to see your submissions and feedback here."
            icon="PenSquare"
            primaryCta={{ label: 'Start Writing mock', href: '/mock/writing' }}
            secondaryCta={{ label: 'Back to Mock hub', href: '/mock' }}
          />
        </Container>
      </main>
    </>
  );
}
