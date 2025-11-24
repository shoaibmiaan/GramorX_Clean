// lib/billing/manual.ts
import {
  PLANS,
  type PlanId,
  type Cycle,
  getPlanBillingAmount,
  CURRENCY_SYMBOL,
} from '@/lib/pricing';

export type ManualInvoiceInput = {
  userId: string;
  planId: PlanId;
  cycle: Cycle;
};

export type ManualInvoice = {
  userId: string;
  planId: PlanId;
  cycle: Cycle;
  amount: number;
  currencySymbol: string;
};

export function createManualInvoice(input: ManualInvoiceInput): ManualInvoice {
  const { userId, planId, cycle } = input;

  if (!PLANS[planId]) {
    throw new Error(`Unknown planId: ${planId}`);
  }

  const amount = getPlanBillingAmount(planId, cycle);

  return {
    userId,
    planId,
    cycle,
    amount,
    currencySymbol: CURRENCY_SYMBOL,
  };
}
