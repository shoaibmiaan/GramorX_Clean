// components/sections/PricingComparison.tsx
import * as React from 'react';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

import { PLAN_LABEL, PlanId, PlanIdEnum } from '@/lib/pricing';
import { PLAN_QUOTAS } from '@/lib/planQuotas';

type FeatureKey =
  | 'mocksPerMonth'
  | 'aiEvaluationsPerMonth'
  | 'aiFeedback'
  | 'modulesIncluded'
  | 'analyticsDepth'
  | 'streaksAndGamification'
  | 'whatsappReminders'
  | 'teacherView'
  | 'multiDevice'
  | 'support';

type FeatureRow = {
  key: FeatureKey;
  label: string;
  description: string;
  group: 'Usage' | 'AI & Analytics' | 'Support & Access';
  availability: Record<PlanId, string | boolean>;
};

const PLAN_ORDER: PlanId[] = [
  PlanIdEnum.Free,
  PlanIdEnum.Starter,
  PlanIdEnum.Booster,
  PlanIdEnum.Master,
];

// Helper: derive label from numeric mocks quota
const formatMocks = (planId: PlanId): string => {
  const q = PLAN_QUOTAS[planId].mocksPerMonth;
  if (q === null) return 'Heavy usage (fair limits)';
  if (q <= 0) return 'None';
  if (q <= 3) return `${q} / month`;
  if (q <= 10) return `${q} / month`;
  return `${q}+ / month`;
};

const formatAiCalls = (planId: PlanId): string => {
  const q = PLAN_QUOTAS[planId].aiEvaluationsPerMonth;
  if (q <= 0) return 'None';
  if (q <= 20) return 'Light usage';
  if (q <= 80) return 'Regular usage';
  return 'Max practical usage';
};

const formatWhatsapp = (planId: PlanId): boolean => {
  return PLAN_QUOTAS[planId].whatsappReminders;
};

const formatTeacherView = (planId: PlanId): string | boolean => {
  const tv = PLAN_QUOTAS[planId].teacherView;
  if (tv === 'none') return false;
  if (tv === 'planned') return 'Planned';
  return 'Priority access';
};

const FEATURES: FeatureRow[] = [
  {
    key: 'mocksPerMonth',
    label: 'Mock tests per month',
    description: 'Full IELTS mocks you can realistically run.',
    group: 'Usage',
    availability: {
      [PlanIdEnum.Free]: formatMocks(PlanIdEnum.Free),
      [PlanIdEnum.Starter]: formatMocks(PlanIdEnum.Starter),
      [PlanIdEnum.Booster]: formatMocks(PlanIdEnum.Booster),
      [PlanIdEnum.Master]: formatMocks(PlanIdEnum.Master),
    },
  },
  {
    key: 'modulesIncluded',
    label: 'IELTS modules included',
    description: 'Listening, Reading, Writing, Speaking coverage.',
    group: 'Usage',
    availability: {
      [PlanIdEnum.Free]: 'Taster access to all',
      [PlanIdEnum.Starter]: '1 chosen module',
      [PlanIdEnum.Booster]: 'All 4 modules',
      [PlanIdEnum.Master]: 'All 4 modules',
    },
  },
  {
    key: 'streaksAndGamification',
    label: 'Streaks & gamification',
    description: 'Snapchat-style streaks, heatmaps, tokens.',
    group: 'Usage',
    availability: {
      [PlanIdEnum.Free]: 'Basic streak counter',
      [PlanIdEnum.Starter]: 'Streaks + simple heatmap',
      [PlanIdEnum.Booster]: 'Full streak engine + heatmap',
      [PlanIdEnum.Master]: 'Full engine + recovery tokens',
    },
  },
  {
    key: 'aiFeedback',
    label: 'AI feedback & scoring',
    description: 'Automated band score estimates and corrections.',
    group: 'AI & Analytics',
    availability: {
      [PlanIdEnum.Free]: false,
      [PlanIdEnum.Starter]: '1 module (e.g. Writing)',
      [PlanIdEnum.Booster]: 'All 4 modules',
      [PlanIdEnum.Master]: 'All 4 + faster queue',
    },
  },
  {
    key: 'aiEvaluationsPerMonth',
    label: 'AI evaluations per month',
    description: 'AI-powered scoring calls and feedback.',
    group: 'AI & Analytics',
    availability: {
      [PlanIdEnum.Free]: formatAiCalls(PlanIdEnum.Free),
      [PlanIdEnum.Starter]: formatAiCalls(PlanIdEnum.Starter),
      [PlanIdEnum.Booster]: formatAiCalls(PlanIdEnum.Booster),
      [PlanIdEnum.Master]: formatAiCalls(PlanIdEnum.Master),
    },
  },
  {
    key: 'analyticsDepth',
    label: 'Analytics & reports',
    description: 'Band trajectory, skill gaps, and trends.',
    group: 'AI & Analytics',
    availability: {
      [PlanIdEnum.Free]: 'Basic dashboard',
      [PlanIdEnum.Starter]: 'Per-module insights',
      [PlanIdEnum.Booster]: 'Cross-module analytics',
      [PlanIdEnum.Master]: 'Advanced, export-ready',
    },
  },
  {
    key: 'whatsappReminders',
    label: 'WhatsApp reminders',
    description: 'Nudges to keep your streak alive.',
    group: 'AI & Analytics',
    availability: {
      [PlanIdEnum.Free]: formatWhatsapp(PlanIdEnum.Free),
      [PlanIdEnum.Starter]: formatWhatsapp(PlanIdEnum.Starter),
      [PlanIdEnum.Booster]: formatWhatsapp(PlanIdEnum.Booster),
      [PlanIdEnum.Master]: formatWhatsapp(PlanIdEnum.Master),
    },
  },
  {
    key: 'multiDevice',
    label: 'Multi-device sync',
    description: 'Mobile + desktop continuity.',
    group: 'Support & Access',
    availability: {
      [PlanIdEnum.Free]: 'Limited sync',
      [PlanIdEnum.Starter]: 'Cross-device history',
      [PlanIdEnum.Booster]: 'Full sync, fast',
      [PlanIdEnum.Master]: 'Full sync + priority',
    },
  },
  {
    key: 'support',
    label: 'Support priority',
    description: 'How quickly we respond to you.',
    group: 'Support & Access',
    availability: {
      [PlanIdEnum.Free]: 'Community / docs',
      [PlanIdEnum.Starter]: 'Standard support',
      [PlanIdEnum.Booster]: 'Priority in-app support',
      [PlanIdEnum.Master]: 'Top priority lane',
    },
  },
  {
    key: 'teacherView',
    label: 'Teacher / coach view',
    description: 'Multi-student dashboards and insights.',
    group: 'Support & Access',
    availability: {
      [PlanIdEnum.Free]: formatTeacherView(PlanIdEnum.Free),
      [PlanIdEnum.Starter]: formatTeacherView(PlanIdEnum.Starter),
      [PlanIdEnum.Booster]: formatTeacherView(PlanIdEnum.Booster),
      [PlanIdEnum.Master]: formatTeacherView(PlanIdEnum.Master),
    },
  },
];

