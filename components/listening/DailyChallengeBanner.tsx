// components/listening/DailyChallengeBanner.tsx
import * as React from 'react';
import Link from 'next/link';

import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { Icon } from '@/components/design-system/Icon';

type DailyChallengeBannerProps = {
  streakCurrent: number;
};

export const DailyChallengeBanner: React.FC<DailyChallengeBannerProps> = ({
  streakCurrent,
}) => {
  const streakLabel =
    streakCurrent <= 0
      ? 'No streak yet'
      : streakCurrent === 1
      ? '1-day streak'
      : `${streakCurrent}-day streak`;

  return (
    <Card className="relative overflow-hidden rounded-ds-2xl border border-border/60 bg-card/90 px-5 py-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5 md:max-w-xl">
          <div className="flex items-center gap-2">
            <Badge size="xs" variant="accent" className="rounded-ds-full">
              <Icon name="Flame" className="mr-1 h-3.5 w-3.5" />
              Listening Streak
            </Badge>
            <span className="text-[11px] text-muted-foreground">{streakLabel}</span>
          </div>

          <h2 className="font-slab text-base md:text-lg">
            Daily Listening Challenge — 15 minutes to keep the streak alive.
          </h2>
          <p className="text-xs text-muted-foreground">
            One short Listening set every day. Keep the streak, keep your ears tuned to
            IELTS audio speed and accent patterns.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <Button
            asChild
            size="sm"
            variant="primary"
            className="rounded-ds-xl px-4 text-xs font-semibold"
          >
            <Link href="/mock/listening/daily">
              Start today&apos;s challenge
              <Icon name="ArrowRight" className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Icon name="Clock" className="h-3.5 w-3.5" />
            <span>~15 mins • auto-timer • band-aware tasks</span>
          </div>
        </div>
      </div>

      {/* subtle background accent */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
    </Card>
  );
};
