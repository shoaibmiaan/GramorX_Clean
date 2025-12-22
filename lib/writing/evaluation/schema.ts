// lib/writing/evaluation/schema.ts
import { z } from 'zod';

const bandSchema = z
  .number()
  .min(0)
  .max(9)
  .refine((n) => Math.round(n * 2) === n * 2, { message: 'Band must be in 0.5 increments' });

const criteriaSchema = z.object({
  TR: bandSchema,
  CC: bandSchema,
  LR: bandSchema,
  GRA: bandSchema,
});

const cappedStringArray = (min = 1, max = 8) =>
  z
    .array(z.string().trim().min(min))
    .max(max)
    .optional()
    .default([]);

const taskSchema = z.object({
  band: bandSchema,
  criteria: criteriaSchema,
  strengths: cappedStringArray(),
  weaknesses: cappedStringArray(),
  fixes: cappedStringArray(),
  warnings: cappedStringArray(1, 10),
  reasoning: z.string().trim().min(4),
  short_verdict: z.string().trim().min(4).optional().default(''),
});

export const EvaluationSchema = z.object({
  evaluation_version: z.string().trim().min(3),
  overall_band: bandSchema,
  task1: taskSchema,
  task2: taskSchema,
  summary: cappedStringArray(1, 6),
  next_steps: cappedStringArray(1, 8),
});

export type ParsedEvaluation = z.infer<typeof EvaluationSchema>;
