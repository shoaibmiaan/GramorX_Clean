// lib/listening/tests.ts

import type { ListeningTest, ListeningTestSummary } from './types';

type FetchOptions = {
  signal?: AbortSignal;
};

type TestListResponse = {
  tests: ListeningTestSummary[];
};

type TestDetailResponse = {
  test: ListeningTest;
};

/**
 * Fetch list of listening tests for a given mode.
 * mode = 'practice' → drills
 * mode = 'mock'     → full exam-style tests
 */
export async function fetchListeningTests(
  mode: 'practice' | 'mock',
  options?: FetchOptions,
): Promise<ListeningTestSummary[]> {
  const url = new URL('/api/listening/tests/list', window.location.origin);
  url.searchParams.set('mode', mode);

  const res = await fetch(url.toString(), {
    method: 'GET',
    signal: options?.signal,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Failed to load listening tests (${res.status})`);
  }

  const json = (await res.json()) as TestListResponse;
  return json.tests;
}

/**
 * Fetch a single test (with sections + questions) by slug.
 * Mode is still passed so backend can distinguish mock vs practice bank.
 */
export async function fetchListeningTestDetail(
  slug: string,
  mode: 'practice' | 'mock',
  options?: FetchOptions,
): Promise<ListeningTest> {
  const url = new URL('/api/listening/tests/detail', window.location.origin);
  url.searchParams.set('slug', slug);
  url.searchParams.set('mode', mode);

  const res = await fetch(url.toString(), {
    method: 'GET',
    signal: options?.signal,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Failed to load listening test (${res.status})`);
  }

  const json = (await res.json()) as TestDetailResponse;
  return json.test;
}
