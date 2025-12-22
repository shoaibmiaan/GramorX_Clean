// lib/writing/format/formatFeedback.ts
// Transform raw evaluation into strict, UI-ready feedback structures.
import type {
  BandReasoningItem,
  CriteriaKey,
  FeedbackBlock,
  ImprovementRow,
  WarningItem,
  WritingAnswer,
  WritingEvaluation,
} from '@/lib/writing/types';
import { buildSentenceFixes } from './sentenceFixes';

type FormattedFeedback = {
  summary: string[];
  blocks: FeedbackBlock[];
  bandReasoning: BandReasoningItem[];
  improvements: ImprovementRow[];
  warnings: WarningItem[];
};

const fallbackSummary = ['Fix Task Response + Coherence/Cohesion first to unlock higher bands.'];

const toWarnings = (evaluation: WritingEvaluation): WarningItem[] => {
  return (evaluation.warnings ?? []).map((w) => ({
    type: w,
    message:
      w === 'off_topic'
        ? 'Detected off-topic or partially off-topic content.'
        : w === 'memorised_language'
        ? 'Memorised language or template-heavy phrasing detected.'
        : w === 'task1_under_length'
        ? 'Task 1 may be under required length (150 words).'
        : w === 'task2_under_length'
        ? 'Task 2 may be under required length (250 words).'
        : typeof w === 'string'
        ? w
        : 'Warning detected.',
  }));
};

const splitNotes = (notes: string[]) => notes.filter(Boolean).map((n) => n.trim()).filter(Boolean);

const buildFeedbackBlocks = (evaluation: WritingEvaluation): FeedbackBlock[] => {
  const { criteria } = evaluation;

  const makeBlock = (taskNumber: 1 | 2, title: string, keys: CriteriaKey[]): FeedbackBlock => {
    const notes = keys.flatMap((k) => splitNotes(criteria[k]?.notes ?? [])).slice(0, 6);
    const issues = notes.slice(0, 3);
    const impact = notes.slice(3, 6);
    const fixes =
      taskNumber === 2
        ? [
            'State a clear position in the introduction and sustain it.',
            'Develop body paragraphs with specific, relevant examples.',
          ]
        : ['Summarize key trends without listing every data point.', 'Group related data before writing.'];

    const examples =
      taskNumber === 2
        ? ['Before: “There are many reasons.” → After: “The primary reason is X, which leads to Y.”']
        : ['Before: “The line goes up.” → After: “The line climbed steadily from 50 to 80 over the decade.”'];

    return {
      taskNumber,
      title,
      issues: issues.length ? issues : ['Issues not captured.'],
      impact: impact.length ? impact : ['Band impact notes missing.'],
      fixes,
      examples,
      criteria: keys,
    };
  };

  return [
    makeBlock(2, 'Task 2 — Main weaknesses', ['TR', 'CC', 'LR', 'GRA']),
    makeBlock(1, 'Task 1 — Main weaknesses', ['TR', 'CC', 'LR', 'GRA']),
  ];
};

const buildBandReasoning = (evaluation: WritingEvaluation): BandReasoningItem[] => {
  const { criteria } = evaluation;
  const pick = (key: CriteriaKey): string => {
    const note = criteria[key]?.notes?.[0];
    if (note) return note;
    if (key === 'TR') return 'Position not fully developed for the prompt.';
    if (key === 'CC') return 'Paragraph flow/connectors reduce clarity.';
    if (key === 'LR') return 'Range/precision of vocab limits clarity.';
    return 'Errors/limited range of structures lower accuracy.';
  };

  const items: BandReasoningItem[] = [
    { taskNumber: 2, criteria: 'TR', text: pick('TR') },
    { taskNumber: 2, criteria: 'CC', text: pick('CC') },
    { taskNumber: 2, criteria: 'LR', text: pick('LR') },
    { taskNumber: 2, criteria: 'GRA', text: pick('GRA') },
    { taskNumber: 1, criteria: 'TR', text: pick('TR') },
    { taskNumber: 1, criteria: 'CC', text: pick('CC') },
  ];

  return items.slice(0, 6);
};

export const formatFeedback = (
  evaluation: WritingEvaluation | null | undefined,
  answers: WritingAnswer[],
): FormattedFeedback => {
  if (!evaluation) {
    return { summary: fallbackSummary, blocks: [], bandReasoning: [], improvements: [], warnings: [] };
  }

  const blocks = buildFeedbackBlocks(evaluation);
  const bandReasoning = buildBandReasoning(evaluation);
  const improvements = buildSentenceFixes(evaluation, answers);
  const warnings = toWarnings(evaluation);

  const summary = [
    `Overall band ${evaluation.overallBand.toFixed(1)} — task 2 drives most deductions.`,
    `Task 2 band ${evaluation.task2.band.toFixed(1)}, Task 1 band ${evaluation.task1.band.toFixed(1)}.`,
  ];

  return {
    summary,
    blocks,
    bandReasoning,
    improvements,
    warnings,
  };
};

export type FormattedFeedback = ReturnType<typeof formatFeedback>;
