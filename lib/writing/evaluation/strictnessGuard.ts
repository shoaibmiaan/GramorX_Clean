// lib/writing/evaluation/strictnessGuard.ts
import type { ParsedEvaluation } from './schema';

export function enforceStrictnessGuard(evalIn: ParsedEvaluation): void {
  const hasWeaknesses = evalIn.task1.weaknesses.length > 0 || evalIn.task2.weaknesses.length > 0;
  const hasFixes = evalIn.task1.fixes.length > 0 || evalIn.task2.fixes.length > 0;
  const criteriaComplete =
    evalIn.task1.criteria && evalIn.task2.criteria && Object.keys(evalIn.task1.criteria).length === 4;

  if (!criteriaComplete) throw new Error('Missing criteria bands');
  if (!hasWeaknesses) throw new Error('Evaluation too lenient: missing weaknesses');
  if (!hasFixes) throw new Error('Evaluation too lenient: missing fixes');

  const bands = [
    evalIn.task1.band,
    evalIn.task2.band,
    evalIn.task1.criteria.TR,
    evalIn.task2.criteria.TR,
    evalIn.overall_band,
  ];

  const invalidBand = bands.find((b) => Math.round(b * 2) !== b * 2);
  if (invalidBand !== undefined) throw new Error('Bands must be 0.5 increments');
}
