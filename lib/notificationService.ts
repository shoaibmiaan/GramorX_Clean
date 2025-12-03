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
    const onboardingTemplates = [
      'WELCOME',
      'PROFILE_COMPLETE',
      'FIRST_LOGIN',
      'LEARNING_PATH',
      'GOAL_SETTING',
      'PREFERENCES',
      'NOTIFICATION_SETUP',
      'INTRO_VIDEO',
      'COMMUNITY_JOIN',
      'MOBILE_APP'
    ];

    const courses = [
      { id: 'prog-101', name: 'Introduction to Programming' },
      { id: 'web-101', name: 'Web Development Fundamentals' },
      { id: 'ds-101', name: 'Data Science Essentials' },
      { id: 'ui-101', name: 'UI/UX Design Basics' },
      { id: 'pm-101', name: 'Product Management Foundations' },
      { id: 'ml-201', name: 'Machine Learning Intermediate' },
      { id: 'cyber-101', name: 'Cybersecurity Essentials' }
    ];

    const progressTemplates = [
      'COURSE_ENROLLED',
      'COURSE_PROGRESS_25',
      'COURSE_PROGRESS_50',
      'COURSE_PROGRESS_75',
      'COURSE_COMPLETED',
      'CERTIFICATE_READY',
      'COURSE_UPDATE',
      'COURSE_DEADLINE',
      'COURSE_RECOMMENDATION',
      'PREREQUISITE_MET'
    ];

    const achievements = [
      'FIRST_COURSE_COMPLETE',
      'LEARNING_STREAK_3',
      'LEARNING_STREAK_7',
      'LEARNING_STREAK_30',
      'ACHIEVEMENT_UNLOCKED',
      'PERFECT_QUIZ',
      'RANK_UP',
      'TOP_LEARNER',
      'CONSISTENCY_AWARD',
      'SPEED_LEARNER',
      'HELPful_LEARNER',
      'EARLY_ADOPTER',
      'KNOWLEDGE_SHARER',
      'WEEKLY_CHALLENGE_WIN',
      'MILESTONE_10_COURSES',
      'MILESTONE_100_HOURS',
      'PERFECT_ATTENDANCE',
      'CROSS_DISCIPLINE',
      'QUIZ_MASTER',
      'GLOBAL_RANK'
    ];

    const payments = [
      'PAYMENT_SUCCESS',
      'SUBSCRIPTION_RENEWAL',
      'SUBSCRIPTION_UPGRADE',
      'TRIAL_ENDS_SOON',
      'TRIAL_EXPIRED',
      'PAYMENT_FAILED',
      'REFUND_PROCESSED',
      'DISCOUNT_APPLIED',
      'LOYALTY_DISCOUNT',
      'BULK_PURCHASE',
      'GIFT_SENT',
      'GIFT_RECEIVED',
      'AFFILIATE_EARNED',
      'SCHOLARSHIP_APPLIED',
      'SCHOLARSHIP_APPROVED'
    ];

    const systemEvents = [
      'SYSTEM_MAINTENANCE',
      'NEW_FEATURE',
      'APP_UPDATE',
      'SECURITY_ALERT',
      'PASSWORD_CHANGED',
      'EMAIL_VERIFIED',
      'TWO_FACTOR_ENABLED',
      'DATA_EXPORT_READY',
      'PRIVACY_POLICY_UPDATE',
      'COMMUNITY_GUIDELINES',
      'FEEDBACK_REQUEST',
      'SURVEY_INVITE',
      'BUG_REPORT_STATUS',
      'FEATURE_REQUEST_UPDATE',
      'SUPPORT_TICKET_UPDATE'
    ];

    const socialEvents = [
      'FOLLOWED',
      'PROFILE_VIEW',
      'POST_LIKED',
      'COMMENT_REPLY',
      'MENTIONED',
      'STUDY_BUDDY_REQUEST',
      'STUDY_BUDDY_ACCEPTED',
      'GROUP_INVITE',
      'GROUP_EVENT',
      'COMMUNITY_CHALLENGE',
      'BADGE_EARNED',
      'CONTRIBUTION_RECOGNIZED',
      'PEER_REVIEW_REQUEST',
      'PEER_REVIEW_COMPLETE',
      'COMMUNITY_RANK_UP'
    ];

    const notifications: Array<{ templateKey: string; variables?: Record<string, any> }> = [];

    onboardingTemplates.forEach((templateKey) => notifications.push({ templateKey }));

    courses.forEach((course) => {
      progressTemplates.forEach((templateKey) => {
        notifications.push({
          templateKey,
          variables: {
            course_name: course.name,
            course_id: course.id,
            days_left: 7,
            feature_name: 'Interactive Labs',
            new_rank: 'Gold',
            rank: 24,
          },
        });
      });

      notifications.push({
        templateKey: 'KNOWLEDGE_CHECK',
        variables: { course_name: course.name },
      });

      notifications.push({
        templateKey: 'LEARNING_REMINDER',
        variables: { course_name: course.name },
      });
    });

    achievements.forEach((templateKey, index) => {
      notifications.push({
        templateKey,
        variables: {
          achievement_name: `Milestone ${index + 1}`,
          quiz_name: `Checkpoint ${index + 1}`,
          count: (index + 1) * 3,
          rank: index + 5,
          new_rank: index % 2 === 0 ? 'Platinum' : 'Gold',
        },
      });
    });

    payments.forEach((templateKey, index) => {
      notifications.push({
        templateKey,
        variables: {
          payment_id: `pay-${index + 1001}`,
          plan_name: index % 2 === 0 ? 'Pro Annual' : 'Team Growth',
          days_left: 5,
          discount_amount: '$25',
          discount_percent: 20,
          course_count: 5,
          recipient_name: 'Taylor Brooks',
          sender_name: 'Jordan Lee',
          amount: '$120',
          coverage: 60,
        },
      });
    });

    systemEvents.forEach((templateKey, index) => {
      notifications.push({
        templateKey,
        variables: {
          hours: 24 - index,
          location: 'New York, USA',
          survey_id: `srv-${index + 1}`,
          ticket_id: `tkt-${index + 200}`,
          feature_name: 'AI Study Helper',
          status: index % 2 === 0 ? 'resolved' : 'in progress',
        },
      });
    });

    const groupIds = ['alpha', 'beta', 'gamma'];
    socialEvents.forEach((templateKey, index) => {
      const group = groupIds[index % groupIds.length];

      notifications.push({
        templateKey,
        variables: {
          follower_name: `Follower ${index + 1}`,
          follower_id: `user-${index + 300}`,
          viewer_name: `Viewer ${index + 1}`,
          user_name: `User ${index + 1}`,
          post_title: `Deep Dive ${index + 1}`,
          post_id: `post-${index + 1}`,
          comment_id: `c-${index + 1}`,
          user_id: `user-${index + 500}`,
          group_name: `Study Group ${group}`,
          group_id: group,
          event_name: `Workshop ${index + 1}`,
          event_id: `event-${index + 1}`,
          challenge_name: `Challenge ${index + 1}`,
          challenge_id: `challenge-${index + 1}`,
          badge_name: `Badge ${index + 1}`,
          project_id: `proj-${index + 1}`,
          buddy_id: `buddy-${index + 1}`,
          new_rank: index % 2 === 0 ? 'Contributor' : 'Moderator',
        },
      });
    });

    // Add reminders to ensure the seed includes well over 100 notifications across modules
    for (let day = 1; day <= 30; day += 1) {
      notifications.push({
        templateKey: 'WEEKLY_PROGRESS',
        variables: { completed_lessons: day, study_time: day % 5 } as Record<string, any>,
      });

      notifications.push({
        templateKey: 'MONTHLY_REVIEW',
        variables: { courses_completed: Math.max(1, Math.floor(day / 5)) },
      });
    }

    // Guarantee at least 100 entries even if template lists change
    while (notifications.length < 100) {
      notifications.push({ templateKey: 'LEARNING_REMINDER' });
    }

    const now = Date.now();
    const staged = notifications.map((notification, index) => ({
      ...notification,
      created_at: new Date(now - index * 60 * 60 * 1000), // space by an hour for ordering
    }));

    await this.bulkCreateNotifications(userId, staged);
  }
}
