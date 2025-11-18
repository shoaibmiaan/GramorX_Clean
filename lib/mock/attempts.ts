import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, MockAttempt } from '@/types/supabase';
import type { MockAttemptStatus, MockModuleId } from '@/types/mock';

const TABLE = 'mock_attempts';

type Client = SupabaseClient<Database>;

type CreateParams = {
  userId: string;
  module: MockModuleId;
  mockId: string;
  durationSeconds?: number | null;
  metadata?: Record<string, unknown> | null;
};

type UpdateParams = {
  attemptId: string;
  userId: string;
  status?: MockAttemptStatus;
  answers?: Record<string, unknown>;
  score?: Record<string, unknown>;
  submittedAt?: string;
};

const isBuilder = (query: unknown): query is { select: (...args: any[]) => any } =>
  typeof query === 'object' && query !== null && 'select' in query;

const runSingle = async <T,>(query: any) => {
  if (query && typeof query.single === 'function') {
    return query.single();
  }
  if (query && typeof query.maybeSingle === 'function') {
    return query.maybeSingle();
  }
  return query;
};

export async function createMockAttempt(client: Client, params: CreateParams) {
  const baseInsert = client.from(TABLE).insert({
    user_id: params.userId,
    module: params.module,
    mock_id: params.mockId,
    duration_seconds: params.durationSeconds ?? null,
    metadata: params.metadata ?? null,
  });

  const { data, error } = await (isBuilder(baseInsert)
    ? runSingle<MockAttempt>(baseInsert.select('*'))
    : baseInsert);

  if (error) {
    throw error;
  }

  return data as MockAttempt;
}

export async function getMockAttemptById(client: Client, attemptId: string, userId?: string) {
  let query = client.from(TABLE).select('*').eq('id', attemptId).limit(1);
  if (userId) {
    query = query.eq('user_id', userId);
  }
  const { data, error } = await runSingle<MockAttempt>(query);
  if (error) {
    throw error;
  }
  return data ?? null;
}

export async function listMockAttempts(client: Client, userId: string, module: MockModuleId) {
  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .eq('user_id', userId)
    .eq('module', module)
    .order('created_at', { ascending: false })
    .limit(25);

  if (error) {
    throw error;
  }
  return data ?? [];
}

export async function updateMockAttempt(client: Client, params: UpdateParams) {
  const payload: Record<string, unknown> = {};
  if (params.status) payload.status = params.status;
  if (params.answers) payload.answers = params.answers;
  if (params.score) payload.score = params.score;
  if (params.submittedAt) payload.submitted_at = params.submittedAt;

  const updateQuery = client
    .from(TABLE)
    .update(payload)
    .eq('id', params.attemptId)
    .eq('user_id', params.userId);

  const { data, error } = await (isBuilder(updateQuery)
    ? runSingle<MockAttempt>(updateQuery.select('*'))
    : updateQuery);

  if (error) {
    throw error;
  }

  return data as MockAttempt;
}
