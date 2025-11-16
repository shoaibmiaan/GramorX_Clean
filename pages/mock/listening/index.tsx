// pages/mock/listening.tsx
import React, { useEffect, useState } from 'react';
import Head from 'next/head';

import ModuleHero from '@/components/module/ModuleHero';
import ModuleFeatures from '@/components/module/ModuleFeatures';
import ListeningTestCard from '@/components/listening/ListeningTestCard';
import {
  fetchAllListeningTests,
  type ListeningTestMeta,
} from '@/lib/listeningTests';

const ListeningModulePage: React.FC = () => {
  const [tests, setTests] = useState<ListeningTestMeta[]>([]);
  const [loading, setLoading] = useState(true);

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
      description:
        'Practice listening tests in a realistic exam environment with time tracking.',
    },
  ];

  useEffect(() => {
    (async () => {
      try {
        const rows = await fetchAllListeningTests();
        setTests(rows);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // First test in DB (if exists)
  const defaultTestSlug = tests[0]?.test_slug || null;

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
          testLink={
            defaultTestSlug ? `/mock/listening/run?id=${defaultTestSlug}` : undefined
          }
        />

        {/* Module Features */}
        <ModuleFeatures features={moduleFeatures} />

        {/* Test list */}
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h2 className="font-slab text-h4 mb-4">
            Available Listening Mock Tests
          </h2>

          {loading && (
            <p className="text-sm text-muted-foreground">Loading tests…</p>
          )}

          {!loading && tests.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No listening tests available yet.
            </p>
          )}

          {!loading && tests.length > 0 && (
            <div className="space-y-4">
              {tests.map((t) => (
                <ListeningTestCard key={t.test_slug} test={t} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default ListeningModulePage;
