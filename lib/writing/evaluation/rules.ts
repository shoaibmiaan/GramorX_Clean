// lib/writing/evaluation/rules.ts
import type { CriteriaKey, WritingEvalInput, WritingEvalResult } from './types';

const clampBand = (n: number) => Math.round(Math.max(0, Math.min(9, n)) * 2) / 2;

const wordCount = (t: string) => {
  const s = (t ?? '').replace(/\u00A0/g, ' ').trim();
  if (!s) return 0;
  return s.split(/\s+/).filter(Boolean).length;
};

const paragraphCount = (t: string) => {
  const s = (t ?? '').trim();
  if (!s) return 0;
  return s.split(/\n\s*\n/).filter(Boolean).length;
};

const containsClearPosition = (t: string) => {
  const s = (t ?? '').toLowerCase();
  // simple heuristic: look for stance markers
  return /(i (strongly )?(agree|disagree))|(in my opinion)|(i believe)|(this essay (will )?argue)|(i think)/.test(s);
};

export const evaluateRulesV2 = (input: WritingEvalInput): WritingEvalResult => {
  const t1wc = wordCount(input.task1.text);
  const t2wc = wordCount(input.task2.text);

  const t2Paras = paragraphCount(input.task2.text);
  const t2HasPosition = containsClearPosition(input.task2.text);

  const warnings: string[] = [];

  // Base: start slightly strict
  let t1 = 6.0;
  let t2 = 6.0;

  // Word count penalties (hard)
  if (t1wc > 0 && t1wc < input.task1.minWords) {
    t1 -= 1.0;
    warnings.push(`Task 1 under word count (${input.task1.minWords}).`);
  }
  if (t2wc > 0 && t2wc < input.task2.minWords) {
    t2 -= 1.0;
    warnings.push(`Task 2 under word count (${input.task2.minWords}).`);
  }

  // Paragraphing (Task 2)
  if (t2Paras >= 4) t2 += 0.5;
  if (t2Paras > 0 && t2Paras < 3) {
    t2 -= 0.5;
    warnings.push('Weak paragraphing in Task 2 (structure risk).');
  }

  // Clear position (Task 2) — cap TR if missing
  let trCap: number | null = null;
  if (t2wc >= 80 && !t2HasPosition) {
    warnings.push('Task 2 position is unclear (TR cap).');
    trCap = 5.5;
    t2 -= 0.5;
  }

  // Criteria proxies (still simple, but calibrated)
  const criteria: Record<CriteriaKey, number> = {
    TR: clampBand((t1 + t2) / 2),
    CC: clampBand(6 + (t2Paras >= 4 ? 0.5 : 0) - (t2Paras > 0 && t2Paras < 3 ? 0.5 : 0)),
    LR: clampBand(6),
    GRA: clampBand(6),
  };

  if (trCap !== null) criteria.TR = Math.min(criteria.TR, trCap);

  // Task2 weighting + caps
  t1 = clampBand(t1);
  t2 = clampBand(t2);

  let overall = clampBand(t2 * 0.66 + t1 * 0.34);

  // Strict caps: if Task 2 is weak, overall can’t magically be high
  if (t2 < 6.0) overall = Math.min(overall, 5.5);
  if (t2 < 5.5) overall = Math.min(overall, 5.0);

  // If under word count on Task2, cap harder
  if (t2wc > 0 && t2wc < input.task2.minWords) overall = Math.min(overall, 5.0);

  const criteriaNotes: WritingEvalResult['criteriaNotes'] = {
    TR: [
      'Answer the question directly and fully.',
      'Develop each main idea with a specific example (not generic claims).',
    ],
    CC: [
      'Use clear paragraphing (intro, 2 body paragraphs, conclusion).',
      'Link ideas naturally; avoid repetitive basic connectors.',
    ],
    LR: [
      'Reduce repetition and aim for precision over “big words”.',
      'Use natural collocations and topic-specific vocabulary.',
    ],
    GRA: [
      'Increase sentence variety while keeping accuracy.',
      'Control errors in articles, verb forms, and agreement.',
    ],
  };

  const taskNotes: WritingEvalResult['taskNotes'] = {
    task1: [
      'Make the overview obvious (main trends/comparisons).',
      'Group details logically instead of listing numbers.',
    ],
    task2: [
      'State a clear position early and maintain it.',
      'Develop ideas with examples and explanations.',
    ],
  };

  const nextSteps = [
    'Task 2: write clearer position + stronger development with examples.',
    'Fix paragraphing: 4–5 paragraphs with clear topic sentences.',
    'Reduce repetition (connectors + vocabulary).',
    'Increase sentence range but keep accuracy.',
  ];

  return {
    overallBand: overall,
    task1Band: t1,
    task2Band: t2,
    criteria,

    shortVerdictTask1: 'Generally understandable, but tighten overview and meet requirements.',
    shortVerdictTask2: 'Main ideas need stronger development and clearer structure.',

    criteriaNotes,
    taskNotes,
    warnings,
    nextSteps,

    provider: 'rules_v2',
    model: null,
    meta: { t1wc, t2wc, t2Paras, t2HasPosition },
  };
};
