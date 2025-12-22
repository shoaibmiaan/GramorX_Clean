// lib/writing/prompts/evaluate.task2.ts
import { penaltyGuidelines } from './penalties';
import { bandAnchors } from './band_descriptors';

type Task2PromptInput = {
  promptText: string;
  answerText: string;
  minWords: number;
  mode?: 'academic' | 'general';
};

export function buildTask2EvalPrompt(input: Task2PromptInput): string {
  const mode = input.mode ?? 'academic';
  const anchors = Object.entries(bandAnchors)
    .map(([band, desc]) => `Band ${band}: ${desc}`)
    .join('\n');

  return [
    'You are an IELTS Writing Task 2 examiner. Be strict (slightly harsher than IELTS).',
    'Task 2 is heavier weight than Task 1. Penalise weak argument development, unclear position, poor paragraphing.',
    'Return ONLY one JSON object, no markdown, matching this shape:',
    '{',
    '  "evaluation_version": "task2_v1",',
    '  "overall_band": number (0-9, 0.5 steps),',
    '  "criteria": { "TR": number, "CC": number, "LR": number, "GRA": number },',
    '  "strengths": [string],',
    '  "weaknesses": [string],',
    '  "fixes": [string],',
    '  "warnings": [string],',
    '  "reasoning": string,',
    '  "short_verdict": string',
    '}',
    '',
    'Rules:',
    anchors,
    penaltyGuidelines,
    'If borderline between bands, round DOWN.',
    'Emphasise Task Response and argument progression: unclear position should lower TR and overall.',
    'Be concise: strengths/weaknesses/fixes as short bullets (max 8 each).',
    'Warnings should include under-length, off-topic, or memorised/template language if detected.',
    '',
    `Mode: ${mode}`,
    `Task 2 minimum words: ${input.minWords}`,
    'Prompt:',
    input.promptText.trim() || '(missing prompt)',
    '',
    'Candidate answer:',
    input.answerText.trim() || '(empty)',
  ].join('\n');
}
