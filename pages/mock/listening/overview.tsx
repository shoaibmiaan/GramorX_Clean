// pages/mock/listening/overview.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { getServerClient } from '@/lib/supabaseServer';
import { Container } from '@/components/design-system/Container';
import { Button } from '@/components/design-system/Button';
import MockInstructions from '@/components/listening/Mock/MockInstructions';
import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type Props = {
  testSlug: string;
  testTitle: string;
  durationSeconds: number;
};

const MockListeningOverviewPage: NextPage<Props> = ({
  testSlug,
  testTitle,
  durationSeconds,
}) => {
  const durationMinutes = Math.round(durationSeconds / 60);

  return (
    <>
      <Head>
        <title>{testTitle} • Listening Mock Overview • GramorX</title>
        <meta
          name="description"
          content="Instructions before starting your strict IELTS-style Listening mock."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          <section className="mb-6 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Icon name="ClipboardList" size={14} />
              <span>Mock · Listening</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                  Before you start the mock
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  This will run in strict IELTS mode. Once you hit start, you don&apos;t pause.
                  You don&apos;t rewind. You just perform.
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 text-right">
                <p className="text-xs text-muted-foreground">
                  Test: <span className="font-medium text-foreground">{testTitle}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Duration: <span className="font-medium text-foreground">{durationMinutes} min</span>
                </p>
                <Button asChild size="sm">
                  <Link href={`/mock/listening/run?testSlug=${encodeURIComponent(testSlug)}`}>
                    <Icon name="Play" size={14} />
                    <span>Start mock now</span>
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <MockInstructions testTitle={testTitle} durationMinutes={durationMinutes} />
            <Card className="border-border bg-muted/40 px-3 py-3 text-[11px] text-muted-foreground sm:px-4 sm:py-3 sm:text-xs">
              <p className="flex items-start gap-2">
                <Icon name="AlertTriangle" size={14} className="mt-0.5 text-warning" />
                <span>
                  Don&apos;t treat mocks like casual practice. The more seriously you simulate,
                  the less the real exam can surprise you.
                </span>
              </p>
            </Card>
          </section>
        </Container>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: `/login?next=${encodeURIComponent(ctx.resolvedUrl || '/mock/listening')}`,
        permanent: false,
      },
    };
  }

  const testSlug = (ctx.query.testSlug as string | undefined) ?? null;

  const query = supabase
    .from('listening_tests')
    .select('slug, title, duration_seconds, is_mock')
    .eq('is_mock', true)
    .order('title', { ascending: true });

  const { data: rows } = await query;

  if (!rows || rows.length === 0) {
    return {
      notFound: true,
    };
  }

  const selected =
    (testSlug && rows.find((r: any) => r.slug === testSlug)) ?? rows[0];

  return {
    props: {
      testSlug: selected.slug,
      testTitle: selected.title,
      durationSeconds: selected.duration_seconds,
    },
  };
};

export default MockListeningOverviewPage;
