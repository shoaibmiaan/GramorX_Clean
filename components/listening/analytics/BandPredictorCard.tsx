// components/listening/analytics/BandPredictorCard.tsx
import { Card } from '@/components/design-system/Card';
import { Icon } from '@/components/design-system/Icon';

type Attempt = {
  rawScore: number;
  totalQuestions: number;
  bandScore: number | null;
  createdAt: string;
};

type Props = {
  attempts: Attempt[];
};

export function BandPredictorCard({ attempts }: Props) {
  const recent = attempts.slice(0, 5);
  if (recent.length === 0) {
    return (
      <Card className="p-6 rounded-ds-2xl bg-card/80 border border-border/60">
        <div className="flex items-center gap-3">
          <Icon name="TrendingUp" className="h-6 w-6 text-muted-foreground" />
          <div>
            <p className="text-small font-medium">Band Predictor</p>
            <p className="text-caption text-muted-foreground">Complete your first mock to see predictions</p>
          </div>
        </div>
      </Card>
    );
  }

  const lastBand = recent[0].bandScore?.toFixed(1) ?? '--';
  const avgBand = (recent.reduce((a, b) => a + (b.bandScore ?? 0), 0) / recent.filter(a => a.bandScore).length).toFixed(1);

  return (
    <Card className="p-6 rounded-ds-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium flex items-center gap-2">
          <Icon name="TrendingUp" className="h-5 w-5 text-primary" />
          Listening Band Predictor
        </h3>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-h1 font-bold text-primary">{lastBand}</p>
            <p className="text-caption text-muted-foreground">Latest</p>
          </div>
          <div className="text-center">
            <p className="text-h1 font-bold text-primary">{avgBand}</p>
            <p className="text-caption text-muted-foreground">Recent Avg (last 5)</p>
          </div>
        </div>

        <div className="flex justify-center gap-1">
          {recent.map((a, i) => (
            <div
              key={i}
              className={`h-8 w-8 rounded-full flex items-center justify-center text-caption font-medium transition-all ${
                a.bandScore
                  ? a.bandScore >= 7
                    ? 'bg-success text-white'
                    : a.bandScore >= 6
                    ? 'bg-warning text-white'
                    : 'bg-orange-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {a.bandScore ? a.bandScore.toFixed(1) : '--'}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}