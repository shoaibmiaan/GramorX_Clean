import type { EvalInput, EvalProvider, ProviderResult } from './types';
import { buildWritingEvalPrompt } from './prompt';
import { safeJsonParse } from './json';
import { WritingEvaluationJsonSchema } from '../evalJsonSchema';

type GeminiResp = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

export function geminiProvider(params?: { model?: string }): EvalProvider {
  const model = params?.model ?? process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

  return {
    name: 'fallback2',
    async evaluate(input: EvalInput): Promise<ProviderResult> {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return { ok: false, error: 'Missing GEMINI_API_KEY' };

      const { system, user } = buildWritingEvalPrompt(input);

      // Single user turn: include system instruction at top of text
      const prompt = `${system}\n\n${user}`;

      const body = {
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: WritingEvaluationJsonSchema,
        },
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        model,
      )}:generateContent`;

      try {
        const r = await fetch(url, {
          method: 'POST',
          headers: {
            'x-goog-api-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const rawText = await r.text();
        if (!r.ok) return { ok: false, error: `Gemini HTTP ${r.status}: ${rawText}`, rawText };

        const parsed = JSON.parse(rawText) as GeminiResp;
        const text = String(parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim();
        if (!text) return { ok: false, error: 'Gemini returned empty text', rawText };

        const js = safeJsonParse(text);
        if (!js.ok) return { ok: false, error: js.error, rawText: text };

        return { ok: true, json: js.json, rawText: text };
      } catch (e) {
        return { ok: false, error: `Gemini request failed: ${(e as Error).message}` };
      }
    },
  };
}
