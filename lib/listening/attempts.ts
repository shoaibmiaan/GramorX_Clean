// lib/listening/attempts.ts

import type {
  ListeningAttempt,
  ListeningAttemptAnswer,
  ListeningMode,
} from './types';

type FetchOptions = {
  signal?: AbortSignal;
};

type StartAttemptRequest = {
  testSlug: string;
};

type StartAttemptResponse = {
  attempt: ListeningAttempt;
};

type SubmitAttemptRequest = {
  attemptId: string;
  answers: ListeningAttemptAnswer[];
  timeSpentSeconds: number;
};

type SubmitAttemptResponse = {
  attempt: ListeningAttempt;
};

type AutosaveRequest = {
  attemptId: string;
  answers: ListeningAttemptAnswer[];
  timeSpentSeconds: number;
};

type AutosaveResponse = {
  ok: true;
};

function getBasePath(mode: ListeningMode): string {
  if (mode === 'mock') return '/api/listening/mock';
  if (mode === 'practice') return '/api/listening/practice';
  return '/api/listening/game'; // reserved if you later support full attempts for game mode
}

/**
 * Start a listening attempt (practice or mock).
 */
export async function startListeningAttempt(
  mode: 'practice' | 'mock',
  body: StartAttemptRequest,
  options?: FetchOptions,
): Promise<ListeningAttempt> {
  const base = getBasePath(mode);
  const res = await fetch(`${base}/start`, {
    method: 'POST',
    signal: options?.signal,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to start listening ${mode} attempt (${res.status})`);
  }

  const json = (await res.json()) as StartAttemptResponse;
  return json.attempt;
}

/**
 * Submit a listening attempt and get evaluated result back.
 */
export async function submitListeningAttempt(
  mode: 'practice' | 'mock',
  body: SubmitAttemptRequest,
  options?: FetchOptions,
): Promise<ListeningAttempt> {
  const base = getBasePath(mode);
  const res = await fetch(`${base}/submit`, {
    method: 'POST',
    signal: options?.signal,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to submit listening ${mode} attempt (${res.status})`);
  }

  const json = (await res.json()) as SubmitAttemptResponse;
  return json.attempt;
}

/**
 * Autosave current state of a mock attempt.
 * We only support autosave for mock by design.
 */
export async function autosaveListeningMockAttempt(
  body: AutosaveRequest,
  options?: FetchOptions,
): Promise<boolean> {
  const res = await fetch('/api/listening/mock/autosave', {
    method: 'POST',
    signal: options?.signal,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Failed to autosave listening mock attempt (${res.status})`);
  }

  const json = (await res.json()) as AutosaveResponse;
  return json.ok;
}
