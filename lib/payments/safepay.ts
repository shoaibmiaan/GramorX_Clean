import crypto from 'node:crypto';

import { env } from '@/lib/env';
import type { Cycle, PlanKey } from './index';

export type SafepaySession = Readonly<{ url: string; sessionId: string }>;

export type SafepayStatus = 'succeeded' | 'pending' | 'failed' | 'cancelled';

export type SafepayNotification = Readonly<{
  sessionId: string | null;
  status: SafepayStatus;
  rawStatus?: string | null;
  reason?: string | null;
}>;

type InitiateSafepayInput = Readonly<{
  origin: string;
  plan: PlanKey;
  cycle: Cycle;
  amountCents: number;
  currency: 'PKR' | 'USD';
  intentId: string;
  customerEmail?: string | null;
  customerName?: string | null;
}>;

const DEFAULTS = {
  sandbox: {
    apiBase: 'https://sandbox.api.getsafepay.com',
    checkoutBase: 'https://sandbox.getsafepay.com/checkout',
  },
  production: {
    apiBase: 'https://api.getsafepay.com',
    checkoutBase: 'https://getsafepay.com/checkout',
  },
} as const;

const SAFEPAY_ENV = env.SAFEPAY_ENV === 'production' ? 'production' : 'sandbox';

function getApiBase(): string {
  return env.SAFEPAY_API_BASE_URL || DEFAULTS[SAFEPAY_ENV].apiBase;
}

function getCheckoutBase(): string {
  const base = env.SAFEPAY_CHECKOUT_BASE_URL || DEFAULTS[SAFEPAY_ENV].checkoutBase;
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

function roundCentsToMajor(cents: number): number {
  return Math.round((cents / 100) * 100) / 100;
}

function toBooleanFlag(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;
    if (['true', '1', 'yes', 'y', 'success', 'paid', 'completed'].includes(normalized)) return true;
    if (['false', '0', 'no', 'n', 'failed', 'cancelled', 'canceled'].includes(normalized)) return false;
  }
  return null;
}

const successTokens = ['success', 'succeed', 'succeeded', 'complete', 'completed', 'paid', 'approved', 'authorized', 'captured'];
const pendingTokens = ['pending', 'await', 'processing', 'initiated', 'created', 'incomplete'];
const cancelledTokens = ['cancel', 'void', 'abandon'];
const failedTokens = ['fail', 'declin', 'error', 'reject'];

function collectStatusStrings(payload: Record<string, unknown>): string[] {
  const candidates: unknown[] = [
    payload.status,
    payload.state,
    payload.order_status,
    payload.payment_status,
    payload.charge_status,
    payload.result,
    payload.reason,
  ];
  const normalized: string[] = [];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      normalized.push(value.trim().toLowerCase());
    }
  }
  return normalized;
}

export function interpretSafepayNotification(payload: Record<string, unknown>): SafepayNotification {
  const sessionId = String(
    (payload.tracker ?? payload.beacon ?? payload.token ?? payload.orderId ?? payload.order_id ?? payload.sessionId ?? '') ||
      '',
  ).trim();

  const statusStrings = collectStatusStrings(payload);
  let status: SafepayStatus = 'pending';

  const hasToken = (tokens: readonly string[]) =>
    statusStrings.some((value) => tokens.some((token) => value.includes(token)));

  if (hasToken(cancelledTokens)) {
    status = 'cancelled';
  } else if (hasToken(failedTokens)) {
    status = 'failed';
  } else if (hasToken(successTokens)) {
    status = 'succeeded';
  } else if (hasToken(pendingTokens)) {
    status = 'pending';
  }

  const successFlag = toBooleanFlag(payload.success ?? payload.completed ?? payload.paid);
  if (successFlag === true) {
    status = 'succeeded';
  }

  const failureFlag = toBooleanFlag(payload.failed ?? payload.error);
  if (failureFlag === true) {
    status = 'failed';
  }

  const cancelFlag = toBooleanFlag(payload.cancelled ?? payload.canceled);
  if (cancelFlag === true) {
    status = 'cancelled';
  }

  const rawStatus = statusStrings[0] ?? null;
  const reason = typeof payload.message === 'string' ? payload.message : rawStatus;

  return { sessionId: sessionId || null, status, rawStatus, reason: reason || null };
}

