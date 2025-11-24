// lib/listening/game.ts

import {
  LISTENING_GAME_BASE_XP_PER_CORRECT,
  LISTENING_GAME_STREAK_BONUS_MULTIPLIER,
  LISTENING_GAME_TIME_BONUS_MAX,
} from './constants';

export type ListeningGameMode = 'fast_ear' | 'clip_guess' | 'keyword_hunt';

export interface ListeningGameRoundResult {
  totalQuestions: number;
  correct: number;
  /** 0–1 ratio */
  accuracy: number;
  /** Seconds taken for the whole round */
  timeTakenSeconds: number;
  /** Target time (e.g. 60 seconds). Used to compute time bonus. */
  targetTimeSeconds: number;
  /** Current day streak for game mode */
  streakDays: number;
}

export interface ListeningGameScoreBreakdown {
  baseXp: number;
  streakBonusXp: number;
  timeBonusXp: number;
  totalXp: number;
}

export type ListeningGameBadge =
  | 'none'
  | 'listener_rookie'
  | 'listener_grinder'
  | 'fast_ear'
  | 'ice_cold'
  | 'unstoppable';

/**
 * Compute XP earned for a single game round.
 */
export function computeListeningGameScore(result: ListeningGameRoundResult): ListeningGameScoreBreakdown {
  const { totalQuestions, correct, timeTakenSeconds, targetTimeSeconds, streakDays } = result;

  if (totalQuestions <= 0 || correct < 0) {
    return {
      baseXp: 0,
      streakBonusXp: 0,
      timeBonusXp: 0,
      totalXp: 0,
    };
  }

  const accuracy = correct / totalQuestions;

  const baseXp = Math.round(LISTENING_GAME_BASE_XP_PER_CORRECT * correct);

  const streakBonusMultiplier = 1 + Math.min(streakDays * LISTENING_GAME_STREAK_BONUS_MULTIPLIER, 2);
  const streakBonusXp = Math.round(baseXp * (streakBonusMultiplier - 1));

  let timeBonusRatio = 0;
  if (timeTakenSeconds > 0 && targetTimeSeconds > 0) {
    const speedFactor = targetTimeSeconds / timeTakenSeconds;
    // >1 means faster than target, <1 means slower.
    timeBonusRatio = Math.min(Math.max(speedFactor - 1, 0), LISTENING_GAME_TIME_BONUS_MAX);
  }
  const timeBonusXp = Math.round(baseXp * timeBonusRatio);

  const totalXp = baseXp + streakBonusXp + timeBonusXp;

  return {
    baseXp,
    streakBonusXp,
    timeBonusXp,
    totalXp,
  };
}

/**
 * Basic badge logic for game results. You can evolve this into a proper
 * achievement system later, this is just a clean baseline.
 */
export function getListeningGameBadge(result: ListeningGameRoundResult): ListeningGameBadge {
  const { totalQuestions, correct, timeTakenSeconds, targetTimeSeconds, streakDays } = result;

  if (totalQuestions <= 0) return 'none';

  const accuracy = correct / totalQuestions;

  if (accuracy >= 0.9 && timeTakenSeconds <= targetTimeSeconds) {
    return 'ice_cold';
  }

  if (accuracy >= 0.85) {
    return 'fast_ear';
  }

  if (streakDays >= 7 && accuracy >= 0.6) {
    return 'unstoppable';
  }

  if (streakDays >= 3) {
    return 'listener_grinder';
  }

  if (accuracy >= 0.5) {
    return 'listener_rookie';
  }

  return 'none';
}
