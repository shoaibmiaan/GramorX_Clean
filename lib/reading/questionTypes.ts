export enum ReadingQuestionType {
  TFNG = 'tfng',
  YNNG = 'ynng',
  MCQ_SINGLE = 'mcq_single',
  MCQ_MULTIPLE = 'mcq_multiple',
  SENTENCE_COMPLETION = 'sentence_completion',
  SUMMARY_COMPLETION = 'summary_completion',
  HEADING_MATCH = 'heading_match',
  INFO_MATCH = 'info_match',
  NAME_MATCH = 'name_match',
  GENERIC = 'generic',
}

export type ReadingQuestionTypeMap = `${ReadingQuestionType}`;

export const isChoiceType = (t: ReadingQuestionType) =>
  t === ReadingQuestionType.TFNG ||
  t === ReadingQuestionType.YNNG ||
  t === ReadingQuestionType.MCQ_SINGLE ||
  t === ReadingQuestionType.MCQ_MULTIPLE;

export const isMatchingType = (t: ReadingQuestionType) =>
  t === ReadingQuestionType.HEADING_MATCH ||
  t === ReadingQuestionType.INFO_MATCH ||
  t === ReadingQuestionType.NAME_MATCH;

export const isTextType = (t: ReadingQuestionType) =>
  t === ReadingQuestionType.SENTENCE_COMPLETION || t === ReadingQuestionType.SUMMARY_COMPLETION;

export const isSingleChoice = (t: ReadingQuestionType) =>
  t === ReadingQuestionType.TFNG ||
  t === ReadingQuestionType.YNNG ||
  t === ReadingQuestionType.MCQ_SINGLE;

export const isMultiChoice = (t: ReadingQuestionType) => t === ReadingQuestionType.MCQ_MULTIPLE;

export const isCompletionType = (t: ReadingQuestionType) =>
  t === ReadingQuestionType.SENTENCE_COMPLETION || t === ReadingQuestionType.SUMMARY_COMPLETION;

export const parseQuestionType = (raw: string): ReadingQuestionType => {
  const v = String(raw ?? '').toLowerCase();
  if (v === 'tfng' || v.includes('true_false')) return ReadingQuestionType.TFNG;
  if (v === 'ynng' || v.includes('yes_no')) return ReadingQuestionType.YNNG;
  if (v.includes('multiple') || v.includes('mcq_multi')) return ReadingQuestionType.MCQ_MULTIPLE;
  if (v.includes('mcq') || v.includes('choice')) return ReadingQuestionType.MCQ_SINGLE;
  if (v.includes('summary')) return ReadingQuestionType.SUMMARY_COMPLETION;
  if (v.includes('sentence')) return ReadingQuestionType.SENTENCE_COMPLETION;
  if (v.includes('heading')) return ReadingQuestionType.HEADING_MATCH;
  if (v.includes('info')) return ReadingQuestionType.INFO_MATCH;
  if (v.includes('name')) return ReadingQuestionType.NAME_MATCH;
  return ReadingQuestionType.GENERIC;
};
