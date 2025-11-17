// pages/mock/writing/submitted.tsx

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { NextPage } from 'next';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { FooterMini } from '@/components/layout/FooterMini';

const WritingSubmittedPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Writing Test Submitted • GramorX AI</title>
      </Head>

      <main className="flex min-h-screen flex-col bg-background">
        <Container className="flex flex-1 items-center justify-center py-10">
          <Card className="max-w-md w-full p-6 sm:p-8 text-center">
            <h1 className="text-h3 font-semibold">Writing test submitted</h1>
            <p className="mt-3 text-sm text-muted">
              Your responses for Task&nbsp;1 and Task&nbsp;2 have been saved.
              You can now return to your mock dashboard while we process
              evaluation and AI feedback.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <Button asChild tone="primary" className="w-full justify-center">
                <Link href="/mock">Back to Mock Home</Link>
              </Button>

              <Button
                asChild
                tone="neutral"
                variant="ghost"
                className="w-full justify-center"
              >
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </Card>
        </Container>

        <FooterMini showSocials={false} className="mt-auto" />
      </main>
    </>
  );
};

export default WritingSubmittedPage;
