// pages/vocabulary/ai-lab.tsx
import React from 'react';
import Head from 'next/head';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';

export default function VocabAiLabPage() {
  return (
    <>
      <Head>
        <title>AI Rewrite Lab — Vocabulary Lab</title>
      </Head>

      <section className="bg-lightBg py-20 dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
        <Container>
          <div className="mb-8 space-y-3">
            <Badge size="sm" variant="accent">
              Rocket feature
            </Badge>
            <h1 className="font-slab text-display text-gradient-primary">
              Rewrite your sentences with stronger vocabulary
            </h1>
            <p className="max-w-2xl text-body text-grayish">
              Paste a sentence or short paragraph and get band-7+ style rewrites with better
              word choice and more natural phrasing.
            </p>
          </div>

          <Card className="rounded-ds-2xl border border-border/60 bg-card/60 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Your sentence
              </p>
              <Badge size="xs" variant="neutral">
                Preview mode
              </Badge>
            </div>

            <textarea
              className="min-h-[120px] w-full rounded-ds-2xl border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none ring-primary/30 focus:ring-2"
              placeholder="Type or paste a sentence, for example: 
The graph shows that a lot of people use public transport now."
            />

            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="rounded-ds-xl" disabled>
                Rewrite more academically
              </Button>
              <Button size="sm" variant="secondary" className="rounded-ds-xl" disabled>
                Make it more concise
              </Button>
              <Button size="sm" variant="ghost" className="rounded-ds-xl" disabled>
                Show several options
              </Button>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/60">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Sample output
              </p>
              <div className="space-y-2 text-sm">
                <p className="font-medium">
                  The graph illustrates that a significantly larger proportion of people now
                  rely on public transport.
                </p>
                <p className="text-xs text-muted-foreground">
                  Changes: &quot;a lot of people&quot; → &quot;a significantly larger
                  proportion of people&quot;, &quot;use&quot; → &quot;rely on&quot;.
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Once wired, this tool can log your inputs and suggested changes to your
                Mistakes Book for review.
              </p>
            </div>
          </Card>
        </Container>
      </section>
    </>
  );
}
