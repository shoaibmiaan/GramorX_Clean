import * as React from 'react';

import type { NormalizedReadingQuestion } from '@/lib/reading/normalizeQuestion';
import { ReadingQuestionType } from '@/lib/reading/questionTypes';
import ReadingQuestionTFNG from './ReadingQuestionTFNG';
import ReadingQuestionYNNG from './ReadingQuestionYNNG';
import ReadingQuestionMCQSingle from './ReadingQuestionMCQSingle';
import ReadingQuestionMCQMultiple from './ReadingQuestionMCQMultiple';
import ReadingQuestionSentenceCompletion from './ReadingQuestionSentenceCompletion';
import ReadingQuestionSummaryCompletion from './ReadingQuestionSummaryCompletion';
import ReadingQuestionHeadingMatch from './ReadingQuestionHeadingMatch';
import ReadingQuestionInfoMatch from './ReadingQuestionInfoMatch';
import ReadingQuestionNameMatch from './ReadingQuestionNameMatch';

export type AnswerValue = string | string[] | Record<string, any> | null;

export type RendererProps = {
  question: NormalizedReadingQuestion;
  value: AnswerValue;
  setAnswer: (val: AnswerValue) => void;
  answers?: Record<string, AnswerValue>;
  mode?: 'exam' | 'review';
};

const RENDERERS: Record<ReadingQuestionType, React.ComponentType<RendererProps>> = {
  [ReadingQuestionType.TFNG]: ReadingQuestionTFNG,
  [ReadingQuestionType.YNNG]: ReadingQuestionYNNG,
  [ReadingQuestionType.MCQ_SINGLE]: ReadingQuestionMCQSingle,
  [ReadingQuestionType.MCQ_MULTIPLE]: ReadingQuestionMCQMultiple,
  [ReadingQuestionType.SENTENCE_COMPLETION]: ReadingQuestionSentenceCompletion,
  [ReadingQuestionType.SUMMARY_COMPLETION]: ReadingQuestionSummaryCompletion,
  [ReadingQuestionType.HEADING_MATCH]: ReadingQuestionHeadingMatch,
  [ReadingQuestionType.INFO_MATCH]: ReadingQuestionInfoMatch,
  [ReadingQuestionType.NAME_MATCH]: ReadingQuestionNameMatch,
  [ReadingQuestionType.GENERIC]: ReadingQuestionSentenceCompletion,
};

const QuestionRenderer: React.FC<RendererProps> = (props) => {
  const Renderer = RENDERERS[props.question.type] ?? ReadingQuestionSentenceCompletion;
  return <Renderer {...props} />;
};

export default QuestionRenderer;
