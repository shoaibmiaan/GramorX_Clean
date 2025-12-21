// pages/mock/reading/drill/passage.tsx
import * as React from 'react';
import type { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';

import { getServerClient } from '@/lib/supabaseServer';
import type { ReadingPassage, ReadingQuestion } from '@/lib/reading/types';

type PageProps = {
  passage: ReadingPassage;
  questions: ReadingQuestion[];
};

const PassageDrillPage: NextPage<PageProps> = ({ passage, questions }) => {
  return (
    <>
      <Head>
        <title>Passage Drill</title>
      </Head>

      <main className="min-h-screen bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90 pb-20">
        <Container className="py-10 space-y-6">
          <Card className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <Badge variant="neutral" size="sm">
                Passage drill
              </Badge>
              <h1 className="text-h4 font-semibold">
                Passage {passage.passageOrder}
                {passage.title ? `: ${passage.title}` : ''}
              </h1>
            </div>

            <Button asChild variant="outline" size="sm">
              <Link href="/mock/reading">
                <Icon name="ChevronLeft" className="h-4 w-4 mr-1" />
                Back to Reading
              </Link>
            </Button>
          </Card>

          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2 text-small font-semibold">
              <Icon name="BookOpen" className="h-4 w-4 text-primary" />
              Passage text
            </div>
            <div className="prose dark:prose-invert max-w-none">
              {/* If passage.content_html exists in your type, render it instead */}
              <p>{(passage as any).content ?? (passage as any).text ?? ''}</p>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h2 className="text-small font-semibold">Questions</h2>
            <pre className="text-caption text-muted-foreground overflow-auto">
              {/* Keep your existing question renderer here if you have one */}
              {JSON.stringify(questions, null, 2)}
            </pre>
          </Card>
        </Container>
      </main>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);

  const passageOrder =
    typeof ctx.query.passage === 'string' ? Number(ctx.query.passage) : 1;

  const { data: passage } = await supabase
    .from('reading_passages')
    .select('*')
    .eq('passage_order', passageOrder)
    .limit(1)
    .maybeSingle();

  const { data: questions } = await supabase
    .from('reading_questions')
    .select('*')
    .eq('passage_order', passageOrder);

  return {
    props: {
      passage: (passage as any) ?? null,
      questions: (questions as any) ?? [],
    },
  };
};

export default PassageDrillPage;
