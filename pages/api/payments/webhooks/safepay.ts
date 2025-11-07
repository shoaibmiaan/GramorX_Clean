import type { NextApiHandler, NextApiRequest } from 'next';

import { finalizeLocalPayment } from '@/lib/payments/localWebhook';
import { interpretSafepayNotification, verifySafepay } from '@/lib/payments/safepay';

export const config = { api: { bodyParser: false } };

async function readBody(req: Parameters<NextApiHandler>[0]): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function parseQueryPayload(req: NextApiRequest): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(req.query)) {
    payload[key] = Array.isArray(value) ? value[0] : value;
  }
  return payload;
}

function buildStatusRedirect(
  status: 'pending' | 'failed' | 'cancelled' | 'error',
  plan?: string,
  reason?: string | null,
): string {
  const params = new URLSearchParams({ provider: 'safepay', status });
  if (plan) params.set('plan', plan);
  if (reason) params.set('reason', reason);
  return `/account/billing?${params.toString()}`;
}

const handler: NextApiHandler = async (req, res) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET,POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  let payload: Record<string, unknown> = {};

  if (req.method === 'GET') {
    payload = parseQueryPayload(req);
  } else {
    const raw = await readBody(req);
    const contentType = req.headers['content-type'] ?? '';
    try {
      if (contentType.includes('application/json')) {
        payload = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      } else {
        const params = new URLSearchParams(raw);
        payload = Object.fromEntries(params.entries());
      }
    } catch (error) {
      return res.status(400).json({ ok: false, error: 'invalid_body' });
    }
  }

  let verified = false;
  try {
    verified = await verifySafepay(payload);
  } catch (error) {
    if (req.method === 'GET') {
      return res.redirect(302, buildStatusRedirect('error', undefined, 'verification_failed'));
    }
    return res.status(400).json({ ok: false, error: 'verification_failed' });
  }

  if (!verified) {
    if (req.method === 'GET') {
      return res.redirect(302, buildStatusRedirect('error', undefined, 'invalid_signature'));
    }
    return res.status(400).json({ ok: false, error: 'invalid_signature' });
  }

  const interpreted = interpretSafepayNotification(payload);
  if (!interpreted.sessionId) {
    if (req.method === 'GET') {
      return res.redirect(302, buildStatusRedirect('error', undefined, 'missing_session'));
    }
    return res.status(400).json({ ok: false, error: 'missing_session' });
  }

  const planParam = Array.isArray(req.query.plan) ? req.query.plan[0] : req.query.plan;
  const plan = typeof planParam === 'string' && planParam ? planParam : undefined;

  if (interpreted.status !== 'succeeded') {
    if (req.method === 'GET') {
      const redirect = buildStatusRedirect(interpreted.status, plan, interpreted.reason ?? interpreted.rawStatus ?? null);
      return res.redirect(302, redirect);
    }
    return res.status(200).json({ ok: true, status: interpreted.status, reason: interpreted.reason ?? null });
  }

  const result = await finalizeLocalPayment('safepay', interpreted.sessionId);
  if (!result.ok) {
    if (req.method === 'GET') {
      const redirect = buildStatusRedirect('error', plan, result.error);
      return res.redirect(302, redirect);
    }
    return res.status(result.status).json({ ok: false, error: result.error });
  }

  const effectivePlan = plan ?? result.intent.plan_id;
  const cycleParam = Array.isArray(req.query.cycle) ? req.query.cycle[0] : req.query.cycle;
  const cycle = typeof cycleParam === 'string' && cycleParam ? cycleParam : result.intent.cycle;
  const successPath = `/checkout/success?session_id=${encodeURIComponent(
    interpreted.sessionId,
  )}&plan=${encodeURIComponent(effectivePlan)}&provider=safepay&cycle=${encodeURIComponent(cycle)}`;

  if (req.method === 'GET') {
    return res.redirect(302, successPath);
  }

  return res
    .status(200)
    .json({ ok: true, status: 'succeeded', alreadyProcessed: result.alreadyProcessed, sessionId: interpreted.sessionId });
};

export default handler;
