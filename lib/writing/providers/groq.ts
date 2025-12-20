import type { EvalInput, EvalProvider, ProviderResult } from './types';
import { buildWritingEvalPrompt } from './prompt';
import { safeJsonParse } from './json';

type GroqChatResponse = {
  choices?: Array<{ message?: { content?: string } }>;
};

export function groqProvider(params?: { model?: string }): EvalProvider {
  const model = params?.model ?? process.env.GROQ_MODEL ?? 'llama-3.1-8b-instant';

  return {
    name: 'fallback1',
    async evaluate(input: EvalInput): Promise<ProviderResult> {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) return { ok: false, error: 'Missing GROQ_API_KEY' };

      const { system, user } = buildWritingEvalPrompt(input);

      const body = {
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        // Groq is OpenAI-compatible; enforce JSON with prompting + extractor
      };

      try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const rawText = await r.text();
        if (!r.ok) return { ok: false, error: `Groq HTTP ${r.status}: ${rawText}`, rawText };

        const parsed = JSON.parse(rawText) as GroqChatResponse;
        const content = String(parsed.choices?.[0]?.message?.content ?? '').trim();
        if (!content) return { ok: false, error: 'Groq returned empty content', rawText };

        const js = safeJsonParse(content);
        if (!js.ok) return { ok: false, error: js.error, rawText: content };

        return { ok: true, json: js.json, rawText: content };
      } catch (e) {
        return { ok: false, error: `Groq request failed: ${(e as Error).message}` };
      }
    },
  };
}
