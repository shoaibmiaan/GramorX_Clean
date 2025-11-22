// components/listening/Learning/ListeningLessonLayout.tsx
import * as React from 'react';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import ListeningModuleHero from '@/components/listening/ListeningModuleHero';
import ListeningNavTabs from '@/components/listening/ListeningNavTabs';
import ListeningInfoBanner from '@/components/listening/ListeningInfoBanner';

type Props = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  /**
   * Optional info banner content (top of lesson).
   */
  bannerTitle?: string;
  bannerBody?: string;
};

const ListeningLessonLayout: React.FC<Props> = ({
  title,
  subtitle,
  children,
  bannerTitle,
  bannerBody,
}) => {
  return (
    <main className="min-h-screen bg-background py-8">
      <Container>
        <ListeningModuleHero
          title={title}
          subtitle={subtitle}
          chipLabel="Listening · Lesson"
          chipIcon="BookOpen"
          metaLabel="Learning mode"
          metaDescription="Understand the patterns first, then grind the tests."
        />

        <ListeningNavTabs activeKey="learn" />

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="space-y-4 border-border bg-card/60 p-4 sm:p-6">
            {bannerTitle && bannerBody && (
              <div className="mb-4">
                <ListeningInfoBanner
                  variant="info"
                  title={bannerTitle}
                  body={bannerBody}
                />
              </div>
            )}
            <article className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground dark:prose-invert">
              {children}
            </article>
          </Card>

          <aside className="space-y-4">
            <Card className="border-border bg-card/60 p-4 sm:p-5">
              <h2 className="text-xs font-semibold text-foreground sm:text-sm">
                How to use this lesson
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground sm:text-sm">
                <li>Read the examples slowly once.</li>
                <li>Note the traps and pattern keywords.</li>
                <li>Immediately jump into practice drills after finishing.</li>
              </ul>
            </Card>
          </aside>
        </div>
      </Container>
    </main>
  );
};

export default ListeningLessonLayout;
