// components/listening/ListeningForecastPanel.tsx
import { Card } from '@/components/design-system/Card';
import { Icon } from '@/components/design-system/Icon';

export function ListeningForecastPanel() {
  return (
    <Card className="p-5 rounded-ds-2xl bg-card/80 border border-border/60">
      <div className="flex items-center gap-3 mb-4">
        <Icon name="Zap" className="h-6 w-6 text-primary" />
        <h3 className="font-medium">Forecast</h3>
      </div>

      <div className="space-y-3 text-small">
        <div className="flex justify-between">
          <span className="text-muted-foreground">7-day projection</span>
          <span className="font-semibold text-primary">+0.5 band</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">With daily practice</span>
          <span className="font-semibold">7.5 in 3 weeks</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border/50 text-caption text-muted-foreground">
        Based on your current pace and consistency
      </div>
    </Card>
  );
}