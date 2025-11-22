// components/listening/Analytics/AttemptsHistoryTable.tsx
import * as React from 'react';
import Link from 'next/link';

import { Card } from '@/components/design-system/Card';
import Icon from '@/components/design-system/Icon';

type AttemptsHistoryRow = {
  attemptId: string;
  createdAt: string; // ISO
  mode: 'practice' | 'mock';
  testTitle: string;
  bandScore: number | null;
  rawScore: number | null;
  maxScore: number | null;
};

type Props = {
  rows: AttemptsHistoryRow[];
};

function formatDate(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const AttemptsHistoryTable: React.FC<Props> = ({ rows }) => {
  if (!rows.length) {
    return (
      <Card className="border-border bg-card/60 p-4 text-xs text-muted-foreground sm:text-sm">
        You haven&apos;t completed any listening attempts yet. Start with one practice test or a
        full mock, then come back here.
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/60 p-0">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon name="History" size={16} className="text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            Attempts history
          </h2>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Click any row to deep-dive that attempt.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs text-muted-foreground sm:text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-[11px] uppercase tracking-wide">
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium">Mode</th>
              <th className="px-4 py-2 font-medium">Test</th>
              <th className="px-4 py-2 font-medium">Band</th>
              <th className="px-4 py-2 font-medium">Score</th>
              <th className="px-4 py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.attemptId}
                className="border-b border-border/60 last:border-b-0 hover:bg-muted/40"
              >
                <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                  {formatDate(row.createdAt)}
                </td>
                <td className="px-4 py-2 align-middle text-[11px] text-muted-foreground">
                  {row.mode === 'mock' ? 'Mock' : 'Practice'}
                </td>
                <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                  {row.testTitle}
                </td>
                <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                  {row.bandScore != null ? row.bandScore.toFixed(1) : '—'}
                </td>
                <td className="px-4 py-2 align-middle text-xs text-foreground sm:text-sm">
                  {row.rawScore != null && row.maxScore != null
                    ? `${row.rawScore}/${row.maxScore}`
                    : '—'}
                </td>
                <td className="px-4 py-2 align-middle text-right">
                  <Link
                    href={`/listening/analytics/${encodeURIComponent(
                      row.attemptId,
                    )}`}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                  >
                    <span>View</span>
                    <Icon name="ArrowRight" size={11} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default AttemptsHistoryTable;
