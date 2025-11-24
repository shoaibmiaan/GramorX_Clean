import { z } from 'zod';

const supportedLanguageCodes = ['en', 'ur'] as const;

export const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'اردو' },
] as const;

const LanguageEnum = z.enum(supportedLanguageCodes);
const StudyDayEnum = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const);
const PhoneSchema = z.union([z.string().min(6).max(32), z.literal('')]);
const ExamTimeframeEnum = z.enum(
  ['0-30', '30-60', '60-90', '90-plus', 'not-booked'] as const,
);

export const NotificationChannelEnum = z.enum(
  ['email', 'whatsapp', 'in-app'] as const,
);
export type NotificationChannel = z.infer<typeof NotificationChannelEnum>;

export const ExamDateBody = z.object({
  timeframe: ExamTimeframeEnum,
  examDate: z.string().optional().nullable(),
});
export type ExamDateBodyInput = z.infer<typeof ExamDateBody>;

export const LanguageBody = z.object({
  language: LanguageEnum,
});
export type LanguageBodyInput = z.infer<typeof LanguageBody>;

export const NotificationsBody = z.object({
  channels: z.array(NotificationChannelEnum).min(1),
  preferredTime: z.string().optional().nullable(),
});
export type NotificationsBodyInput = z.infer<typeof NotificationsBody>;

export const StudyRhythmBody = z.object({
  rhythm: z.enum(['daily', '5days', 'weekends', 'flexible', 'intensive'] as const),
});
export type StudyRhythmBodyInput = z.infer<typeof StudyRhythmBody>;

export const TargetBandBody = z.object({
  targetBand: z.enum(['5.5', '6.0', '6.5', '7.0', '7.5+'] as const),
});
export type TargetBandBodyInput = z.infer<typeof TargetBandBody>;

export const onboardingStateSchema = z.object({
  preferredLanguage: LanguageEnum.nullable(),
  goalBand: z.number().min(4).max(9).nullable(),
  examDate: z.string().nullable(),
  studyDays: z.array(StudyDayEnum).min(1).nullable(),
  studyMinutesPerDay: z.number().int().min(10).max(360).nullable(),
  whatsappOptIn: z.boolean().nullable(),
  phone: PhoneSchema.nullable(),
  onboardingStep: z.number().int().min(0),
  onboardingComplete: z.boolean(),
});

export type OnboardingState = z.infer<typeof onboardingStateSchema>;

const StepOneSchema = z.object({
  step: z.literal(1),
  data: z.object({
    preferredLanguage: LanguageEnum,
  }),
});

const StepTwoSchema = z.object({
  step: z.literal(2),
  data: z.object({
    goalBand: z.number().min(4).max(9),
  }),
});

const StepThreeSchema = z.object({
  step: z.literal(3),
  data: z.object({
    examDate: z.union([z.string(), z.null()]).optional().nullable(),
  }),
});

const StepFourSchema = z.object({
  step: z.literal(4),
  data: z.object({
    studyDays: z.array(StudyDayEnum).min(1),
    minutesPerDay: z.number().int().min(10).max(360),
  }),
});

const StepFiveSchema = z.object({
  step: z.literal(5),
  data: z.object({
    whatsappOptIn: z.boolean(),
    phone: z.string().trim().optional().nullable(),
  }),
});

export const onboardingStepPayloadSchema = z.discriminatedUnion('step', [
  StepOneSchema,
  StepTwoSchema,
  StepThreeSchema,
  StepFourSchema,
  StepFiveSchema,
]);

export type OnboardingStepPayload = z.infer<typeof onboardingStepPayloadSchema>;

export const TOTAL_ONBOARDING_STEPS = 5;

export const languageOptionsEnum = LanguageEnum;
export const studyDayOptionsEnum = StudyDayEnum;
