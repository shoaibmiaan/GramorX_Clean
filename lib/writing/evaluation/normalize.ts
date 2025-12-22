// lib/writing/evaluation/normalize.ts
import type { ParsedEvaluation } from './schema';

const roundBand = (n: number) => Math.round(n * 2) / 2;

const cleanList = (list: string[], max = 8) =>
  Array.from(
    new Set(
      (list ?? [])
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, max),
    ),
  );

export function normalizeEvaluation(evalIn: ParsedEvaluation): ParsedEvaluation {
  return {
    evaluation_version: evalIn.evaluation_version.trim(),
    overall_band: roundBand(evalIn.overall_band),
    task1: {
      ...evalIn.task1,
      band: roundBand(evalIn.task1.band),
      criteria: {
        TR: roundBand(evalIn.task1.criteria.TR),
        CC: roundBand(evalIn.task1.criteria.CC),
        LR: roundBand(evalIn.task1.criteria.LR),
        GRA: roundBand(evalIn.task1.criteria.GRA),
      },
      strengths: cleanList(evalIn.task1.strengths),
      weaknesses: cleanList(evalIn.task1.weaknesses),
      fixes: cleanList(evalIn.task1.fixes),
      warnings: cleanList(evalIn.task1.warnings, 10),
      reasoning: evalIn.task1.reasoning.trim(),
      short_verdict: (evalIn.task1.short_verdict ?? '').trim(),
    },
    task2: {
      ...evalIn.task2,
      band: roundBand(evalIn.task2.band),
      criteria: {
        TR: roundBand(evalIn.task2.criteria.TR),
        CC: roundBand(evalIn.task2.criteria.CC),
        LR: roundBand(evalIn.task2.criteria.LR),
        GRA: roundBand(evalIn.task2.criteria.GRA),
      },
      strengths: cleanList(evalIn.task2.strengths),
      weaknesses: cleanList(evalIn.task2.weaknesses),
      fixes: cleanList(evalIn.task2.fixes),
      warnings: cleanList(evalIn.task2.warnings, 10),
      reasoning: evalIn.task2.reasoning.trim(),
      short_verdict: (evalIn.task2.short_verdict ?? '').trim(),
    },
    summary: cleanList(evalIn.summary, 6),
    next_steps: cleanList(evalIn.next_steps, 8),
  };
}
