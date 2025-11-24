// lib/planQuotas.ts
// Human + machine readable quotas per plan. Keep this in sync with Supabase/RLS.

import type { PlanId } from '@/lib/pricing';
import { PlanIdEnum } from '@/lib/pricing';

export type PlanQuota = {
  mocksPerMonth: number | null; // null = effectively unlimited / fair usage
  aiEvaluationsPerMonth: number; // total AI scoring calls across modules
  whatsappReminders: boolean;
  teacherView: 'none' | 'planned' | 'priority';
};

export const PLAN_QUOTAS: Record<PlanId, PlanQuota> = {
  [PlanIdEnum.Free]: {
    mocksPerMonth: 3,
    aiEvaluationsPerMonth: 0,
    whatsappReminders: false,
    teacherView: 'none',
  },
  [PlanIdEnum.Starter]: {
    mocksPerMonth: 4,
    aiEvaluationsPerMonth: 20,
    whatsappReminders: true,
    teacherView: 'none',
  },
  [PlanIdEnum.Booster]: {
    mocksPerMonth: 12,
    aiEvaluationsPerMonth: 80,
    whatsappReminders: true,
    teacherView: 'planned',
  },
  [PlanIdEnum.Master]: {
    mocksPerMonth: null, // fair usage
    aiEvaluationsPerMonth: 200,
    whatsappReminders: true,
    teacherView: 'priority',
  },
};
