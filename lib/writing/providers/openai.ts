import type { EvalInput, EvalProvider, ProviderResult } from './types';
import { buildWritingEvalPrompt } from './prompt';
import { WritingEvaluationJsonSchema } from '../evalJsonSchema';

type OpenAIResponse = {
  output_text?: string;
  status?: string;
};

export function openaiProvider(params?: { model?: string }): EvalProvider {
  const model = params?.model ?? process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  return {
    name: 'primary',
    async evaluate(input: EvalInput): Promise<ProviderResult> {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) return { ok: false, error: 'Missing OPENAI_API_KEY' };

      const { system, user } = buildWritingEvalPrompt(input);

      const body = {
        model,
        input: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'writing_evaluation',
            strict: true,
            schema: WritingEvaluationJsonSchema,
          },
        },
      };

      try {
        const r = await fetch('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });

        const rawText = await r.text();

        if (!r.ok) return { ok: false, error: `OpenAI HTTP ${r.status}: ${rawText}`, rawText };

        const json = JSON.parse(rawText) as OpenAIResponse;

        // With structured outputs, output_text is the JSON string content.
        const out = String(json.output_text ?? '').trim();
        if (!out) return { ok: false, error: 'OpenAI returned empty output_text', rawText };

        return { ok: true, json: JSON.parse(out), rawText };
      } catch (e) {
        return { ok: false, error: `OpenAI request failed: ${(e as Error).message}` };
      }
    },
  };
}
