// lib/notificationService.ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type {
  CreateNotificationInput,
  NotificationNudge,
} from './schemas/notifications';
import {
  getNotificationTemplate,
  type NotificationTemplate,
} from './notificationTemplates';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert =
  Database['public']['Tables']['notifications']['Insert'];

type ListResult = {
  items: NotificationNudge[];
  nextCursor: string | null;
  unreadCount: number;
};

export class NotificationService {
  constructor(private supabase: SupabaseClient<Database>) {}

  private mapRow(row: NotificationRow): NotificationNudge {
    return {
      id: row.id,
      message: row.message ?? 'Notification',
      url: row.url && row.url.trim() !== '' ? row.url : null,
      read: Boolean(row.read),
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : typeof row.created_at === 'string' &&
            !isNaN(Date.parse(row.created_at))
          ? new Date(row.created_at).toISOString()
          : new Date().toISOString(),
    };
  }

  async listNotifications(
    userId: string,
    options: { cursor?: string | null; limit?: number } = {},
  ): Promise<ListResult> {
    const limit = options.limit ?? 20;
    const cursor = options.cursor ?? null;

    let query = this.supabase
      .from('notifications')
      .select('id, message, url, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;
    if (error) throw error;

    const notifications = (data ?? []).map((row) =>
      this.mapRow(row as NotificationRow),
    );
    const items = notifications.slice(0, limit);
    const hasMore = notifications.length > limit;
    const nextCursor = hasMore ? items[items.length - 1]?.createdAt ?? null : null;

    const { count: unreadCount = 0, error: unreadError } = await this.supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (unreadError) throw unreadError;

    return { items, nextCursor, unreadCount };
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select('id')
      .single();

    if (error) throw error;
    if (!data) throw new Error('Notification not found');
  }

  async createNotification(
    userId: string,
    input: CreateNotificationInput,
    options: { createdAt?: Date } = {},
  ): Promise<NotificationNudge> {
    const payload: NotificationInsert = {
      user_id: userId,
      message: input.message,
      url: input.url ?? null,
      created_at: options.createdAt ?? undefined,
    };

    const { data, error } = await this.supabase
      .from('notifications')
      .insert(payload)
      .select('id, message, url, read, created_at')
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create notification');

    return this.mapRow(data as NotificationRow);
  }

  async createNotificationFromTemplate(
    userId: string,
    templateKey: string,
    variables?: Record<string, any>,
    options: { createdAt?: Date } = {},
  ): Promise<NotificationNudge> {
    const template: NotificationTemplate = getNotificationTemplate(
      templateKey,
      variables,
    );

    return this.createNotification(
      userId,
      {
        message: template.message,
        url: template.url,
      },
      options,
    );
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

        // tiny delay just in case of rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          `Failed to create notification ${notification.templateKey}:`,
          error,
        );
      }
    }

    return results;
  }

  async ensureSeeded(userId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) throw error;
    if (data && data.length > 0) return;

    await this.seedUserNotifications(userId);
  }

  async seedUserNotifications(userId: string): Promise<void> {
    const now = Date.now();

    const notifications: Array<{
      templateKey: string;
      variables?: Record<string, any>;
      created_at?: Date;
    }> = [
      // Onboarding & first-touch
      { templateKey: 'WELCOME', created_at: new Date(now - 1000 * 60 * 60 * 24 * 7) },
      {
        templateKey: 'FIRST_LOGIN',
        created_at: new Date(now - 1000 * 60 * 60 * 24 * 6.5),
      },
      {
        templateKey: 'PROFILE_COMPLETE',
        created_at: new Date(now - 1000 * 60 * 60 * 24 * 6),
      },
      {
        templateKey: 'LEARNING_PATH',
        created_at: new Date(now - 1000 * 60 * 60 * 24 * 5.5),
      },
      {
        templateKey: 'GOAL_SETTING',
        created_at: new Date(now - 1000 * 60 * 60 * 24 * 5),
      },

      // Learning / course progress
      {
        templateKey: 'COURSE_ENROLLED',
        variables: {
          course_name: 'IELTS Mission Control',
          course_id: 'ielts-mc',
        },
        created_at: new Date(now - 1000 * 60 * 60 * 24 * 4.5),
      },
      {
        templateKey: 'COURSE_PROGRESS_25',
        variables: {
          course_name: 'IELTS Mission Control',
          course_id: 'ielts-mc',
        },
        created_at: new Date(now - 1000 * 60 * 60 * 24 * 4),
      },
      {
        templateKey: 'COURSE_PROGRESS_50',
        variables: {
          course_name: 'IELTS Mission Control',
          course_id: 'ielts-mc',
        },
        created_at: new Date(now - 1000 * 60 * 60 * 24 * 3.5),
      },
      {
        templateKey: 'LEARNING_REMINDER',
        created_at: new Date(now - 1000 * 60 * 60 * 24 * 3),
      },
      {
        templateKey: 'WEEKLY_PROGRESS',
        variables: { completed_lessons: 6, study_time: 3 },
        created_at: new Date(now - 1000 * 60 * 60 * 24 * 2.5),
      },

      // Billing / plans
      {
        templateKey: 'PAYMENT_SUCCESS',
        variables: { payment_id: 'pay-2024-01', plan_name: 'Rocket' },
        created_at: new Date(now - 1000 * 60 * 60 * 24 * 2),
      },
      {
        templateKey: 'SUBSCRIPTION_RENEWAL',
        variables: { plan_name: 'Rocket', days_left: 7 },
        created_at: new Date(now - 1000 * 60 * 60 * 24 * 1.7),
      },
      {
        templateKey: 'TRIAL_ENDS_SOON',
        variables: { plan_name: 'Rocket', days_left: 3 },
        created_at: new Date(now - 1000 * 60 * 60 * 24 * 1.4),
      },

      // Support & system / security
      {
        templateKey: 'SUPPORT_TICKET_UPDATE',
        variables: {
          ticket_id: 'tkt-001',
          update_message: 'We received your request.',
        },
        created_at: new Date(now - 1000 * 60 * 60 * 24 * 1),
      },
      {
        templateKey: 'SYSTEM_MAINTENANCE',
        variables: { hours: 2 },
        created_at: new Date(now - 1000 * 60 * 60 * 18),
      },
      {
        templateKey: 'NEW_FEATURE',
        variables: { feature_name: 'AI Study Helper' },
        created_at: new Date(now - 1000 * 60 * 60 * 16),
      },
      {
        templateKey: 'SECURITY_ALERT',
        variables: { location: 'New York, USA' },
        created_at: new Date(now - 1000 * 60 * 60 * 12),
      },

      // Community / social / nudges
      {
        templateKey: 'COMMUNITY_CHALLENGE',
        variables: {
          challenge_name: 'Weekly Practice',
          challenge_id: 'challenge-01',
        },
        created_at: new Date(now - 1000 * 60 * 60 * 8),
      },
      {
        templateKey: 'MESSAGE_RECEIVED',
        variables: { user_name: 'Study Buddy', thread_id: 'thread-123' },
        created_at: new Date(now - 1000 * 60 * 60 * 6),
      },
      {
        templateKey: 'COMMUNITY_JOIN',
        created_at: new Date(now - 1000 * 60 * 60 * 4),
      },
      {
        templateKey: 'SURVEY_INVITE',
        variables: { survey_id: 'welcome-survey' },
        created_at: new Date(now - 1000 * 60 * 60 * 2),
      },
    ];

    await this.bulkCreateNotifications(userId, notifications);
  }
}
