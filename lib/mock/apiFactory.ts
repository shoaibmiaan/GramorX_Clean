import type { NextApiHandler, NextApiResponse } from 'next';
import { z } from 'zod';

import { publishNotificationEvent } from '@/lib/notifications/publish';
import { getServerClient } from '@/lib/supabaseServer';
import type { MockModuleId } from '@/types/mock';

import { createMockAttempt, getMockAttemptById, listMockAttempts, updateMockAttempt } from './attempts';
import { getMockContent, getMockMeta, listMocksForModule } from './mockData';
import { scoreAttempt } from './scoring';

const methodNotAllowed = (res: NextApiResponse, methods: string[]) => {
  res.setHeader('Allow', methods);
  res.status(405).json({ error: 'Method not allowed' });
};

const AttemptParams = z.object({ attemptId: z.string().uuid() });

const ListeningSubmitSchema = z.object({
  attemptId: z.string().uuid(),
  answers: z.record(z.string(), z.union([z.string(), z.number(), z.array(z.string())])).default({}),
  timeSpentSeconds: z.number().int().nonnegative().optional(),
});

const WritingSubmitSchema = z.object({
  attemptId: z.string().uuid(),
  task1Text: z.string().min(10, 'Task 1 must not be empty'),
  task2Text: z.string().min(10, 'Task 2 must not be empty'),
  timeSpentSeconds: z.number().int().nonnegative().optional(),
});

const SpeakingSubmitSchema = z.object({
  attemptId: z.string().uuid(),
  transcript: z.string().optional(),
  notes: z.string().optional(),
  audioUrl: z.string().url().optional(),
});

const moduleSubmitSchema = (module: MockModuleId) => {
  if (module === 'writing') return WritingSubmitSchema;
  if (module === 'speaking') return SpeakingSubmitSchema;
  return ListeningSubmitSchema;
};

export const createListHandler = (module: MockModuleId): NextApiHandler =>
  async (req, res) => {
    if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

    const supabase = getServerClient(req, res);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: 'Auth required' });
    }

    const items = listMocksForModule(module);
    return res.status(200).json({ module, items });
  };

export const createStartHandler = (module: MockModuleId): NextApiHandler =>
  async (req, res) => {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

    const supabase = getServerClient(req, res);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: 'Auth required' });
    }

    const Body = z.object({ mockId: z.string() });
    const { mockId } = Body.parse(req.body);
    const meta = getMockMeta(module, mockId);
    if (!meta) {
      return res.status(404).json({ error: 'Mock not found' });
    }

    const attempt = await createMockAttempt(supabase, {
      userId: user.id,
      module,
      mockId,
      durationSeconds: meta.durationMinutes * 60,
    });

    return res.status(200).json({ attemptId: attempt.id, mockId });
  };

export const createAttemptHandler = (module: MockModuleId): NextApiHandler =>
  async (req, res) => {
    if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

    const supabase = getServerClient(req, res);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: 'Auth required' });
    }

    const { attemptId } = AttemptParams.parse(req.query);
    const attempt = await getMockAttemptById(supabase, attemptId, user.id);
    if (!attempt || attempt.module !== module) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const content = getMockContent(module, attempt.mock_id);
    const meta = getMockMeta(module, attempt.mock_id);

    return res.status(200).json({ attempt, meta, content });
  };

export const createSubmitHandler = (module: MockModuleId): NextApiHandler =>
  async (req, res) => {
    if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

    const supabase = getServerClient(req, res);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: 'Auth required' });
    }

    const Schema = moduleSubmitSchema(module);
    const payload = Schema.parse(req.body ?? {});

    const attempt = await getMockAttemptById(supabase, payload.attemptId, user.id);
    if (!attempt || attempt.module !== module) {
      return res.status(404).json({ error: 'Attempt not found' });
    }

    const { content } = getMockContent(module, attempt.mock_id);
    const score = scoreAttempt(module, content, payload as Record<string, unknown>);
    const submittedAt = new Date().toISOString();

    await updateMockAttempt(supabase, {
      attemptId: attempt.id,
      userId: user.id,
      status: 'scored',
      answers: payload as Record<string, unknown>,
      score: { ...score, module },
      submittedAt,
    });

    await publishNotificationEvent(supabase, {
      type: 'mock_submitted',
      userId: user.id,
      payload: { module, attemptId: attempt.id, mockId: attempt.mock_id },
    });

    await publishNotificationEvent(supabase, {
      type: 'mock_result_ready',
      userId: user.id,
      payload: { module, attemptId: attempt.id, mockId: attempt.mock_id },
    });

    return res.status(200).json({ ok: true, score });
  };

export const createHistoryHandler = (module: MockModuleId): NextApiHandler =>
  async (req, res) => {
    if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

    const supabase = getServerClient(req, res);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return res.status(401).json({ error: 'Auth required' });
    }

    const attempts = await listMockAttempts(supabase, user.id, module);
    const response = attempts.map((attempt) => ({
      id: attempt.id,
      mockId: attempt.mock_id,
      module: attempt.module,
      status: attempt.status,
      startedAt: attempt.created_at,
      submittedAt: attempt.submitted_at,
      score: attempt.score,
    }));

    return res.status(200).json({ items: response });
  };
