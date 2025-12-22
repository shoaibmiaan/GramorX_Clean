import type { EvalInput } from './types';
import { buildTask1EvalPrompt, buildTask2EvalPrompt, penaltyGuidelines } from '@/lib/writing/prompts';

export function buildWritingEvalPrompt(input: EvalInput): { system: string; user: string } {
  const system = [
    'You are an IELTS Writing examiner. Be strict and slightly harsher than the real test.',
    'Bands must be 0.0–9.0 in 0.5 steps. Borderline -> round down.',
    'Output ONE JSON object covering both tasks (task1, task2) with bands, TR/CC/LR/GRA, strengths, weaknesses, fixes, warnings, reasoning, short_verdict.',
    'Do not return markdown. No prose outside the JSON object.',
    penaltyGuidelines,
  ].join('\n');

  const t1Section = buildTask1EvalPrompt({
    promptText: input.task1Text ?? '',
    answerText: input.task1Text ?? '',
    minWords: input.task1WordCount ?? 150,
    mode: input.mode,
  });

  const t2Section = buildTask2EvalPrompt({
    promptText: input.task2Text ?? '',
    answerText: input.task2Text ?? '',
    minWords: input.task2WordCount ?? 250,
    mode: input.mode,
  });

  const user = ['TASK 1', t1Section, '', 'TASK 2', t2Section].join('\n');

  return { system, user };
}
