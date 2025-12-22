// lib/writing/evaluation/validate.ts
import { EvaluationSchema, type ParsedEvaluation } from './schema';

export type ValidationResult =
  | { ok: true; data: ParsedEvaluation }
  | { ok: false; error: string };

export function validateEvaluationOutput(payload: unknown): ValidationResult {
  const parsed = EvaluationSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.flatten().formErrors.join('; ') || 'Invalid evaluation output' };
  }
  return { ok: true, data: parsed.data };
}

export function assertValidEvaluation(payload: unknown): ParsedEvaluation {
  const res = validateEvaluationOutput(payload);
  if (!res.ok) {
    throw new Error(res.error);
  }
  return res.data;
}
