import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Alert } from '@/components/design-system/Alert';
import { Icon } from '@/components/design-system/Icon';

export type QuotaRow = {
  usage_key: string;
  used: number;
  limit: number | null; // null = unlimited
};

export type QuotaSummaryProps = {
  plan: string;               // e.g., 'free' | 'starter' | ...
  monthISO: string | null;    // YYYY-MM-DD (first of month) or null for current
  rows: QuotaRow[];
  reason?: 'plan_required' | 'quota_limit' | 'trial_ended' | 'unknown';
  needPlan?: string;
  sourcePath?: string;
};

const PLAN_LABEL: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  booster: 'Booster',
  master: 'Master',
};

const FEATURE_LABEL: Record<string, string> = {
  writing_mock_attempts: 'Writing Mock Attempts',
  writing_feedback_ai: 'AI Writing Feedback',
  speaking_mock_attempts: 'Speaking Mock Attempts',
  // add more keys you expose to users
};

function fmtRemaining(limit: number | null, used: number) {
  if (limit === null) return '∞';
  const rem = Math.max(0, limit - used);
  return `${rem}`;
}

export const QuotaSummary: React.FC<QuotaSummaryProps> = ({
  plan,
  monthISO,
  rows,
  reason,
  needPlan,
  sourcePath,
}) => {
  const monthNote = monthISO
    ? new Date(monthISO).toLocaleString(undefined, { month: 'long', year: 'numeric' })
    : 'This month';

  const reasonBlock = (() => {
    if (!reason) return null;
    if (reason === 'plan_required') {
      const planPretty = (PLAN_LABEL[needPlan ?? ''] ?? (needPlan ?? 'a higher plan'));
      return (
        <Alert variant="info" icon={<Icon name="info" />} title="Access required">
          The action you tried needs <strong>{planPretty}</strong>.{` `}
          {sourcePath ? <>Source: <code>{decodeURIComponent(sourcePath)}</code>.</> : null}
        </Alert>
      );
    }
    if (reason === 'quota_limit') {
      return (
        <Alert variant="warning" icon={<Icon name="warning" />} title="Quota reached">
          You’ve hit your monthly quota for one or more features.{` `}
          {sourcePath ? <>Source: <code>{decodeURIComponent(sourcePath)}</code>.</> : null}
        </Alert>
      );
    }
    if (reason === 'trial_ended') {
      return (
        <Alert variant="neutral" icon={<Icon name="clock" />} title="Trial ended">
          Your trial has ended. Choose a plan below to continue.
        </Alert>
      );
    }
    return (
      <Alert variant="neutral" icon={<Icon name="info" />} title="Why you’re here">
        Your current access doesn’t cover the requested action.
      </Alert>
    );
  })();

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between gap-3 p-4 md:p-6">
        <div>
          <h2 className="text-xl font-semibold">Your plan & usage</h2>
          <p className="text-sm opacity-80">{monthNote}</p>
        </div>
        <Badge>{PLAN_LABEL[plan] ?? plan}</Badge>
      </div>

      <div className="px-4 md:px-6 pb-4 md:pb-6">
        {reasonBlock}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Feature</th>
                <th className="py-2 pr-4">Used</th>
                <th className="py-2 pr-4">Limit</th>
                <th className="py-2">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center opacity-70">
                    No quota data yet.
                  </td>
                </tr>
              ) : (
                rows.map((r) => {
                  const feature = FEATURE_LABEL[r.usage_key] ?? r.usage_key;
                  return (
                    <tr key={r.usage_key} className="border-b last:border-0">
                      <td className="py-2 pr-4">{feature}</td>
                      <td className="py-2 pr-4">{r.used}</td>
                      <td className="py-2 pr-4">{r.limit === null ? '∞' : r.limit}</td>
                      <td className="py-2">{fmtRemaining(r.limit, r.used)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};
