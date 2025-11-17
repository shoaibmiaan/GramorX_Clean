// pages/mock/listening.tsx
import React from 'react';
import Head from 'next/head';
import type { GetServerSideProps, NextPage } from 'next';

import ModuleHero from '@/components/module/ModuleHero';
import ModuleFeatures from '@/components/module/ModuleFeatures';
import ListeningTestCard from '@/components/listening/ListeningTestCard';
import type { ListeningTestSummary } from '@/lib/listeningTests';

type ListeningModulePageProps = {
  tests: ListeningTestSummary[];
};

const ListeningModulePage: NextPage<ListeningModulePageProps> = ({ tests }) => {
  const moduleFeatures = [
    {
      title: 'Timed Listening Tests',
      description: 'Simulate listening tests with timed modules and AI-based band estimates.',
    },
    {
      title: 'AI Feedback',
      description: 'Get AI-based feedback on your performance and band estimate.',
    },
    {
      title: 'Real Exam Environment',
      description: 'Practice listening tests in a realistic exam environment with time tracking.',
    },
  ];

  const defaultTestSlug = tests[0]?.slug || null;

  return (
    <>
      <Head>
        <title>Listening Module • GramorX AI</title>
        <meta
          name="description"
          content="Practice listening comprehension with timed modules and AI feedback."
        />
      </Head>

      <main className="bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
        {/* Module Hero */}
        <ModuleHero
          title="Listening"
          description="Simulate listening tests with timed modules and AI-based band estimates."
          icon="Headphones"
          testLink={defaultTestSlug ? `/mock/listening/run?id=${defaultTestSlug}` : undefined}
        />

        {/* Module Features */}
        <ModuleFeatures features={moduleFeatures} />

        {/* Test list */}
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h2 className="font-slab text-h4 mb-4">Available Listening Mock Tests</h2>

          {tests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No listening tests available yet.</p>
          ) : (
            <div className="space-y-4">
              {tests.map((t) => (
                <ListeningTestCard key={t.slug} test={t} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default ListeningModulePage;

export const getServerSideProps: GetServerSideProps<ListeningModulePageProps> = async () => {
  const { fetchAllListeningTests } = await import('@/lib/listeningTests');

  const tests = await fetchAllListeningTests();

  return {
    props: {
      tests,
    },
  };
};
