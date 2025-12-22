// lib/writing/format/sentenceFixes.ts
// Build concise before/after fixes (max 5 rows).
import type { CriteriaKey, ImprovementRow, WritingAnswer, WritingEvaluation } from '@/lib/writing/types';

const clampList = <T,>(arr: T[], max = 5): T[] => arr.filter(Boolean).slice(0, max);

const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();

const splitSentences = (text: string): string[] => {
  return normalizeText(text)
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.split(' ').length >= 4);
};

const pickSentences = (answer: WritingAnswer | undefined, count: number): string[] => {
  if (!answer) return [];
  const sentences = splitSentences(answer.text);
  return clampList(sentences, count);
};

const improveSentence = (sentence: string): string => {
  // Simple heuristics to avoid long rewrites.
  let improved = sentence;
  improved = improved.replace(/\b(very|really|so)\b/gi, ''); // trim fluff
  improved = improved.replace(/\b(in conclusion|overall)\b/gi, '').trim();
  if (!/[;:]/.test(improved) && improved.includes(',')) {
    improved = improved.replace(',', ';');
  }
  if (!/[A-Z]/.test(improved[0] ?? '')) {
    improved = improved.charAt(0).toUpperCase() + improved.slice(1);
  }
  return improved.trim();
};

export const buildSentenceFixes = (
  evaluation: WritingEvaluation | null | undefined,
  answers: WritingAnswer[],
): ImprovementRow[] => {
  if (!evaluation) return [];

  const task2 = answers.find((a) => a.taskNumber === 2);
  const task1 = answers.find((a) => a.taskNumber === 1);

  const sourceSentences = [...pickSentences(task2, 3), ...pickSentences(task1, 2)];

  const rows: ImprovementRow[] = sourceSentences.map((s, idx) => {
    const taskNumber: 1 | 2 = idx < 3 ? 2 : 1;
    const after = improveSentence(s);
    const criteria: CriteriaKey | undefined = after.length > s.length + 5 ? 'CC' : 'GRA';

    return {
      taskNumber,
      criteria,
      before: s,
      after,
    };
  });

  return clampList(rows, 5);
};
