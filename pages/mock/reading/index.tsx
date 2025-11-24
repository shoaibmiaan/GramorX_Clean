import React from 'react';
import Head from 'next/head';
import { Container } from '@/components/design-system/Container';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

const ReadingModulePage: React.FC = () => {
  return (
    <>
      <Head>
        <title>GramorX AI — Reading Module</title>
        <meta name="description" content="Prepare for the IELTS Reading module with realistic exam conditions and AI-powered feedback." />
      </Head>

      <main className="bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
        {/* Hero Section */}
        <section className="pb-16 pt-16 md:pt-20">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-center">
              <div className="space-y-6">
                <h1 className="font-slab text-display text-gradient-primary">Reading Module</h1>
                <p className="max-w-xl text-body text-grayish">
                  Practice reading comprehension with realistic exam conditions and detailed feedback, simulating the real IELTS exam experience.
                </p>

                <div className="flex flex-wrap gap-4 pt-2">
                  <Button
                    asChild
                    variant="primary"
                    size="lg"
                    className="rounded-ds-2xl px-6"
                  >
                    Start Reading Test
                  </Button>
                </div>
              </div>

              {/* Right side: Module Info */}
              <div className="space-y-4">
                <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="font-slab text-h3">Module Overview</h2>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <p className="text-small text-grayish">
                      The Reading module assesses your ability to read and understand academic texts. This practice test will provide simulated reading passages and questions similar to those found in the IELTS exam.
                    </p>
                    <ul className="space-y-2 text-xs text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="mt-[3px] inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
                          <Icon name="Check" size={10} />
                        </span>
                        <span>Timed Reading test</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-[3px] inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[10px] text-primary">
                          <Icon name="Check" size={10} />
                        </span>
                        <span>Realistic Reading comprehension</span>
                      </li>
                    </ul>
                  </div>
                </Card>
              </div>
            </div>
          </Container>
        </section>
      </main>
    </>
  );
};

export default ReadingModulePage;
