// lib/writing/evaluation/evaluate.ts
import type { WritingEvalInput, WritingEvalResult } from './types';
import { evaluateRulesV2 } from './rules';
import { assertValidEvaluation, enforceStrictnessGuard, normalizeEvaluation } from './index';

type SchemaPayload = {
  evaluation_version: string;
  overall_band: number;
  task1: {
    band: number;
    criteria: { TR: number; CC: number; LR: number; GRA: number };
    strengths: string[];
    weaknesses: string[];
    fixes: string[];
    warnings: string[];
    reasoning: string;
    short_verdict?: string;
  };
  task2: {
    band: number;
    criteria: { TR: number; CC: number; LR: number; GRA: number };
    strengths: string[];
    weaknesses: string[];
    fixes: string[];
    warnings: string[];
    reasoning: string;
    short_verdict?: string;
  };
  summary: string[];
  next_steps: string[];
};

const fallbackStrengths = ['Meets most task requirements.', 'Ideas are understandable.'];
const fallbackWeaknesses = ['Development is uneven.', 'Cohesion and precision can be improved.'];
const fallbackFixes = ['Add clearer topic sentences.', 'Use specific examples to support main ideas.'];

const toSchemaPayload = (input: WritingEvalInput, base: WritingEvalResult): SchemaPayload => {
  const t1Warnings = base.warnings.filter((w) => w.toLowerCase().includes('task 1') || w.toLowerCase().includes('1'));
  const t2Warnings = base.warnings.filter((w) => w.toLowerCase().includes('task 2') || w.toLowerCase().includes('2'));

  return {
    evaluation_version: 'rules_v2',
    overall_band: base.overallBand,
    task1: {
      band: base.task1Band,
      criteria: base.criteria,
      strengths: base.criteriaNotes.TR?.length ? base.criteriaNotes.TR : fallbackStrengths,
      weaknesses: base.taskNotes?.task1?.length ? base.taskNotes.task1 : fallbackWeaknesses,
      fixes: base.criteriaNotes.CC?.length ? base.criteriaNotes.CC : fallbackFixes,
      warnings: t1Warnings,
      reasoning: 'Rule-based heuristic evaluation for Task 1.',
      short_verdict: base.shortVerdictTask1 ?? '',
    },
    task2: {
      band: base.task2Band,
      criteria: base.criteria,
      strengths: base.criteriaNotes.LR?.length ? base.criteriaNotes.LR : fallbackStrengths,
      weaknesses: base.taskNotes?.task2?.length ? base.taskNotes.task2 : fallbackWeaknesses,
      fixes: base.criteriaNotes.GRA?.length ? base.criteriaNotes.GRA : fallbackFixes,
      warnings: t2Warnings,
      reasoning: 'Rule-based heuristic evaluation for Task 2.',
      short_verdict: base.shortVerdictTask2 ?? '',
    },
    summary: [
      `Overall band ${base.overallBand.toFixed(1)} with heavier weight on Task 2.`,
      `Task 1 band ${base.task1Band.toFixed(1)}, Task 2 band ${base.task2Band.toFixed(1)}.`,
    ],
    next_steps: base.nextSteps,
  };
};

export const evaluateWritingAttempt = async (input: WritingEvalInput): Promise<WritingEvalResult> => {
  const base = evaluateRulesV2(input);
  const schemaPayload = toSchemaPayload(input, base);

  const validated = assertValidEvaluation(schemaPayload);
  const normalized = normalizeEvaluation(validated);
  enforceStrictnessGuard(normalized);

  const combinedWarnings = Array.from(
    new Set([...base.warnings, ...normalized.task1.warnings, ...normalized.task2.warnings]),
  );

  return {
    overallBand: normalized.overall_band,
    task1Band: normalized.task1.band,
    task2Band: normalized.task2.band,
    criteria: normalized.task2.criteria,
    shortVerdictTask1: normalized.task1.short_verdict || base.shortVerdictTask1,
    shortVerdictTask2: normalized.task2.short_verdict || base.shortVerdictTask2,
    criteriaNotes: base.criteriaNotes,
    taskNotes: base.taskNotes,
    warnings: combinedWarnings,
    nextSteps: normalized.next_steps.length ? normalized.next_steps : base.nextSteps,
    provider: 'rules_v2',
    model: null,
    meta: { ...(base.meta ?? {}), validation: 'rules+normalized' },
  };
};
