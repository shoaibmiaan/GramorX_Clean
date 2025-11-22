// components/listening/Game/GameModeCard.tsx
import * as React from 'react';
import Link from 'next/link';

import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';
import type { ListeningGameMode } from '@/lib/listening/game';

type Props = {
  mode: ListeningGameMode;
  title: string;
  description: string;
  href: string;
  estimatedMinutes?: number;
  recommendedLevel?: 'beginner' | 'intermediate' | 'advanced';
};

const modeIcon: Record<ListeningGameMode, string> = {
  fast_ear: 'Zap',
  clip_guess: 'Music2',
  keyword_hunt: 'Search',
};

const levelLabel: Record<NonNullable<Props['recommendedLevel']>, string> = {
  beginner: 'Beginner friendly',
  intermediate: 'Intermediate',
  advanced: 'Advanced grind',
};

const GameModeCard: React.FC<Props> = ({
  mode,
  title,
  description,
  href,
  estimatedMinutes,
  recommendedLevel,
}) => {
  return (
    <Link href={href} className="block">
      <Card className="flex h-full flex-col justify-between border-border bg-card/60 shadow-sm transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-md">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <Icon name={modeIcon[mode]} size={16} className="text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-foreground sm:text-base">
                {title}
              </h2>
              <Badge variant="neutral" size="sm">
                Game mode
              </Badge>
              {recommendedLevel && (
                <Badge variant="ghost" size="sm">
                  {levelLabel[recommendedLevel]}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              {description}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Icon name="Flame" size={12} />
            <span>Streak + XP booster</span>
          </span>
          <span className="inline-flex items-center gap-2">
            {estimatedMinutes && (
              <span className="inline-flex items-center gap-1 text-[11px]">
                <Icon name="Clock" size={11} />
                <span>~{estimatedMinutes} min</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium">
              <span>Play</span>
              <Icon name="ArrowRight" size={12} />
            </span>
          </span>
        </div>
      </Card>
    </Link>
  );
};

export default GameModeCard;
