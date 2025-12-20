import { WritingEvaluationSchema, type WritingEvaluation } from './evalSchema';

export function parseAndValidateEval(raw: unknown): WritingEvaluation {
  const parsed = WritingEvaluationSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid evaluation shape: ${parsed.error.message}`);
  }

  const e = parsed.data;

  // Hard rules (you locked these)
  if (e.task2_band == null) throw new Error('Task 2 band is required');
  if (!e.evaluation_version) throw new Error('evaluation_version required');

  // Prevent “too perfect” nonsense at low confidence (optional but good)
  if (e.confidence_level === 'low' && e.overall_band >= 8.5) {
    throw new Error('Low confidence cannot output 8.5+');
  }

  return e;
}
