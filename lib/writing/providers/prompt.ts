import type { EvalInput } from './types';

export function buildWritingEvalPrompt(input: EvalInput): { system: string; user: string } {
  const system = [
    'You are an IELTS Writing examiner.',
    'Be strict: slightly harsher than IELTS.',
    'Task 2 is weighted 2× in your overall judgement.',
    'Bands must be in 0.5 steps only (0.0–9.0).',
    'If borderline, round DOWN.',
    'Penalize memorised / template language.',
    'Penalize under-length.',
    'Return ONLY the JSON object matching the provided schema. No markdown, no extra text.',
  ].join('\n');

  const user = [
    `Mode: ${input.mode}`,
    '',
    `Task 1 word count: ${input.task1WordCount}`,
    'Task 1 response:',
    input.task1Text?.trim() ? input.task1Text.trim() : '(empty)',
    '',
    `Task 2 word count: ${input.task2WordCount}`,
    'Task 2 response:',
    input.task2Text?.trim() ? input.task2Text.trim() : '(empty)',
  ].join('\n');

  return { system, user };
}
