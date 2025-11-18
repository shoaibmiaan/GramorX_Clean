import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { CreateNotificationInput, NotificationNudge } from './schemas/notifications';
import { getNotificationTemplate } from './notificationTemplates';

const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 100;

type NotificationRow = {
  id: string;
  message?: string | null;
  title?: string | null;
  body?: string | null;
  url?: string | null;
  metadata?: Record<string, any> | null;
  read?: boolean | null;
  created_at?: string | null;
  type?: string | null;
};

type ListOptions = {
  cursor?: string | null;
  limit?: number;
};

const fallbackMessage = 'Notification';

const normalizeIso = (value?: string | null) => {
  const date = value ? new Date(value) : new Date();
  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

const extractMessage = (row: NotificationRow) => {
  const parts = [row.message, row.title, row.body, row?.metadata?.message];
  for (const part of parts) {
    if (typeof part === 'string' && part.trim().length > 0) {
      return part;
    }
  }
  return fallbackMessage;
};

const extractUrl = (row: NotificationRow): string | null => {
  const candidates = [row.url, row?.metadata?.url];
  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed.length > 0) return trimmed;
    }
  }
  return null;
};

export class NotificationService {
  constructor(private supabase: SupabaseClient<Database>) {}

  private mapRow(row: NotificationRow): NotificationNudge {
    const createdAt = normalizeIso(row.created_at ?? undefined);
    return {
      id: row.id,
      message: extractMessage(row),
      url: extractUrl(row),
      read: Boolean(row.read),
      createdAt,
    };
  }

  private clampLimit(raw?: number) {
    if (!Number.isFinite(raw)) return DEFAULT_LIST_LIMIT;
    return Math.min(Math.max(Math.floor(raw as number), 1), MAX_LIST_LIMIT);
  }

  async createNotification(
    userId: string,
    input: CreateNotificationInput & {
      type?: string;
      data?: Record<string, any>;
      createdAt?: Date;
    },
  ): Promise<NotificationNudge> {
    const createdAt = input.createdAt ?? new Date();
    const payload = {
      user_id: userId,
      type: input.type ?? 'generic',
      title: input.message,
      message: input.message,
      body: input.message,
      url: input.url ?? null,
      metadata: input.data ?? null,
      read: false,
      created_at: createdAt.toISOString(),
    };

    const { data, error } = await this.supabase
      .from('notifications')
      .insert(payload)
      .select('id, title, body, message, metadata, url, read, created_at')
      .single<NotificationRow>();

    if (error || !data) {
      throw error ?? new Error('Failed to create notification');
    }

    return this.mapRow(data);
  }

  async listNotifications(
    userId: string,
    options: ListOptions = {},
  ): Promise<{ items: NotificationNudge[]; nextCursor: string | null; unreadCount: number }> {
    const limit = this.clampLimit(options.limit);
    let query = this.supabase
      .from('notifications')
      .select('id, title, body, message, metadata, url, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (options.cursor) {
      query = query.lt('created_at', options.cursor);
    }

    const { data, error } = await query;
    if (error) throw error;

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const items = rows.slice(0, limit).map((row) => this.mapRow(row));
    const nextCursor = hasMore ? rows[limit]?.created_at ?? null : null;

    const { count: unreadCount, error: countError } = await this.supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (countError) throw countError;

    return {
      items,
      nextCursor: nextCursor ? normalizeIso(nextCursor) : null,
      unreadCount: unreadCount ?? 0,
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('id', notificationId);

    if (error) throw error;
  }

  async markAllAsRead(userId: string) {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  }

  async createNotificationFromTemplate(
    userId: string,
    templateKey: string,
    variables?: Record<string, any>,
    options?: { createdAt?: Date },
  ): Promise<NotificationNudge> {
    const template = getNotificationTemplate(templateKey, variables);

    return this.createNotification(userId, {
      message: template.message,
      url: template.url,
      type: template.event_key,
      data: template.payload,
      createdAt: options?.createdAt,
    });
  }

  async bulkCreateNotifications(
    userId: string,
    notifications: Array<{
      templateKey: string;
      variables?: Record<string, any>;
      created_at?: Date;
    }>,
  ): Promise<NotificationNudge[]> {
    const results: NotificationNudge[] = [];

    for (const notification of notifications) {
      try {
        const result = await this.createNotificationFromTemplate(
          userId,
          notification.templateKey,
          notification.variables,
          { createdAt: notification.created_at },
        );
        results.push(result);

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to create notification ${notification.templateKey}:`, error);
      }
    }

    return results;
  }

  async seedUserNotifications(userId: string): Promise<void> {
    const notifications = [
      { templateKey: 'WELCOME' },
      { templateKey: 'PROFILE_COMPLETE' },
      { templateKey: 'FIRST_LOGIN' },
      { templateKey: 'LEARNING_PATH' },
      {
        templateKey: 'COURSE_ENROLLED',
        variables: { course_name: 'Introduction to Programming', course_id: 'prog-101' },
      },
      {
        templateKey: 'COURSE_PROGRESS_25',
        variables: { course_name: 'Introduction to Programming', course_id: 'prog-101' },
      },
      {
        templateKey: 'COURSE_PROGRESS_50',
        variables: { course_name: 'Introduction to Programming', course_id: 'prog-101' },
      },
      {
        templateKey: 'COURSE_PROGRESS_75',
        variables: { course_name: 'Introduction to Programming', course_id: 'prog-101' },
      },
      {
        templateKey: 'COURSE_COMPLETED',
        variables: { course_name: 'Introduction to Programming', course_id: 'prog-101' },
      },
      { templateKey: 'FIRST_COURSE_COMPLETE' },
      { templateKey: 'LEARNING_STREAK_3' },
      { templateKey: 'LEARNING_STREAK_7' },
      {
        templateKey: 'ACHIEVEMENT_UNLOCKED',
        variables: { achievement_name: 'Fast Learner' },
      },
      {
        templateKey: 'PERFECT_QUIZ',
        variables: { quiz_name: 'Python Basics Quiz' },
      },
      {
        templateKey: 'COURSE_ENROLLED',
        variables: { course_name: 'Web Development Fundamentals', course_id: 'web-101' },
      },
      {
        templateKey: 'COURSE_ENROLLED',
        variables: { course_name: 'Data Science Essentials', course_id: 'ds-101' },
      },
      {
        templateKey: 'WEEKLY_PROGRESS',
        variables: { completed_lessons: 12, study_time: 8 },
      },
      {
        templateKey: 'MONTHLY_REVIEW',
        variables: { courses_completed: 3 },
      },
      {
        templateKey: 'FOLLOWED',
        variables: { follower_name: 'Alex Johnson' },
      },
      {
        templateKey: 'POST_LIKED',
        variables: { user_name: 'Maria Garcia', post_title: 'My learning journey so far' },
      },
      {
        templateKey: 'STUDY_GROUP_INVITE',
        variables: { group_name: 'Python Learners Club' },
      },
    ];

    await this.bulkCreateNotifications(userId, notifications);
  }
}
