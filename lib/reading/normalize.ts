// lib/reading/normalizeTest.ts

export type NormalizedReadingTest = {
  id: string;
  slug: string;
  title: string;
  examType: 'academic' | 'gt' | 'unknown';
  durationSeconds: number;
  totalQuestions: number;
  totalPassages: number;
};

type AnyObj = Record<string, any>;

export type NormalizeReadingTestOptions = {
  // for drills you usually want a short timer
  mode?: 'mock' | 'drill' | 'daily' | 'weekly' | 'ai';

  // hard overrides when caller knows better
  defaultDurationSeconds?: number; // fallback timer
  defaultTotalQuestions?: number;
  defaultTotalPassages?: number;

  // optional: pass drill presets
  drillPreset?: 'speed' | 'accuracy' | 'mixed';
};

const toNumber = (v: any) => {
  const n = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(n) ? (n as number) : null;
};

const normalizeExamType = (v: any): NormalizedReadingTest['examType'] => {
  const s = String(v ?? '').toLowerCase();
  if (s === 'academic' || s === 'ac') return 'academic';
  if (s === 'gt' || s === 'general' || s === 'general training') return 'gt';
  return 'unknown';
};

const drillDefaultDuration = (preset?: NormalizeReadingTestOptions['drillPreset']) => {
  // tweak these anytime; they’re sane defaults
  if (preset === 'speed') return 10 * 60;     // 10 min
  if (preset === 'accuracy') return 15 * 60;  // 15 min
  return 12 * 60;                              // mixed
};

export const normalizeReadingTest = (
  input: any,
  opts: NormalizeReadingTestOptions = {}
): NormalizedReadingTest => {
  const o = (input ?? {}) as AnyObj;

  // duration: prefer explicit → camelCase → snake_case → drill preset → mode default → global default
  const durationFromData =
    toNumber(o.durationSeconds) ??
    toNumber(o.duration_seconds) ??
    null;

  const modeDefault =
    opts.mode === 'drill'
      ? drillDefaultDuration(opts.drillPreset)
      : opts.mode === 'daily'
        ? 20 * 60
        : opts.mode === 'weekly'
          ? 60 * 60
          : 60 * 60;

  const durationSeconds =
    opts.defaultDurationSeconds ??
    durationFromData ??
    modeDefault ??
    3600;

  const totalQuestions =
    opts.defaultTotalQuestions ??
    toNumber(o.totalQuestions) ??
    toNumber(o.total_questions) ??
    40;

  const totalPassages =
    opts.defaultTotalPassages ??
    toNumber(o.totalPassages) ??
    toNumber(o.total_passages) ??
    3;

  return {
    id: String(o.id ?? 'unknown'),
    slug: String(o.slug ?? o.testSlug ?? 'reading'),
    title: String(o.title ?? o.name ?? 'Reading Test'),
    examType: normalizeExamType(o.examType ?? o.exam_type),
    durationSeconds,
    totalQuestions,
    totalPassages,
  };
};
