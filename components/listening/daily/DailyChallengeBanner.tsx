// components/listening/daily/DailyChallengeBanner.tsx
import Link from 'next/link';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import { Badge } from '@/components/design-system/Badge';

type Props = {
  streakCurrent: number;
};

export function DailyChallengeBanner({ streakCurrent }: Props) {
  return (
    <Card className="overflow-hidden rounded-ds-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-6 shadow-lg">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/15">
            <Icon name="Headphones" className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-slab text-h3">
              Daily Listening Challenge
              {streakCurrent > 0 && (
                <Badge variant="accent" className="ml-3 text-caption">
                  {streakCurrent} day{streakCurrent > 1 ? 's' : ''} streak
                </Badge>
              )}
            </h3>
            <p className="text-small text-muted-foreground max-w-lg">
              Train your ear every day with a fresh 10-question mini-test. Keep your streak alive and watch your band climb!
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button asChild size="lg" variant="primary" className="rounded-ds-xl">
            <Link href="/mock/listening/daily">
              {streakCurrent > 0 ? 'Continue Today' : 'Start Challenge'}
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}