export type NotificationEventType =
  | 'mock_submitted'
  | 'mock_result_ready'
  | 'streak_warning'
  | 'plan_upgraded'
  | 'new_mock_unlocked';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type BaseNotificationPayload = {
  mockId?: string;
  attemptId?: string;
  module?: 'listening' | 'reading' | 'writing' | 'speaking';
  streakDays?: number;
  planId?: string;
  unlockedMockId?: string;
  [key: string]: string | number | boolean | null | undefined;
};

export interface NotificationEvent {
  type: NotificationEventType;
  userId: string;
  payload?: BaseNotificationPayload;
  createdAt?: string;
}

export type NotificationRecord = {
  id: string;
  user_id: string;
  message: string;
  url: string | null;
  read: boolean;
  created_at: string;
  updated_at?: string | null;
  title?: string | null;
  type?: string | null;
  metadata?: Json | null;
};
