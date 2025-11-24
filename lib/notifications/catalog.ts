export const NotificationEventKeys = {
  STREAK_WARNING: 'streak_warning',
  STREAK_HIT_MILESTONE: 'streak_hit_milestone',
  DAILY_REMINDER: 'daily_study_reminder',

  MOCK_COMPLETED_LISTENING: 'mock_completed_listening',
  MOCK_COMPLETED_READING: 'mock_completed_reading',
  MOCK_COMPLETED_WRITING: 'mock_completed_writing',
  MOCK_COMPLETED_SPEAKING: 'mock_completed_speaking',

  WRITING_SCORE_READY: 'writing_score_ready',
  SPEAKING_SCORE_READY: 'speaking_score_ready',
  BAND_PROGRESS_WEEKLY: 'band_progress_weekly',

  VOCAB_DAILY: 'vocab_daily_word',
  GRAMMAR_DRILL_READY: 'grammar_drill_ready',

  PLAN_EXPIRING_SOON: 'plan_expiring_soon',
  PLAN_PAYMENT_FAILED: 'plan_payment_failed',
  PLAN_UPGRADE_SUGGESTED: 'plan_upgrade_suggested',

  SECURITY_NEW_LOGIN: 'security_new_login',
  SECURITY_PASSWORD_CHANGED: 'security_password_changed',

  WEEKLY_REPORT: 'weekly_report_ready',
} as const;

export type NotificationEventKey =
  (typeof NotificationEventKeys)[keyof typeof NotificationEventKeys];
