import type { ListeningMockContent, ModuleMockContent, ReadingMockContent } from './types';

type ListeningAnswers = Record<string, string | number | string[]>;

type WritingAnswers = {
  task1Text: string;
  task2Text: string;
  timeSpentSeconds?: number;
};

type SpeakingAnswers = {
  transcript?: string;
  notes?: string;
  audioUrl?: string;
};

export type ScoreResult = {
  band: number;
  summary: string;
  accuracy?: number;
  correct?: number;
  total?: number;
  details?: Record<string, unknown>;
};

const normalizeAnswer = (value: string | number | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value.join('').trim().toLowerCase();
  }
  return String(value ?? '').trim().toLowerCase();
};

const accuracyToBand = (accuracy: number) => {
  const scaled = 4 + accuracy * 5;
  return Number(Math.min(9, Math.max(3.5, scaled)).toFixed(1));
};

export const scoreListening = (content: ListeningMockContent, answers: ListeningAnswers): ScoreResult => {
  const total = content.questions.length;
  const correct = content.questions.reduce((sum, question) => {
    const userAnswer = normalizeAnswer(answers[question.id]);
    const key = normalizeAnswer(question.answer);
    return sum + (userAnswer && userAnswer === key ? 1 : 0);
  }, 0);

  const accuracy = total ? correct / total : 0;
  return {
    band: accuracyToBand(accuracy),
    summary: `Answered ${correct} / ${total} correctly`,
    accuracy,
    correct,
    total,
    details: { module: 'listening', accuracy },
  };
};

export const scoreReading = (content: ReadingMockContent, answers: ListeningAnswers): ScoreResult => {
  const total = content.questions.length;
  const correct = content.questions.reduce((sum, question) => {
    const userAnswer = normalizeAnswer(answers[question.id]);
    const key = normalizeAnswer(question.answer);
    return sum + (userAnswer && userAnswer === key ? 1 : 0);
  }, 0);

  const accuracy = total ? correct / total : 0;
  return {
    band: accuracyToBand(accuracy),
    summary: `Answered ${correct} / ${total} correctly`,
    accuracy,
    correct,
    total,
    details: { module: 'reading', accuracy },
  };
};

const countWords = (text: string) => {
  return text.trim().length ? text.trim().split(/\s+/).length : 0;
};

export const scoreWriting = (answers: WritingAnswers): ScoreResult => {
  const task1Words = countWords(answers.task1Text ?? '');
  const task2Words = countWords(answers.task2Text ?? '');
  const coverage = Math.min(task1Words / 150, 1) * 0.4 + Math.min(task2Words / 250, 1) * 0.6;
  const band = Number(Math.min(8.5, 5 + coverage * 4).toFixed(1));
  return {
    band,
    summary: `Task 1: ${task1Words} words • Task 2: ${task2Words} words`,
    details: {
      module: 'writing',
      task1Words,
      task2Words,
      timeSpentSeconds: answers.timeSpentSeconds,
    },
  };
};

export const scoreSpeaking = (answers: SpeakingAnswers): ScoreResult => {
  const transcriptLength = countWords(answers.transcript ?? answers.notes ?? '');
  const band = Number(Math.min(8, 5 + Math.min(transcriptLength / 150, 1) * 3).toFixed(1));
  return {
    band,
    summary: `Recorded ~${transcriptLength} words of speech`,
    details: {
      module: 'speaking',
      transcriptLength,
      hasAudio: Boolean(answers.audioUrl),
    },
  };
};

export function scoreAttempt(
  module: ModuleMockContent['module'],
  content: ModuleMockContent['content'],
  answers: Record<string, unknown>,
): ScoreResult {
  switch (module) {
    case 'listening':
      return scoreListening(content as ListeningMockContent, answers as ListeningAnswers);
    case 'reading':
      return scoreReading(content as ReadingMockContent, answers as ListeningAnswers);
    case 'writing':
      return scoreWriting(answers as WritingAnswers);
    case 'speaking':
      return scoreSpeaking(answers as SpeakingAnswers);
    default:
      return { band: 0, summary: 'Unsupported module' };
  }
}
