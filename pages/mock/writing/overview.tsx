// pages/mock/writing/overview.tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

const WritingOverviewPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Writing Mock Overview • GramorX</title>
        <meta
          name="description"
          content="Exact IELTS-style computer-based Writing mock – instructions before you start."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          {/* Top header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon name="PenLine" size={18} />
              </span>
              <div>
                <h1 className="font-slab text-h3">Writing Mock – CBE Mode</h1>
                <p className="text-xs text-muted-foreground">
                  Full IELTS Writing mock: Task 1 + Task 2 in one go. Read this once before you hit start.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 text-right">
              <Badge tone="info" size="sm">
                Full mock • Task 1 + Task 2
              </Badge>
              <p className="text-[11px] text-muted-foreground">
                Total time: 60 minutes. No pause, no reset.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {/* Left: Instructions */}
            <div className="space-y-4">
              <Card className="rounded-ds-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
                <h2 className="mb-2 font-slab text-h4">How this test works</h2>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <Icon name="CheckCircle2" size={14} className="mt-[3px] text-primary" />
                    <span>
                      You get <strong>60 minutes total</strong> for both tasks. Just like the real exam, there is{' '}
                      <strong>no separate timer</strong> per task.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Icon name="CheckCircle2" size={14} className="mt-[3px] text-primary" />
                    <span>
                      Recommended split: around <strong>20 minutes for Task 1</strong> and{' '}
                      <strong>40 minutes for Task 2</strong>. Task 2 is worth more marks.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Icon name="CheckCircle2" size={14} className="mt-[3px] text-primary" />
                    <span>
                      You&apos;ll write <strong>directly in the on-screen editor</strong>. No copy–paste tricks, no
                      external tools.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Icon name="CheckCircle2" size={14} className="mt-[3px] text-primary" />
                    <span>
                      When time ends or you hit submit, your answers are locked and sent for{' '}
                      <strong>AI band scoring & feedback</strong>.
                    </span>
                  </li>
                </ul>
              </Card>

              <Card className="rounded-ds-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
                <h2 className="mb-2 font-slab text-h5">Before you click start</h2>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <Icon name="Clock" size={14} className="mt-[3px] text-primary" />
                    <span>
                      Block a full <strong>uninterrupted 60 minutes</strong>. If you&apos;re going to get up for chai
                      every 5 minutes, don&apos;t start.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Icon name="Wifi" size={14} className="mt-[3px] text-primary" />
                    <span>
                      Make sure your <strong>internet and power</strong> are stable. Don&apos;t refresh or close the
                      tab once the timer starts.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Icon name="Type" size={14} className="mt-[3px] text-primary" />
                    <span>
                      Write in <strong>clear, normal English</strong>. No texting slang, no ChatGPT copy-paste, no
                      weird symbols.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Icon name="AlertTriangle" size={14} className="mt-[3px] text-amber-500" />
                    <span>
                      Don&apos;t spend <strong>30 minutes just planning</strong>. Plan fast, write fast, and leave a few
                      minutes to fix obvious mistakes.
                    </span>
                  </li>
                </ul>
              </Card>
            </div>

            {/* Right: Summary + Start */}
            <div className="space-y-4">
              <Card className="rounded-ds-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      You&apos;re about to start
                    </p>
                    <h2 className="font-slab text-h5">Full Writing Mock</h2>
                  </div>
                  <Badge tone="success" size="sm">
                    Task 1 + Task 2
                  </Badge>
                </div>

                <ul className="mb-4 space-y-1.5 text-[11px] text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Icon name="LayoutPanelLeft" size={13} />
                    <span>Task question on the left, editor on the right.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Timer" size={13} />
                    <span>Global 60-minute timer at the top — same as real IELTS.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="ListChecks" size={13} />
                    <span>Live word count and band-target hints so you don&apos;t underwrite.</span>
                  </li>
                </ul>

                <div className="flex flex-col gap-2">
                  <Button
                    asChild
                    variant="primary"
                    size="lg"
                    className="flex w-full justify-center rounded-ds-2xl"
                  >
                    <Link href="/mock/writing/run?id=sample-writing-1">
                      Start Writing Test
                    </Link>
                  </Button>
                  <p className="text-center text-[11px] text-muted-foreground">
                    Once you click start, the 60-minute clock runs non-stop until you submit. Treat it like real exam
                    day.
                  </p>
                </div>
              </Card>

              <Card className="rounded-ds-2xl border border-dashed border-border/70 bg-muted/60 p-4 text-[11px] text-muted-foreground">
                <p className="mb-1 font-medium text-foreground">Reminder</p>
                <p>
                  This is a <strong>serious rehearsal</strong>. Sit properly, no tabs open with samples or AI, no
                  copying from old essays. If you cheat here, the band score later will lie to you — not to IELTS.
                </p>
              </Card>
            </div>
          </div>
        </Container>
      </main>
    </>
  );
};

export default WritingOverviewPage;
