// pages/mock/reading/drill/result/[attemptId].tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import type { Database } from '@/lib/database.types';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { Icon } from '@/components/design-system/Icon';

type PageProps = {
  attempt: any | null;
  error?: string;
};

const DrillResultPage: NextPage<PageProps> = ({ attempt, error }) => {
  if (error || !attempt) {
    return (
      <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
        <Container className="py-10 max-w-3xl">
          <Card className="p-6 rounded-ds-2xl">
            <p className="text-sm text-muted-foreground">{error ?? 'Not found'}</p>
            <Button asChild className="mt-4">
              <Link href="/mock/reading/drill">Back to Drill hub</Link>
            </Button>
          </Card>
        </Container>
      </main>
    );
  }

  return (
    <>
      <Head><title>Drill Result · GramorX</title></Head>
      <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
        <Container className="py-10 max-w-4xl space-y-4">
          <Card className="p-6 rounded-ds-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Badge variant="info" size="sm">Drill</Badge>
                <h1 className="font-slab text-h2">Result saved ✅</h1>
                <p className="text-sm text-muted-foreground">
                  {attempt.drill_type} • {attempt.question_count} Q • {Math.round((attempt.duration_seconds ?? 0)/60)} min
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Accuracy</div>
                <div className="text-2xl font-semibold">{attempt.accuracy ?? 0}%</div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap pt-2">
              <Button asChild variant="secondary">
                <Link href="/mock/reading/drill">Drill hub</Link>
              </Button>
              <Button asChild>
                <Link href="/mock/reading">Reading home</Link>
              </Button>
            </div>
          </Card>
        </Container>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  try {
    const supabase = getServerClient<Database>(ctx.req, ctx.res);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { redirect: { destination: '/login', permanent: false } };
    }

    const attemptId = String(ctx.params?.attemptId ?? '');

    const { data, error } = await supabase
      .from('reading_drill_attempts')
      .select('id,user_id,drill_type,question_count,duration_seconds,raw_score,accuracy,meta,created_at')
      .eq('id', attemptId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    return { props: { attempt: data ?? null } };
  } catch (e: any) {
    return { props: { attempt: null, error: e?.message ?? 'Failed to load drill result.' } };
  }
};

export default DrillResultPage;
