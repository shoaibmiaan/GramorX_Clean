// lib/writing/evaluation/evaluate.ts
import type { WritingEvalInput, WritingEvalResult } from './types';
import { evaluateRulesV2 } from './rules';
// Later: import { evaluateWithAI } from './providerAdapter';

export const evaluateWritingAttempt = async (input: WritingEvalInput): Promise<WritingEvalResult> => {
  // Day 23: keep pipeline stable with calibrated rules.
  // Later you can switch to AI and keep these rules as a “judge/cap layer”.
  return evaluateRulesV2(input);
};
