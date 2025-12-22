import * as React from "react";

import { Card } from "@/components/design-system/Card";
import { Badge } from "@/components/design-system/Badge";
import { Icon } from "@/components/design-system/Icon";

export type SectionAccuracy = {
  section: number;
  total: number;
  correct: number;
};

export type TypeAccuracy = {
  type: string;
  label: string;
  total: number;
  correct: number;
};

export type BandPoint = {
  attemptId: string;
  band: number | null;
  createdAt: string;
};

export type ListeningAnalytics = {
  attemptsWithScores: number;
  averageBand: number | null;
  sectionAccuracy: SectionAccuracy[];
  typeAccuracy: TypeAccuracy[];
  bandTrend: BandPoint[];
};

type Props = {
  analytics: ListeningAnalytics;
};

const pct = (correct: number, total: number) => {
  if (!total) return 0;
  return Math.round((correct / total) * 100);
};

export default function DrillBreakdown({ analytics }: Props) {
  const { sectionAccuracy, typeAccuracy, bandTrend, averageBand, attemptsWithScores } =
    analytics;

  const hasTrend = bandTrend.length > 0;
  const hasSection = sectionAccuracy.length > 0;
  const hasTypes = typeAccuracy.length > 0;

  return (
    <Card className="rounded-ds-2xl border border-border/60 bg-card/80 p-5 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="space-y-1">
          <Badge size="xs" variant="outline">
            Analytics
          </Badge>
          <h2 className="font-slab text-h4">Listening analytics & weak spots</h2>
          <p className="text-caption text-muted-foreground max-w-2xl">
            Band trend, section accuracy, and which question types are pulling your score down.
          </p>
        </div>

        <div className="flex items-center gap-3 text-small">
          <div className="flex flex-col text-right">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Attempts (scored)
            </span>
            <span className="font-semibold text-foreground">{attemptsWithScores}</span>
          </div>
          <div className="h-10 w-px bg-border/70" />
          <div className="flex flex-col text-right">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              Avg band
            </span>
            <span className="font-semibold text-foreground">{averageBand ?? "—"}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-small font-semibold">
            <Icon name="Target" size={16} className="text-muted-foreground" />
            Section accuracy
          </div>
          <div className="space-y-2 text-caption text-muted-foreground">
            {hasSection ? (
              sectionAccuracy.map((s) => (
                <div key={s.section} className="flex items-center justify-between rounded-ds-xl border border-border/50 bg-muted/40 px-3 py-2">
                  <span className="text-foreground font-medium">Section {s.section}</span>
                  <span className="text-foreground font-semibold">
                    {pct(s.correct, s.total)}% ({s.correct}/{s.total})
                  </span>
                </div>
              ))
            ) : (
              <p>No section data yet.</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-small font-semibold">
            <Icon name="ListChecks" size={16} className="text-muted-foreground" />
            Accuracy by type
          </div>
          <div className="space-y-2 text-caption text-muted-foreground">
            {hasTypes ? (
              typeAccuracy.slice(0, 6).map((t) => (
                <div key={t.type} className="flex items-center justify-between rounded-ds-xl border border-border/50 bg-muted/40 px-3 py-2">
                  <div className="flex flex-col">
                    <span className="text-foreground font-medium">{t.label}</span>
                    <span className="text-[11px] text-muted-foreground">{t.total} questions</span>
                  </div>
                  <span className="text-foreground font-semibold">{pct(t.correct, t.total)}%</span>
                </div>
              ))
            ) : (
              <p>Finish a mock to unlock type accuracy.</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-small font-semibold">
            <Icon name="TrendingUp" size={16} className="text-muted-foreground" />
            Band trend
          </div>
          <div className="space-y-2 text-caption text-muted-foreground">
            {hasTrend ? (
              bandTrend.map((b) => (
                <div key={b.attemptId} className="flex items-center justify-between rounded-ds-xl border border-border/50 bg-muted/40 px-3 py-2">
                  <span className="text-foreground font-medium">
                    {new Date(b.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-foreground font-semibold">Band {b.band ?? "—"}</span>
                </div>
              ))
            ) : (
              <p>Do a strict mock to see your trend.</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
