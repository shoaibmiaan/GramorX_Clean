// components/listening/ListeningBandCard.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Icon } from '@/components/design-system/Icon';

type AttemptInfo = {
  latestBandScore: number | null;
  latestCreatedAt: string | null;
};

type ListeningBandCardProps = {
  attempts: AttemptInfo[];
};

export const ListeningBandCard: React.FC<ListeningBandCardProps> = ({ attempts }) => {
  if (!attempts || attempts.length === 0) {
    return (
      <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-4 text-xs">
        <p className="text-[11px] uppercase font-semibold tracking-wide text-muted-foreground mb-2">
          Listening Band Snapshot
        </p>
        <p className="text-xs text-muted-foreground">
          Take your first full Listening mock to unlock band tracking and improvement
          insights.
        </p>
      </Card>
    );
  }

  const bands = attempts
    .map((a) => (a.latestBandScore != null ? Number(a.latestBandScore) : null))
    .filter((v): v is number => typeof v === 'number');

  const best = bands.length ? Math.max(...bands) : null;
  const latest = bands.length ? bands[0] : null;
  const avg =
    bands.length > 0
      ? Math.round((bands.reduce((acc, b) => acc + b, 0) / bands.length) * 10) / 10
      : null;

  const lastDate =
    attempts[0]?.latestCreatedAt != null
      ? new Date(attempts[0].latestCreatedAt).toLocaleDateString()
      : null;

  return (
    <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-4 text-xs space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase font-semibold tracking-wide text-muted-foreground">
            Listening Band Snapshot
          </p>
          <p className="text-[11px] text-muted-foreground">
            Based on your recent full Listening mocks.
          </p>
        </div>
        <Badge size="xs" variant="neutral">
          {attempts.length} attempt{attempts.length === 1 ? '' : 's'}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <BandStat label="Latest band" value={latest ?? '--'} icon="Headphones" />
        <BandStat label="Best band" value={best ?? '--'} icon="Sparkles" />
        <BandStat label="Avg band" value={avg ?? '--'} icon="TrendingUp" />
      </div>

      {lastDate && (
        <p className="text-[11px] text-muted-foreground">
          Last Listening mock: <span className="font-medium">{lastDate}</span>
        </p>
      )}
    </Card>
  );
};

const BandStat = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon: string;
}) => (
  <div className="rounded-ds-xl border border-border/60 bg-muted/40 px-3 py-2">
    <p className="inline-flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
      <Icon name={icon} className="h-3 w-3" />
      {label}
    </p>
    <p className="mt-1 text-base font-semibold">{value}</p>
  </div>
);
