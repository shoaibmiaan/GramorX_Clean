import { z } from 'zod';

const Band = z.number().min(0).max(9).refine((n) => Math.round(n * 2) === n * 2, {
  message: 'Band must be in 0.5 steps',
});

export const WritingEvaluationSchema = z.object({
  confidence_level: z.enum(['low', 'medium', 'high']),
  evaluation_version: z.string().min(3),

  overall_band: Band,
  task1_band: Band.nullable(),
  task2_band: Band,

  task1_tr: Band.nullable(),
  task1_cc: Band.nullable(),
  task1_lr: Band.nullable(),
  task1_gra: Band.nullable(),

  task2_tr: Band,
  task2_cc: Band,
  task2_lr: Band,
  task2_gra: Band,

  strengths: z.string().min(5),
  weaknesses: z.string().min(5),
  improvement_actions: z.string().min(5),

  warnings: z.array(z.string()).default([]),
});

export type WritingEvaluation = z.infer<typeof WritingEvaluationSchema>;
