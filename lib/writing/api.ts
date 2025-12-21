// lib/writing/api.ts
// Server-safe data access helpers for Writing results.

import { getServerClient } from '@/lib/supabaseServer';
import type { WritingAnswer, WritingAttemptMeta, WritingEvaluation } from './types';

type RawRecord = Record<string, unknown>;

const pickFirstKey = (obj: RawRecord, keys: string[]) => {
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) return k;
  }
  return null;
};

const getStr = (obj: RawRecord, key: string | null, fallback = '') => {
  if (!key) return fallback;
  const v = obj?.[key];
  return v == null ? fallback : String(v);
};

const getBool = (obj: RawRecord, key: string | null, fallback = false) => {
  if (!key) return fallback;
  const v = obj?.[key];
  return Boolean(v);
};

const getNullableIso = (obj: RawRecord, key: string | null) => {
  if (!key) return null;
  const v = obj?.[key];
  return v ? String(v) : null;
};

const safeNum = (v: unknown, fallback = 0) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export async function getWritingAttempt(attemptId: string, req?: any, res?: any) {
  const supabase = getServerClient(req, res);
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    return { attempt: null, viewerHasAccess: false };
  }

  const attemptTablesToTry = ['writing_attempts', 'attempts_writing'];
  let attemptRow: RawRecord | null = null;

  for (const table of attemptTablesToTry) {
    const resAttempt = await supabase.from(table as any).select('*').eq('id', attemptId).maybeSingle();
    if (resAttempt.data) {
      attemptRow = resAttempt.data as RawRecord;
      break;
    }
  }

  if (!attemptRow) {
    return { attempt: null, viewerHasAccess: false };
  }

  const ownerKey = pickFirstKey(attemptRow, ['user_id', 'uid', 'profile_id', 'owner_id']);
  const viewerHasAccess = Boolean(ownerKey) && String(attemptRow[ownerKey ?? '']) === String(user.id);

  if (!viewerHasAccess) return { attempt: null, viewerHasAccess: false };

  const testIdKey = pickFirstKey(attemptRow, ['test_id', 'writing_test_id', 'mock_test_id']);
  const statusKey = pickFirstKey(attemptRow, ['status', 'attempt_status']);
  const submittedAtKey = pickFirstKey(attemptRow, ['submitted_at', 'submittedAt', 'submitted_on']);
  const autoSubmittedKey = pickFirstKey(attemptRow, ['auto_submitted', 'autoSubmitted', 'auto_submit']);
  const testSlugKey = pickFirstKey(attemptRow, ['test_slug', 'slug', 'writing_test_slug', 'mock_slug']);
  const testTitleKey = pickFirstKey(attemptRow, ['test_title', 'title', 'mock_title']);

  let testTitle = getStr(attemptRow, testTitleKey, '') || 'Writing Mock';
  let testSlug: string | null = (getStr(attemptRow, testSlugKey, '') || null) as string | null;

  const testId = getStr(attemptRow, testIdKey, '');
  if (testId) {
    const testTables = ['writing_tests', 'writing_mock_tests'];
    for (const t of testTables) {
      const tr = await supabase.from(t as any).select('slug, title').eq('id', testId).maybeSingle();
      if (tr.data) {
        testTitle = String((tr.data as RawRecord).title ?? testTitle);
        testSlug = String((tr.data as RawRecord).slug ?? testSlug ?? '');
        break;
      }
    }
  }

  if (testSlug && !String(testSlug).trim()) testSlug = null;

  const attempt: WritingAttemptMeta = {
    attemptId,
    testTitle,
    testSlug,
    submittedAt: getNullableIso(attemptRow, submittedAtKey),
    autoSubmitted: getBool(attemptRow, autoSubmittedKey, false),
    status: getStr(attemptRow, statusKey, ''),
  };

  return { attempt, viewerHasAccess };
}

