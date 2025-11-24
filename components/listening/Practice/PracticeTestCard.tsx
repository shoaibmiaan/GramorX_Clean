// components/listening/Practice/PracticeTestCard.tsx
import * as React from 'react';
import Link from 'next/link';

import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';
import type { ListeningTestSummary } from '@/lib/listening/types';

type Props = {
  test: ListeningTestSummary;
  /** practice page base path, usually "/listening/practice" */
  baseHref?: string;
};

const difficultyLabel: Record<ListeningTestSummary['difficulty'], string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const PracticeTestCard: React.FC<Props> = ({ test, baseHref = '/listening/practice' }) => {
  const href = `${baseHref}/${test.slug}`;

  return (
    <Link href={href} className="block">
      <Card className="flex h-full flex-col justify-between border-border bg-card/60 shadow-sm transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Icon name="Headphones" size={16} className="text-primary" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground sm:text-base">
                  {test.title}
                </h2>
                <Badge variant="neutral" size="sm">
                  {difficultyLabel[test.difficulty]}
                </Badge>
                <Badge variant="ghost" size="sm" className="flex items-center gap-1">
                  <Icon name="Clock" size={12} />
                  <span>{Math.round(test.durationSeconds / 60)} min</span>
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {test.totalQuestions} questions · Fast drill for focused listening.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Icon name="Bolt" size={12} />
            <span>Instant checking + explanations</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium">
            <span>Start drill</span>
            <Icon name="ArrowRight" size={12} />
          </span>
        </div>
      </Card>
    </Link>
  );
};

export default PracticeTestCard;
