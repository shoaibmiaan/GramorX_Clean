// lib/listening/constants.ts

import type { ListeningQuestionType, ListeningSectionNumber } from './types';

export const LISTENING_SECTIONS: ListeningSectionNumber[] = [1, 2, 3, 4];

export const LISTENING_DEFAULT_DURATION_SECONDS = 30 * 60; // 30 minutes for practice mini-tests
export const LISTENING_MOCK_DURATION_SECONDS = 30 * 60; // Full CBE listening ~30 minutes

export const LISTENING_MAX_SCORE = 40;

/**
 * Mapping raw listening scores to band scores (academic-style).
 * Fully typed and safe.
 */
export const LISTENING_BAND_TABLE: Array<{
  min: number;
  max: number;
  band: number;
}> = [
  { min: 39, max: 40, band: 9 },
  { min: 37, max: 38, band: 8.5 },
  { min: 35, max: 36, band: 8 },
  { min: 32, max: 34, band: 7.5 },
  { min: 30, max: 31, band: 7 },
  { min: 26, max: 29, band: 6.5 },
  { min: 23, max: 25, band: 6 },
  { min: 18, max: 22, band: 5.5 },
  { min: 16, max: 17, band: 5 },
  { min: 13, max: 15, band: 4.5 },
  { min: 11, max: 12, band: 4 },
  { min: 0, max: 10, band: 3 },
];

/**
 * Default penalty / scoring knobs for game mode.
 */
export const LISTENING_GAME_BASE_XP_PER_CORRECT = 10;
export const LISTENING_GAME_STREAK_BONUS_MULTIPLIER = 0.25;
export const LISTENING_GAME_TIME_BONUS_MAX = 0.3; // 30% bonus for fast response time

export const LISTENING_QUESTION_TYPE_LABELS: Record<ListeningQuestionType, string> = {
  multiple_choice_single: 'MCQ (Single)',
  multiple_choice_multiple: 'MCQ (Multiple)',
  matching: 'Matching',
  map: 'Map / Plan',
  plan: 'Plan / Layout',
  form_completion: 'Form Completion',
  note_completion: 'Note Completion',
  table_completion: 'Table Completion',
  diagram_completion: 'Diagram Completion',
  short_answer: 'Short Answer',
};