export async function getWritingEvaluation(attemptId: string, req?: any, res?: any) {
  const supabase = getServerClient(req, res);

  const answersTablesToTry = [
    { table: 'writing_attempt_answers', map: { task: 'task_number', text: 'answer_text', wc: 'word_count' } },
    { table: 'attempts_writing_answers', map: { task: 'task_number', text: 'answer_text', wc: 'word_count' } },
    { table: 'writing_user_answers', map: { task: 'task_number', text: 'text', wc: 'word_count' } },
    { table: 'attempts_writing_user_answers', map: { task: 'task_number', text: 'text', wc: 'word_count' } },
  ];

  let answers: WritingAnswer[] = [];

  for (const a of answersTablesToTry) {
    const resAnswers = await supabase
      .from(a.table as any)
      .select('*')
      .eq('attempt_id', attemptId)
      .order(a.map.task, { ascending: true });

    if (Array.isArray(resAnswers.data) && resAnswers.data.length > 0) {
      answers = resAnswers.data.map((r: RawRecord) => {
        const tn: 1 | 2 = r[a.map.task] === 2 ? 2 : 1;
        return {
          taskNumber: tn,
          label: tn === 2 ? 'Task 2' : 'Task 1',
          text: String(r[a.map.text] ?? ''),
          wordCount: safeNum(r[a.map.wc], 0),
        } as WritingAnswer;
      });
      break;
    }
  }

  const evalTablesToTry = ['writing_evaluations', 'writing_ai_evaluations'];
  let evalRow: RawRecord | null = null;

  for (const t of evalTablesToTry) {
    const er = await supabase.from(t as any).select('*').eq('attempt_id', attemptId).maybeSingle();
    if (er.data) {
      evalRow = er.data as RawRecord;
      break;
    }
  }

  if (!evalRow) {
    return { answers, evaluation: null };
  }

  const criteriaNotesRaw = evalRow.criteria_notes as unknown;
  const criteriaNotes =
    typeof criteriaNotesRaw === 'object' && criteriaNotesRaw !== null ? criteriaNotesRaw : {};

  const evaluation: WritingEvaluation = {
    attemptId,
    overallBand: safeNum(evalRow.overall_band, 0),
    task1: {
      taskNumber: 1,
      band: safeNum(evalRow.task1_band, 0),
      shortVerdict: evalRow.short_verdict_task1 ? String(evalRow.short_verdict_task1) : undefined,
    },
    task2: {
      taskNumber: 2,
      band: safeNum(evalRow.task2_band, 0),
      shortVerdict: evalRow.short_verdict_task2 ? String(evalRow.short_verdict_task2) : undefined,
    },
    criteria: {
      TR: {
        key: 'TR',
        band: safeNum((evalRow as RawRecord).criteria_tr, 0),
        notes: Array.isArray((criteriaNotes as RawRecord).TR) ? ((criteriaNotes as RawRecord).TR as string[]) : [],
      },
      CC: {
        key: 'CC',
        band: safeNum((evalRow as RawRecord).criteria_cc, 0),
        notes: Array.isArray((criteriaNotes as RawRecord).CC) ? ((criteriaNotes as RawRecord).CC as string[]) : [],
      },
      LR: {
        key: 'LR',
        band: safeNum((evalRow as RawRecord).criteria_lr, 0),
        notes: Array.isArray((criteriaNotes as RawRecord).LR) ? ((criteriaNotes as RawRecord).LR as string[]) : [],
      },
      GRA: {
        key: 'GRA',
        band: safeNum((evalRow as RawRecord).criteria_gra, 0),
        notes: Array.isArray((criteriaNotes as RawRecord).GRA)
          ? ((criteriaNotes as RawRecord).GRA as string[])
          : [],
      },
    },
    warnings: Array.isArray(evalRow.warnings) ? (evalRow.warnings as string[]) : [],
    warningNotes: Array.isArray(evalRow.warning_notes) ? (evalRow.warning_notes as string[]) : undefined,
    nextSteps: Array.isArray(evalRow.next_steps) ? (evalRow.next_steps as string[]) : [],
  };

  return { answers, evaluation };
}
