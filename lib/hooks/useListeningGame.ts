// lib/hooks/useListeningGame.ts
import { useState, useEffect, useCallback } from 'react';
import type { ListeningGameMode, ListeningGameRoundResult, ListeningGameScoreBreakdown } from '@/lib/listening/game';
import { computeListeningGameScore, getListeningGameBadge } from '@/lib/listening/game';

type ListeningGameStatus = 'idle' | 'running' | 'finished';

type UseListeningGameOptions = {
  mode: ListeningGameMode;
  /** total questions in this round */
  totalQuestions: number;
  /** target time for the whole round in seconds */
  targetTimeSeconds: number;
  /** current streak days for game mode */
  streakDays: number;
  /** optional initial time (e.g. resume) */
  initialElapsedSeconds?: number;
};

type UseListeningGameReturn = {
  status: ListeningGameStatus;
  elapsedSeconds: number;
  targetTimeSeconds: number;
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  start: () => void;
  markCorrect: () => void;
  markIncorrect: () => void;
  finish: () => ListeningGameRoundResult & {
    breakdown: ListeningGameScoreBreakdown;
    badge: ReturnType<typeof getListeningGameBadge>;
  } | null;
};

/**
 * Lightweight hook to manage a listening "game" round:
 * - tracks elapsed time
 * - tracks correct / attempted
 * - computes XP + badge at the end
 *
 * It does NOT talk to backend. Leaderboards etc will be wired separately.
 */
export function useListeningGame(options: UseListeningGameOptions): UseListeningGameReturn {
  const {
    totalQuestions,
    targetTimeSeconds,
    streakDays,
    initialElapsedSeconds = 0,
  } = options;

  const [status, setStatus] = useState<ListeningGameStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(initialElapsedSeconds);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);

  const start = useCallback(() => {
    if (status === 'idle') {
      setStatus('running');
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'running') return;

    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      window.clearInterval(id);
    };
  }, [status]);

  const markCorrect = useCallback(() => {
    if (status !== 'running') return;
    setAnsweredCount((prev) => prev + 1);
    setCorrectCount((prev) => prev + 1);
  }, [status]);

  const markIncorrect = useCallback(() => {
    if (status !== 'running') return;
    setAnsweredCount((prev) => prev + 1);
  }, [status]);

  const finish = useCallback(() => {
    if (status === 'finished') {
      // already finished, recompute from state
    } else if (status !== 'running' && status !== 'idle') {
      return null;
    }

    setStatus('finished');

    const result: ListeningGameRoundResult = {
      totalQuestions,
      correct: correctCount,
      accuracy: totalQuestions > 0 ? correctCount / totalQuestions : 0,
      timeTakenSeconds: elapsedSeconds,
      targetTimeSeconds,
      streakDays,
    };

    const breakdown = computeListeningGameScore(result);
    const badge = getListeningGameBadge(result);

    return {
      ...result,
      breakdown,
      badge,
    };
  }, [status, totalQuestions, correctCount, elapsedSeconds, targetTimeSeconds, streakDays]);

  return {
    status,
    elapsedSeconds,
    targetTimeSeconds,
    totalQuestions,
    answeredCount,
    correctCount,
    start,
    markCorrect,
    markIncorrect,
    finish,
  };
}
