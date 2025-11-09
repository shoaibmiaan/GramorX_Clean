// components/reading/ReadingForecastPanel.tsx
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import { Skeleton } from '@/components/design-system/Skeleton';

type ForecastPayload = {
  bandNow: number;
  currentPct: number;
  targetBand: number;
  etaDays: number | null;
  confidence: 'low' | 'med' | 'high';
  rationale: string;
};

export const ReadingForecastPanel: React.FC<{ targetBand?: number }> = ({ targetBand = 7.0 }) => {
  const [data, setData] = useState<ForecastPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const r = await fetch(`/api/reading/forecast?target=${targetBand}`);
        const j = await r.json();
        if (!cancelled) setData(j);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [targetBand]);

  if (loading) {
    return (
      <Card className="p-5">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-3 h-3 w-2/3" />
      </Card>
    );
  }

  if (!data) return null;

  const confVariant = data.confidence === 'high' ? 'success' : data.confidence === 'med' ? 'info' : 'warning';

  return (
    <Card className="p-5 border-border/60 bg-white/70 backdrop-blur dark:bg-dark/70">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold inline-flex items-center gap-2">
          <Icon name="TrendingUp" /> Forecast
        </h3>
        <Badge variant={confVariant} size="sm">{data.confidence} conf.</Badge>
      </div>
      <div className="mt-2 text-sm">
        Current: <span className="font-semibold">Band {data.bandNow.toFixed(1)}</span>
        {` → Target ${data.targetBand.toFixed(1)} `}
        {data.etaDays === null ? (
          <span className="text-muted-foreground">• improve slope to reach target</span>
        ) : (
          <span className="font-semibold">in ~{data.etaDays} days</span>
        )}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{data.rationale}</div>
      <div className="mt-3">
        <a href="/reading?type=tfng" className="inline-flex">
          <Button variant="surface" size="sm" className="rounded-ds-xl">Boost slope: weakest type drill</Button>
        </a>
      </div>
    </Card>
  );
};
