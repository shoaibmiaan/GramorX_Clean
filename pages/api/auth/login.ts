import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { redis } from '@/lib/redis';
import { evaluateRisk, riskThreshold } from '@/lib/risk';
import { incrementFlaggedLogin } from '@/lib/metrics';

const MAX_ATTEMPTS = 5;
const BLOCK_TIME_SEC = 60 * 15; // 15 minutes

function isNetworkError(err: unknown): boolean {
  const anyErr = err as { message?: string; code?: string; cause?: { code?: string } } | null;
  const message = (anyErr?.message ?? '').toLowerCase();
  const code = anyErr?.cause?.code ?? anyErr?.code ?? '';

  return (
    code === 'UND_ERR_CONNECT_TIMEOUT' ||
    code === 'ETIMEDOUT' ||
    code === 'ECONNRESET' ||
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN' ||
    message.includes('fetch failed') ||
    message.includes('connect timeout')
  );
}

function isInvalidCredsMessage(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes('invalid login credentials') ||
    m.includes('invalid credentials') ||
    m.includes('invalid email or password')
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const ipRaw = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  const ip = Array.isArray(ipRaw) ? ipRaw[0] : ipRaw.split(',')[0];
  const userAgent = req.headers['user-agent'] || '';

  const risk = await evaluateRisk({ ip, userAgent, email });
  if (risk.score >= riskThreshold) {
    console.warn('Login attempt flagged', { ip, userAgent, email, score: risk.score });
    incrementFlaggedLogin();
    return res.status(403).json({ error: 'Login blocked due to suspicious activity.' });
  }

  const key = `login:fail:${ip}`;

  const attemptsStr = await redis.get(key);
  const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
  if (attempts >= MAX_ATTEMPTS) {
    return res
      .status(429)
      .json({ error: 'Too many failed login attempts. Please try again later.' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      // Only count as a "failed attempt" if it is actually invalid credentials
      const msg = error?.message ?? '';

      if (isInvalidCredsMessage(msg) || !error) {
        await redis.incr(key);
        await redis.expire(key, BLOCK_TIME_SEC);
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // If Supabase returns a non-credential error, treat it as server-side auth failure
      return res.status(500).json({ error: 'Login failed. Please try again.' });
    }

    await redis.del(key);
    return res.status(200).json({ session: data.session });
  } catch (err) {
    // Internet / Supabase unreachable
    if (isNetworkError(err)) {
      return res.status(503).json({
        error: 'Network issue — cannot reach the auth server. Check internet and try again.',
        code: 'NETWORK',
      });
    }

    return res.status(500).json({ error: 'Unexpected error during login.' });
  }
}
