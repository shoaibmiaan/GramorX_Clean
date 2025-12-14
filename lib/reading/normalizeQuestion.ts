import type { ReadingQuestion } from './types';
import { parseQuestionType, ReadingQuestionType } from './questionTypes';

export type NormalizedReadingQuestion = {
  id: string;
  type: ReadingQuestionType;
  prompt: string;
  instructions: string | null;
  options?: string[];
  maxWords?: number | null;
  maxChars?: number | null;
  expectsMultiple?: boolean;
  groupId?: string | null;
  groupPrompt?: string | null;
  groupOptions?: string[];
  answerKey?: string | string[] | Record<string, unknown> | null;
};

export const normalizeReadingQuestion = (input: ReadingQuestion): NormalizedReadingQuestion => {
  const constraints = (input as any).constraintsJson ?? {};
  const type = parseQuestionType((input as any).questionTypeId ?? '');
  const options: string[] | undefined = Array.isArray(constraints.options)
    ? constraints.options.map(String)
    : Array.isArray((constraints as any).labels)
      ? (constraints as any).labels.map(String)
      : undefined;

  const maxWords = typeof constraints.maxWords === 'number'
    ? constraints.maxWords
    : typeof constraints.max_words === 'number'
      ? constraints.max_words
      : null;

  const maxChars = typeof constraints.maxChars === 'number'
    ? constraints.maxChars
    : typeof constraints.max_chars === 'number'
      ? constraints.max_chars
      : null;

  const groupId = constraints.groupId ?? constraints.group_id ?? null;
  const groupPrompt = constraints.groupPrompt ?? constraints.group_prompt ?? null;
  const groupOptions: string[] | undefined = Array.isArray(constraints.groupOptions)
    ? constraints.groupOptions.map(String)
    : Array.isArray(constraints.pool)
      ? constraints.pool.map(String)
      : undefined;

  const expectsMultiple = type === ReadingQuestionType.MCQ_MULTIPLE || Boolean(constraints.expectsMultiple);

  return {
    id: String(input.id),
    type,
    prompt: input.prompt,
    instructions: input.instruction ?? null,
    options,
    maxWords,
    maxChars,
    expectsMultiple,
    groupId: groupId ? String(groupId) : null,
    groupPrompt: groupPrompt ? String(groupPrompt) : null,
    groupOptions,
    answerKey: (input as any).correctAnswer ?? null,
  };
};
