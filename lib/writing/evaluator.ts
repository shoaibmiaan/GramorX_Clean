import type { EvalInput, EvalProvider } from './providers/types';
import { parseAndValidateEval } from './validateEval';
import type { WritingEvaluation } from './evalSchema';

export async function runWritingEvaluation(
  input: EvalInput,
  providers: EvalProvider[],
): Promise<{ evaluation: WritingEvaluation; used: string }> {
  const errors: string[] = [];

  for (const p of providers) {
    const r = await p.evaluate(input);
    if (!r.ok) {
      errors.push(`[${p.name}] ${r.error}`);
      continue;
    }

    try {
      const evaluation = parseAndValidateEval(r.json);
      return { evaluation, used: p.name };
    } catch (e) {
      errors.push(`[${p.name}] invalid-output: ${(e as Error).message}`);
    }
  }

  throw new Error(`All providers failed. ${errors.join(' | ')}`);
}
