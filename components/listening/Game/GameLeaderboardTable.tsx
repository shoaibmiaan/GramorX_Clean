// components/listening/Game/GameLeaderboardTable.tsx
import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type Row = {
  rank: number;
  name: string;
  countryCode?: string;
  bandTarget?: number;
  xp: number;
  streakDays: number;
};

type Props = {
  rows: Row[];
};

const GameLeaderboardTable: React.FC<Props> = ({ rows }) => {
  if (!rows.length) {
    return (
      <Card className="border-border bg-card/60 p-4 text-xs text-muted-foreground sm:text-sm">
        No leaderboard data yet. Finish a few game rounds and you&apos;ll start appearing here.
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/60 p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon name="Trophy" size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Listening Game Leaderboard</h2>
        </div>
        <p className="text-[11px] text-muted-foreground">
          XP from game rounds only
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs text-muted-foreground sm:text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide">
              <th className="px-4 py-2 font-medium">Rank</th>
              <th className="px-4 py-2 font-medium">Student</th>
              <th className="px-4 py-2 font-medium">XP</th>
              <th className="px-4 py-2 font-medium">Streak</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isTop3 = row.rank <= 3;
              return (
                <tr
                  key={row.rank}
                  className="border-b border-border/60 last:border-b-0 hover:bg-muted/40"
                >
                  <td className="px-4 py-2 align-middle">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold text-foreground">
                        #{row.rank}
                      </span>
                      {isTop3 && (
                        <Icon
                          name={row.rank === 1 ? 'Crown' : 'Medal'}
                          size={14}
                          className="text-primary"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 align-middle">
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-foreground sm:text-sm">
                        {row.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {row.countryCode ? row.countryCode.toUpperCase() : 'Global'} ·
                        &nbsp;
                        {row.bandTarget ? `Target ${row.bandTarget.toFixed(1)}` : 'Target N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 align-middle">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                      <Icon name="Zap" size={12} />
                      <span>{row.xp.toLocaleString()} XP</span>
                    </span>
                  </td>
                  <td className="px-4 py-2 align-middle">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Icon name="Flame" size={12} />
                      <span>
                        {row.streakDays} day{row.streakDays !== 1 ? 's' : ''} streak
                      </span>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default GameLeaderboardTable;
