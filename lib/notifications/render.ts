import type { BaseNotificationPayload, NotificationEventType } from './types';

const moduleTitleMap: Record<string, string> = {
  listening: 'Listening',
  reading: 'Reading',
  writing: 'Writing',
  speaking: 'Speaking',
};

function moduleLabel(module?: string | null) {
  if (!module) return 'IELTS';
  return moduleTitleMap[module] ?? module;
}

export function renderNotification(
  type: NotificationEventType,
  payload?: BaseNotificationPayload,
): { title: string; body: string; url?: string } {
  const module = moduleLabel(payload?.module);
  switch (type) {
    case 'mock_submitted': {
      return {
        title: `${module} mock submitted`,
        body: `Your ${module.toLowerCase()} mock has been submitted. We'll notify you when the band score is ready.`,
        url:
          payload?.attemptId && payload?.module
            ? `/mock/${payload.module}/submitted?attempt=${payload.attemptId}`
            : undefined,
      };
    }
    case 'mock_result_ready': {
      return {
        title: `${module} mock results ready`,
        body: `Your ${module.toLowerCase()} mock results are ready to review. Tap to see detailed feedback.`,
        url:
          payload?.attemptId && payload?.module
            ? `/mock/${payload.module}/submitted?attempt=${payload.attemptId}`
            : undefined,
      };
    }
    case 'streak_warning': {
      return {
        title: 'Study streak at risk',
        body: `You have ${payload?.streakDays ?? 0} days left to keep your streak alive. Hop back into a mock or lesson.`,
        url: '/dashboard',
      };
    }
    case 'plan_upgraded': {
      return {
        title: 'Plan upgraded',
        body: 'Thanks for upgrading! Premium mock analytics and AI reviews are now unlocked.',
        url: '/pricing',
      };
    }
    case 'new_mock_unlocked': {
      return {
        title: `${module} mock unlocked`,
        body: 'A new full-length mock is ready. Try it today to keep your streak alive.',
        url:
          payload?.module && payload?.mockId
            ? `/mock/${payload.module}/overview?mockId=${payload.mockId}`
            : undefined,
      };
    }
    default: {
      return {
        title: 'Notification',
        body: 'You have a new notification.',
      };
    }
  }
}
