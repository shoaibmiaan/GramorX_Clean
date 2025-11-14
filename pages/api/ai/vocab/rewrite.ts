// pages/api/ai/vocab/rewrite.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
// import type { Database } from '@/types/supabase'; // if you have it, uncomment & use generic below

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type RewriteRequestBody = {
  text?: string;
  bandTarget?: string;
  module?: 'writing' | 'speaking';
};

type RewriteResponse = {
  improved: string;
  explanation?: string;
  keyPhrases?: string[];
};

type ErrorResponse = {
  error: string;
};

const MAX_LENGTH = 800;

// global simple quota for now
const MAX_REWRITES_PER_DAY = 20;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RewriteResponse | ErrorResponse>,
): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 1) Supabase auth
  // const supabase = createPagesServerClient<Database>({ req, res });
  const supabase = createPagesServerClient({ req, res });

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      // eslint-disable-next-line no-console
      console.error('[vocab/rewrite] auth getUser error:', userError);
    }

    if (!user) {
      return res
        .status(401)
        .json({ error: 'You must be logged in to use the AI vocab lab.' });
    }

    const userId = user.id;

    if (!process.env.OPENAI_API_KEY) {
      return res
        .status(500)
        .json({ error: 'OPENAI_API_KEY is not configured on the server.' });
    }

    let body: RewriteRequestBody;
    try {
      body = req.body as RewriteRequestBody;
    } catch {
      return res.status(400).json({ error: 'Invalid JSON body.' });
    }

    const text = (body.text ?? '').trim();
    const bandTarget = (body.bandTarget ?? '7.0').toString();
    const moduleType: 'writing' | 'speaking' =
      body.module === 'speaking' ? 'speaking' : 'writing';

    if (!text) {
      return res.status(400).json({ error: 'Please provide `text` in the request body.' });
    }

    if (text.length > MAX_LENGTH) {
      return res.status(400).json({
        error: `Text too long. Keep it under ${MAX_LENGTH} characters.`,
      });
    }

    // 2) Simple per-user per-day quota via view
    // v_ai_vocab_rewrite_usage_today defined in SQL
    const { data: usageRow, error: usageError } = await supabase
      .from('v_ai_vocab_rewrite_usage_today')
      .select('rewrites_today')
      .eq('user_id', userId)
      .maybeSingle();

    if (usageError) {
      // eslint-disable-next-line no-console
      console.error('[vocab/rewrite] usage view error:', usageError);
      // don’t block if view fails; just log it and continue
    }

    const usedToday = usageRow?.rewrites_today ?? 0;

    if (usedToday >= MAX_REWRITES_PER_DAY) {
      return res.status(429).json({
        error: `Daily limit reached. You can do up to ${MAX_REWRITES_PER_DAY} rewrites per day.`,
      });
    }

    // 3) Call OpenAI
    const systemPrompt = [
      'You are an IELTS expert and English writing coach.',
      'Your job is to rewrite learner sentences so they sound more natural and appropriate for IELTS.',
      '',
      'Rules:',
      '- Keep the original meaning the same.',
      '- Use vocabulary and grammar appropriate for the requested band, not crazy band 9 for everything.',
      `- The target band is approximately ${bandTarget}.`,
      `- The module is ${moduleType.toUpperCase()} (Writing or Speaking).`,
      '- For Speaking, keep it more natural/conversational, not robotic.',
      '- For Writing, keep it formal and academic, especially for Task 2.',
      '- If the original sentence is already good, make only small upgrades.',
      '',
      'You must respond as a single JSON object with this shape:',
      '{',
      '  "improved": "rewritten sentence or short paragraph",',
      '  "explanation": "short explanation of key improvements (max 3–4 lines)",',
      '  "keyPhrases": ["phrase 1", "phrase 2", "phrase 3"]',
      '}',
      '',
      'Do NOT wrap the JSON in backticks. Do NOT add any commentary outside the JSON.',
    ].join('\n');

    const userPrompt = [
      'Original text:',
      text,
      '',
      'Target band: ' + bandTarget,
      'Module: ' + moduleType,
      'User id: ' + userId,
    ].join('\n');

    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 400,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return res.status(500).json({
        error: 'No response from AI.',
      });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[vocab/rewrite] JSON parse error:', err, 'raw:', raw);
      return res.status(500).json({
        error: 'Failed to parse AI response. Please try again.',
      });
    }

    const improved = (parsed.improved ?? '').toString().trim();
    const explanation = parsed.explanation ? parsed.explanation.toString() : undefined;
    const keyPhrases = Array.isArray(parsed.keyPhrases)
      ? parsed.keyPhrases
          .map((p: unknown) => (typeof p === 'string' ? p.trim() : ''))
          .filter(Boolean)
      : [];

    if (!improved) {
      return res.status(500).json({
        error: 'AI did not return an improved sentence.',
      });
    }

    const response: RewriteResponse = {
      improved,
      explanation,
      keyPhrases,
    };

    // 4) Log to ai_vocab_rewrites (fire and forget-ish)
    try {
      const { error: insertError } = await supabase.from('ai_vocab_rewrites').insert({
        user_id: userId,
        original_text: text,
        improved_text: improved,
        band_target: bandTarget,
        module: moduleType,
        model,
      });

      if (insertError) {
        // eslint-disable-next-line no-console
        console.error('[vocab/rewrite] insert log error:', insertError);
      }
    } catch (logErr) {
      // eslint-disable-next-line no-console
      console.error('[vocab/rewrite] logging error:', logErr);
      // don’t fail the response if logging fails
    }

    return res.status(200).json(response);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[vocab/rewrite] Fatal error:', err);

    if (err?.response?.status === 429) {
      return res.status(429).json({
        error: 'Rate limit reached. Try again in a moment.',
      });
    }

    return res.status(500).json({
      error: 'Unexpected error while rewriting. Please try again.',
    });
  }
}