export const PricingComparisonSection: React.FC = () => {
  const grouped = React.useMemo(() => {
    const byGroup: Record<string, FeatureRow[]> = {};
    for (const feature of FEATURES) {
      if (!byGroup[feature.group]) byGroup[feature.group] = [];
      byGroup[feature.group].push(feature);
    }
    return byGroup;
  }, []);

  const groupsOrder: Array<FeatureRow['group']> = [
    'Usage',
    'AI & Analytics',
    'Support & Access',
  ];

  return (
    <section className="pb-16 pt-6">
      <Container>
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <Badge variant="muted">Compare plans</Badge>
            <h2 className="mt-3 text-h3 font-semibold">
              What actually changes when you upgrade?
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Free gets you into the cockpit. Booster and Master unlock full IELTS
              mission control: deeper analytics, more AI calls, more mocks.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-subtle px-4 py-3 text-xs font-medium text-muted-foreground">
                    Feature
                  </th>
                  {PLAN_ORDER.map((planId) => (
                    <th
                      key={planId}
                      className="border-b border-subtle px-4 py-3 text-xs font-medium text-muted-foreground"
                    >
                      {PLAN_LABEL[planId]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groupsOrder.map((group) => (
                  <React.Fragment key={group}>
                    {/* Group row */}
                    <tr className="bg-muted/60">
                      <td
                        colSpan={1 + PLAN_ORDER.length}
                        className="border-b border-subtle px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Icon name="sparkles" className="h-3 w-3" />
                          {group}
                        </span>
                      </td>
                    </tr>

                    {/* Features under group */}
                    {grouped[group]?.map((feature) => (
                      <tr key={feature.key} className="align-top">
                        <td className="border-b border-subtle px-4 py-3">
                          <div className="font-medium">{feature.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {feature.description}
                          </div>
                        </td>
                        {PLAN_ORDER.map((planId) => {
                          const value = feature.availability[planId];
                          const isBoolean = typeof value === 'boolean';
                          return (
                            <td
                              key={planId}
                              className="border-b border-subtle px-4 py-3"
                            >
                              {isBoolean ? (
                                value ? (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                                    <Icon name="check" className="h-3 w-3" />
                                    Included
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    —
                                  </span>
                                )
                              ) : (
                                <span className="text-xs text-foreground">
                                  {value}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Exact quotas and limits are enforced server-side using your active plan.
          This table is a human-readable overview, not a legal contract.
        </p>
      </Container>
    </section>
  );
};
