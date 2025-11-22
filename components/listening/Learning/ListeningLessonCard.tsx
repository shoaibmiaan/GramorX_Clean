// components/listening/Learning/ListeningLessonCard.tsx
import * as React from 'react';
import Link from 'next/link';

import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

type Props = {
  slug: string;
  title: string;
  description: string;
  estimatedMinutes?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  completed?: boolean;
};

const levelLabel: Record<NonNullable<Props['level']>, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const ListeningLessonCard: React.FC<Props> = ({
  slug,
  title,
  description,
  estimatedMinutes,
  level = 'beginner',
  completed = false,
}) => {
  return (
    <Link href={`/listening/learn/${slug}`} className="block">
      <Card className="flex h-full flex-col justify-between border-border bg-card/60 shadow-sm transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Icon name="BookOpen" size={16} className="text-primary" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground sm:text-base">
                  {title}
                </h2>
                <Badge variant="neutral" size="sm">
                  {levelLabel[level]}
                </Badge>
                {completed && (
                  <Badge variant="success" size="sm" className="flex items-center gap-1">
                    <Icon name="CheckCircle" size={12} />
                    <span>Done</span>
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                {description}
              </p>
            </div>
          </div>

          {estimatedMinutes ? (
            <div className="shrink-0 text-right">
              <p className="text-[11px] font-medium text-muted-foreground">
                ~{estimatedMinutes} min
              </p>
              <p className="text-[10px] text-muted-foreground/80">Lesson time</p>
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Icon name="Sparkles" size={12} />
            <span>Strategies + examples included</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium">
            <span>Open lesson</span>
            <Icon name="ArrowRight" size={12} />
          </span>
        </div>
      </Card>
    </Link>
  );
};

export default ListeningLessonCard;
