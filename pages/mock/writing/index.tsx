// pages/mock/writing/index.tsx

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { getServerClient } from '@/lib/supabaseServer';
import type { GetServerSideProps, NextPage } from 'next';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';

type MockTest = {
  slug: string;
  variant: string | null;
};

type Props = {
  mocks: MockTest[];
};

const WritingMockOverviewPage: NextPage<Props> = ({ mocks }) => {
  return (
    <>
      <Head>
        <title>Writing Mock Tests • GramorX AI</title>
      </Head>

      <main className="min-h-screen bg-background">
        <Container className="py-10">
          <h1 className="text-display font-bold mb-6">Writing Mock Tests</h1>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mocks.map((mock) => (
              <Card key={mock.slug} className="p-4 border">
                <h2 className="text-h5 font-semibold">{mock.slug}</h2>

                {mock.variant && (
                  <Badge tone="info" className="mt-2">
                    {mock.variant}
                  </Badge>
                )}

                <Button asChild tone="primary" className="mt-4 w-full">
                  <Link href={`/mock/writing/run?slug=${mock.slug}`}>
                    Start Test
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        </Container>
      </main>
    </>
  );
};

export default WritingMockOverviewPage;

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      redirect: {
        destination: '/auth/sign-in',
        permanent: false,
      },
    };
  }

  // 1 mock = 2 prompts (task1 & task2) with same slug
  const { data, error } = await supabase
    .from('writing_prompts')
    .select('slug, task_type')
    .neq('slug', '')
    .neq('prompt_text', null);

  if (error || !data) return { props: { mocks: [] } };

  const grouped = data.reduce((acc: any, row: any) => {
    acc[row.slug] = acc[row.slug] || { slug: row.slug, task1: false, task2: false };
    if (row.task_type === 'task1') acc[row.slug].task1 = true;
    if (row.task_type === 'task2') acc[row.slug].task2 = true;
    return acc;
  }, {});

  const mocks = Object.values(grouped).filter((g: any) => g.task1 && g.task2);

  return {
    props: { mocks },
  };
};
