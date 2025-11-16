// pages/mock/listening/overview.tsx
import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

const ListeningOverviewPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Listening Mock Overview • GramorX</title>
        <meta
          name="description"
          content="Exact IELTS-style computer-based Listening mock – instructions before you start."
        />
      </Head>

      <main className="min-h-screen bg-background py-8">
        <Container>
          {/* Top header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Icon name="Headphones" size={18} />
              </span>
              <div>
                <h1 className="font-slab text-h3">Listening Mock – CBE Mode</h1>
                <p className="text-xs text-muted-foreground">
                  This is a full IELTS-style computer-based Listening test. Read this once before you hit start.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 text-right">
              <Badge tone="info" size="sm">
                Full mock • 4 sections • 40 questions
              </Badge>
              <p className="text-[11px] text-muted-foreground">
                Estimated time: ~30–35 minutes (including review).
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            {/* Left: Instructions */}
            <div className="space-y-4">
              <Card className="rounded-ds-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
                <h2 className="font-slab text-h4 mb-2">How this test works</h2>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <Icon name="CheckCircle2" size={14} className="mt-[3px] text-primary" />
                    <span>
                      There are <strong>4 sections</strong> and <strong>40 questions</strong>, just like the real IELTS.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Icon name="CheckCircle2" size={14} className="mt-[3px] text-primary" />
                    <span>The recording for each section plays <strong>once only</strong>. No replay.</span>
                  </li>
                  <li className="flex gap-2">
                    <Icon name="CheckCircle2" size={14} className="mt-[3px] text-primary" />
                    <span>
                      You answer <strong>while listening</strong>. Questions stay on screen; you can scroll up and down.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Icon name="CheckCircle2" size={14} className="mt-[3px] text-primary" />
                    <span>
                      After Section 4, you get <strong>2 minutes</strong> to quickly review all 40 answers before
                      submission.
                    </span>
                  </li>
                </ul>
              </Card>

              <Card className="rounded-ds-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
                <h2 className="font-slab text-h5 mb-2">Before you click start</h2>
                <ul className="space-y-2 text-xs text-muted-foreground">
                  <li className="flex gap-2">
                    <Icon name="Volume2" size={14} className="mt-[3px] text-primary" />
                    <span>
                      Use <strong>headphones</strong>, not laptop speakers. Keep the room as quiet as possible.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Icon name="Wifi" size={14} className="mt-[3px] text-primary" />
                    <span>
                      Don&apos;t refresh or close the tab once the test starts. Treat it like the real exam.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Icon name="MousePointerClick" size={14} className="mt-[3px] text-primary" />
                    <span>
                      Type answers cleanly: avoid extra spaces, random symbols, or ALL CAPS for no reason.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <Icon name="AlertTriangle" size={14} className="mt-[3px] text-amber-500" />
                    <span>
                      If you miss something, <strong>move on</strong>. Don&apos;t waste 10 seconds crying over 1 blank.
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
                    <h2 className="font-slab text-h5">Full Listening Mock</h2>
                  </div>
                  <Badge tone="success" size="sm">
                    CBE layout
                  </Badge>
                </div>

                <ul className="mb-4 space-y-1.5 text-[11px] text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Icon name="LayoutPanelLeft" size={13} />
                    <span>Questions on the left, audio status on the right.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Timer" size={13} />
                    <span>Timer runs automatically per section.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="ListChecks" size={13} />
                    <span>All 40 answers editable in the final 2-minute review window.</span>
                  </li>
                </ul>

                <div className="flex flex-col gap-2">
                  <Button
                    asChild
                    variant="primary"
                    size="lg"
                    className="w-full rounded-ds-2xl justify-center"
                  >
                    {/* FIXED CTA */}
                    <Link href="/mock/listening/run?id=sample-listening-1">
                      Start Listening Test
                    </Link>
                  </Button>
                  <p className="text-[11px] text-muted-foreground text-center">
                    Once you click start, the flow continues straight through Sections 1–4 and the review screen.
                  </p>
                </div>
              </Card>

              <Card className="rounded-ds-2xl border border-dashed border-border/70 bg-muted/60 p-4 text-[11px] text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Reminder</p>
                <p>
                  This is a <strong>serious rehearsal</strong>, not casual practice. Sit like you&apos;re in the exam
                  hall. No pausing, no YouTube on the side, no WhatsApp scrolling in between sections.
                </p>
              </Card>
            </div>
          </div>
        </Container>
      </main>
    </>
  );
};

export default ListeningOverviewPage;
