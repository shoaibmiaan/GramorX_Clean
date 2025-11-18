import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { getServerClient } from '@/lib/supabaseServer';
import type { MockModuleId } from '@/types/mock';

import { getMockContent, getMockMeta, listMocksForModule } from '@/lib/mock/mockData';
import { getMockAttemptById, listMockAttempts } from '@/lib/mock/attempts';
import type { ModuleMockContent, ModuleMockMeta, ModuleMockHistoryItem } from '@/lib/mock/types';

export type ModuleIndexPageProps = {
  module: MockModuleId;
  mocks: ModuleMockMeta[];
  history: ModuleMockHistoryItem[];
};

export type ModuleOverviewPageProps = {
  module: MockModuleId;
  mock: ModuleMockMeta;
  mocks: ModuleMockMeta[];
};

export type ModuleRunPageProps = {
  module: MockModuleId;
  attemptId: string;
  mock: ModuleMockMeta;
  content: ModuleMockContent;
};

export type ModuleSubmittedPageProps = {
  module: MockModuleId;
  attempt: {
    id: string;
    mockId: string;
    submittedAt?: string | null;
    score?: Record<string, unknown> | null;
  };
  mock: ModuleMockMeta;
};

const ensureUser = async (ctx: GetServerSidePropsContext) => {
  const supabase = getServerClient(ctx.req, ctx.res);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { redirect: { destination: `/login?next=${encodeURIComponent(ctx.resolvedUrl ?? '/mock')}`, permanent: false } } as const;
  }
  return { supabase, user } as const;
};

export async function buildModuleIndexProps(
  ctx: GetServerSidePropsContext,
  module: MockModuleId,
): Promise<GetServerSidePropsResult<ModuleIndexPageProps>> {
  const auth = await ensureUser(ctx);
  if ('redirect' in auth) return auth;

  const mocks = listMocksForModule(module);
  const attempts = await listMockAttempts(auth.supabase, auth.user.id, module);
  const history: ModuleMockHistoryItem[] = attempts.map((attempt) => ({
    id: attempt.id,
    module: attempt.module,
    mockId: attempt.mock_id,
    mockTitle: getMockMeta(module, attempt.mock_id)?.title,
    status: attempt.status,
    startedAt: attempt.created_at,
    submittedAt: attempt.submitted_at,
    band: typeof attempt.score?.band === 'number' ? Number(attempt.score?.band) : null,
    scoreSummary: attempt.score ?? null,
  }));

  return { props: { module, mocks, history } };
}

export async function buildModuleOverviewProps(
  ctx: GetServerSidePropsContext,
  module: MockModuleId,
): Promise<GetServerSidePropsResult<ModuleOverviewPageProps>> {
  const auth = await ensureUser(ctx);
  if ('redirect' in auth) return auth;

  const mocks = listMocksForModule(module);
  const mockId = (ctx.query.mockId as string) || mocks[0]?.id;
  const mock = mockId ? getMockMeta(module, mockId) : mocks[0];
  if (!mock) {
    return { notFound: true };
  }

  return { props: { module, mock, mocks } };
}

export async function buildModuleRunProps(
  ctx: GetServerSidePropsContext,
  module: MockModuleId,
): Promise<GetServerSidePropsResult<ModuleRunPageProps>> {
  const auth = await ensureUser(ctx);
  if ('redirect' in auth) return auth;

  const attemptId = (ctx.query.attemptId as string) || (ctx.query.id as string);
  if (!attemptId) {
    const fallback = module === 'writing' ? '/writing/mock' : `/mock/${module}`;
    return {
      redirect: {
        destination: fallback,
        permanent: false,
      },
    };
  }

  const attempt = await getMockAttemptById(auth.supabase, attemptId, auth.user.id);
  if (!attempt || attempt.module !== module) {
    return {
      redirect: { destination: `/mock/${module}`, permanent: false },
    };
  }

  const mock = getMockMeta(module, attempt.mock_id);
  if (!mock) {
    return { notFound: true };
  }

  const content = getMockContent(module, attempt.mock_id);
  return { props: { module, attemptId: attempt.id, mock, content } };
}

export async function buildModuleSubmittedProps(
  ctx: GetServerSidePropsContext,
  module: MockModuleId,
): Promise<GetServerSidePropsResult<ModuleSubmittedPageProps>> {
  const auth = await ensureUser(ctx);
  if ('redirect' in auth) return auth;

  const attemptId = (ctx.query.attemptId as string) || (ctx.query.id as string);
  if (!attemptId) {
    return { redirect: { destination: `/mock/${module}`, permanent: false } };
  }

  const attempt = await getMockAttemptById(auth.supabase, attemptId, auth.user.id);
  if (!attempt || attempt.module !== module) {
    return { redirect: { destination: `/mock/${module}`, permanent: false } };
  }

  const mock = getMockMeta(module, attempt.mock_id);
  if (!mock) {
    return { notFound: true };
  }

  return {
    props: {
      module,
      attempt: { id: attempt.id, mockId: attempt.mock_id, submittedAt: attempt.submitted_at, score: attempt.score },
      mock,
    },
  };
}
