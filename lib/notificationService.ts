import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { CreateNotificationInput, NotificationNudge } from './schemas/notifications';
import { getNotificationTemplate, type NotificationTemplate } from './notificationTemplates';

type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];

type ListResult = {
  items: NotificationNudge[];
  nextCursor: string | null;
  unreadCount: number;
};

export class NotificationService {
  constructor(private supabase: ReturnType<typeof createClient<Database>>) {}

  private mapRow(row: NotificationRow): NotificationNudge {
    return {
      id: row.id,
      message: row.message ?? 'Notification',
      url: row.url && row.url.trim() !== '' ? row.url : null,
      read: Boolean(row.read),
      createdAt:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : typeof row.created_at === 'string' && !isNaN(Date.parse(row.created_at))
          ? new Date(row.created_at).toISOString()
          : new Date().toISOString(),
    };
  }

  async listNotifications(
    userId: string,
    options: { cursor?: string | null; limit?: number } = {}
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

    const notifications = (data ?? []).map((row) => this.mapRow(row as NotificationRow));
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
    options: { createdAt?: Date } = {}
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
    options: { createdAt?: Date } = {}
  ): Promise<NotificationNudge> {
    const template: NotificationTemplate = getNotificationTemplate(templateKey, variables);

    return this.createNotification(
      userId,
      {
        message: template.message,
        url: template.url,
      },
      options
    );
  }

  async bulkCreateNotifications(
    userId: string,
    notifications: Array<{
      templateKey: string;
      variables?: Record<string, any>;
      created_at?: Date;
    }>
  ): Promise<NotificationNudge[]> {
    const results: NotificationNudge[] = [];

    for (const notification of notifications) {
      try {
        const result = await this.createNotificationFromTemplate(
          userId,
          notification.templateKey,
          notification.variables,
          { createdAt: notification.created_at }
        );
        results.push(result);

        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to create notification ${notification.templateKey}:`, error);
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
    const notifications = [
      // Onboarding sequence
      { templateKey: 'WELCOME' },
      { templateKey: 'PROFILE_COMPLETE' },
      { templateKey: 'FIRST_LOGIN' },
      { templateKey: 'LEARNING_PATH' },

      // Course enrollments
      {
        templateKey: 'COURSE_ENROLLED',
        variables: { course_name: 'Introduction to Programming', course_id: 'prog-101' }
      },
      {
        templateKey: 'COURSE_PROGRESS_25',
        variables: { course_name: 'Introduction to Programming', course_id: 'prog-101' }
      },
      {
        templateKey: 'COURSE_PROGRESS_50',
        variables: { course_name: 'Introduction to Programming', course_id: 'prog-101' }
      },
      {
        templateKey: 'COURSE_PROGRESS_75',
        variables: { course_name: 'Introduction to Programming', course_id: 'prog-101' }
      },
      {
        templateKey: 'COURSE_COMPLETED',
        variables: { course_name: 'Introduction to Programming', course_id: 'prog-101' }
      },

      // Achievements
      { templateKey: 'FIRST_COURSE_COMPLETE' },
      { templateKey: 'LEARNING_STREAK_3' },
      { templateKey: 'LEARNING_STREAK_7' },
      {
        templateKey: 'ACHIEVEMENT_UNLOCKED',
        variables: { achievement_name: 'Fast Learner' }
      },
      {
        templateKey: 'PERFECT_QUIZ',
        variables: { quiz_name: 'Python Basics Quiz' }
      },

      // Additional courses
      {
        templateKey: 'COURSE_ENROLLED',
        variables: { course_name: 'Web Development Fundamentals', course_id: 'web-101' }
      },
      {
        templateKey: 'COURSE_ENROLLED',
        variables: { course_name: 'Data Science Essentials', course_id: 'ds-101' }
      },

      // Progress updates
      {
        templateKey: 'WEEKLY_PROGRESS',
        variables: { completed_lessons: 12, study_time: 8 }
      },
      {
        templateKey: 'MONTHLY_REVIEW',
        variables: { courses_completed: 3 }
      },

      // Community
      {
        templateKey: 'FOLLOWED',
        variables: { follower_name: 'Alex Johnson' }
      },
      {
        templateKey: 'POST_LIKED',
        variables: { user_name: 'Maria Garcia', post_title: 'My learning journey so far' }
      },
      {
        templateKey: 'STUDY_GROUP_INVITE',
        variables: { group_name: 'Python Learners Club' }
      }
    ];

    const now = Date.now();
    const staged = notifications.map((notification, index) => ({
      ...notification,
      created_at: new Date(now - index * 60 * 60 * 1000), // space by an hour for ordering
    }));

    await this.bulkCreateNotifications(userId, staged);
  }
}
