// lib/writing/prompts/evaluate.task1.ts
import { penaltyGuidelines } from './penalties';
import { bandAnchors } from './band_descriptors';

type Task1PromptInput = {
  promptText: string;
  answerText: string;
  minWords: number;
  mode?: 'academic' | 'general';
};

export function buildTask1EvalPrompt(input: Task1PromptInput): string {
  const mode = input.mode ?? 'academic';
  const anchors = Object.entries(bandAnchors)
    .map(([band, desc]) => `Band ${band}: ${desc}`)
    .join('\n');

  return [
    'You are an IELTS Writing Task 1 examiner. Be strict (slightly harsher than the real exam).',
    'Return ONLY one JSON object, no markdown, matching this shape:',
    '{',
    '  "evaluation_version": "task1_v1",',
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
    'Be concise: strengths/weaknesses/fixes as short bullets (max 8 each).',
    'Warnings should include under-length, off-topic, or memorised/template language if detected.',
    '',
    `Mode: ${mode}`,
    `Task 1 minimum words: ${input.minWords}`,
    'Prompt:',
    input.promptText.trim() || '(missing prompt)',
    '',
    'Candidate answer:',
    input.answerText.trim() || '(empty)',
  ].join('\n');
}
