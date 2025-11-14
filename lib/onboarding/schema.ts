// lib/onboarding/schema.ts
import { z } from 'zod';

/**
 * Language step
 */
export const LanguageBody = z.object({
  language: z.enum(['en', 'ur']),
});

export type LanguageBodyInput = z.infer<typeof LanguageBody>;

/**
 * Target band step
 */
export const TargetBandBody = z.object({
  targetBand: z
    .number()
    .min(4, 'Band must be at least 4.0')
    .max(9, 'Band must be at most 9.0'),
});

export type TargetBandBodyInput = z.infer<typeof TargetBandBody>;

/**
 * Exam date step
 */
export const ExamDateBody = z.object({
  timeframe: z.enum(['0-30', '30-60', '60-90', '90-plus', 'not-booked']),
  examDate: z
    .string()
    .datetime({ offset: false })
    .optional()
    .or(z.literal('').transform(() => undefined))
    .optional(),
});

/**
 * If you prefer yyyy-mm-dd without time, use this instead:
 *
 * export const ExamDateBody = z.object({
 *   timeframe: z.enum(['0-30', '30-60', '60-90', '90-plus', 'not-booked']),
 *   examDate: z
 *     .string()
 *     .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')
 *     .optional(),
 * });
 */

export type ExamDateBodyInput = z.infer<typeof ExamDateBody>;

/**
 * Study rhythm step
 */
export const StudyRhythmBody = z.object({
  rhythm: z.enum(['daily', '5days', 'weekends', 'flexible', 'intensive']),
});

export type StudyRhythmBodyInput = z.infer<typeof StudyRhythmBody>;

/**
 * Notifications step
 */
export const NotificationChannelEnum = z.enum(['email', 'push', 'whatsapp']);

export const NotificationsBody = z.object({
  channels: z
    .array(NotificationChannelEnum)
    .min(1, 'At least one channel is required'),
  preferredTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Expected HH:MM')
    .optional(),
});

export type NotificationsBodyInput = z.infer<typeof NotificationsBody>;