export function isSafepayConfigured(): boolean {
  return Boolean(env.SAFEPAY_PUBLIC_KEY && env.SAFEPAY_SECRET_KEY);
}

export function devSafepaySession(origin: string, plan: PlanKey, _cycle: Cycle): SafepaySession {
  const sid = `sp_dev_${Date.now()}`;
  const url = new URL('/account/billing', origin);
  url.searchParams.set('provider', 'safepay');
  url.searchParams.set('setup', '1');
  url.searchParams.set('plan', plan);
  return { url: url.toString(), sessionId: sid };
}

function buildCheckoutUrl(sessionId: string, params: { orderId: string; redirectUrl: string; cancelUrl: string }): string {
  const base = `${getCheckoutBase()}/${encodeURIComponent(sessionId)}`;
  const url = new URL(base);
  url.searchParams.set('source', 'custom');
  url.searchParams.set('env', SAFEPAY_ENV);
  url.searchParams.set('order_id', params.orderId);
  url.searchParams.set('redirect_url', params.redirectUrl);
  url.searchParams.set('cancel_url', params.cancelUrl);
  return url.toString();
}

/** Initiate a Safepay payment session */
export async function initiateSafepay(input: InitiateSafepayInput): Promise<SafepaySession> {
  if (env.NEXT_PUBLIC_DEV_PAYMENTS) {
    return devSafepaySession(input.origin, input.plan, input.cycle);
  }

  if (!isSafepayConfigured()) {
    throw new Error('Safepay is not configured. Set SAFEPAY_PUBLIC_KEY and SAFEPAY_SECRET_KEY.');
  }

  const amount = roundCentsToMajor(input.amountCents);
  const orderId = `gx_${input.intentId}`;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (env.SAFEPAY_SECRET_KEY) {
    headers.Authorization = `Bearer ${env.SAFEPAY_SECRET_KEY}`;
  }

  const payload: Record<string, unknown> = {
    environment: SAFEPAY_ENV,
    client: env.SAFEPAY_PUBLIC_KEY,
    amount,
    currency: input.currency,
    order_id: orderId,
    source: 'custom',
  };

  const customer: Record<string, string> = {};
  if (input.customerEmail) customer.email = input.customerEmail;
  if (input.customerName) customer.name = input.customerName;
  if (Object.keys(customer).length > 0) {
    payload.customer = customer;
  }

  const response = await fetch(`${getApiBase()}/order/v1/init`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Safepay order init failed (${response.status})`);
  }

  const json = (await response.json()) as { data?: { token?: string; tracker?: string; order_id?: string } };
  const sessionId = String(json?.data?.token || json?.data?.tracker || '').trim();
  if (!sessionId) {
    throw new Error('Safepay response missing session token');
  }

  const redirectUrl = `${input.origin}/api/payments/webhooks/safepay?plan=${encodeURIComponent(
    input.plan,
  )}&cycle=${encodeURIComponent(input.cycle)}&intent=${encodeURIComponent(input.intentId)}`;
  const cancelUrl = `${input.origin}/account/billing?provider=safepay&status=cancelled&plan=${encodeURIComponent(
    input.plan,
  )}`;

  return {
    sessionId,
    url: buildCheckoutUrl(sessionId, { orderId, redirectUrl, cancelUrl }),
  };
}

/** Verify Safepay payment notification/webhook */
export async function verifySafepay(payload: unknown): Promise<boolean> {
  if (env.NEXT_PUBLIC_DEV_PAYMENTS) {
    return true;
  }

  if (!isSafepayConfigured()) {
    return false;
  }

  const data = payload as Record<string, unknown> | null;
  const tracker = String((data?.tracker ?? data?.beacon ?? data?.token ?? '') || '').trim();
  const signature = String((data?.sig ?? data?.signature ?? data?.order_signature ?? '') || '').trim();
  if (!tracker || !signature) {
    return false;
  }

  const expected = crypto.createHmac('sha256', env.SAFEPAY_SECRET_KEY as string).update(tracker).digest('hex');
  return expected === signature;
}
