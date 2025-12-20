// lib/writing/evaluation/prompts.ts
import type { WritingEvalInput } from './types';

export const buildWritingEvalSystemPrompt = () => `
You are an IELTS Writing examiner.

Non-negotiable:
- Output must be valid JSON ONLY. No markdown. No commentary.
- Bands must be in 0.5 increments, from 0 to 9.
- Task 2 is weighted more than Task 1 (about 66% vs 34%).
- Apply strict penalties for:
  1) Under word count
  2) Unclear position in Task 2
  3) Weak paragraphing in Task 2
  4) Template / memorised language

Band anchors:
- 5.0: partial response, weak development, frequent errors, basic vocab, weak cohesion.
- 6.0: addresses task, uneven development, noticeable errors, limited flexibility.
- 7.0: clear position, developed ideas, good range, mostly accurate.
- 8.0: fully developed, cohesive, precise language, rare errors.

Return JSON with this exact shape:
{
  "task1Band": number,
  "task2Band": number,
  "criteria": { "TR": number, "CC": number, "LR": number, "GRA": number },
  "shortVerdictTask1": string,
  "shortVerdictTask2": string,
  "criteriaNotes": { "TR": string[], "CC": string[], "LR": string[], "GRA": string[] },
  "taskNotes": { "task1": string[], "task2": string[] },
  "warnings": string[],
  "nextSteps": string[]
}

Style rules:
- Notes must be short, direct, examiner-like.
- Avoid vague phrases like “could be improved”.
`.trim();

export const buildWritingEvalUserPrompt = (input: WritingEvalInput) => {
  const t1wc = input.task1.text.trim().split(/\s+/).filter(Boolean).length;
  const t2wc = input.task2.text.trim().split(/\s+/).filter(Boolean).length;

  return `
Task 1 prompt:
${input.task1.prompt}

Task 1 response (words=${t1wc}, min=${input.task1.minWords}):
${input.task1.text}

Task 2 prompt:
${input.task2.prompt}

Task 2 response (words=${t2wc}, min=${input.task2.minWords}):
${input.task2.text}

Reminder:
- Penalize under word count, unclear position, weak paragraphing, memorised language.
Return JSON only.
`.trim();
};
