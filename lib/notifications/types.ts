export type NotificationChannel = 'in_app' | 'email' | 'whatsapp' | 'push';

export type NotificationDTO = {
  id: string;
  title: string | null;
  body: string | null;
  message: string | null;
  url: string | null;
  type: string | null;
  channel: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationsListResponse = {
  items: NotificationDTO[];
  nextCursor: string | null;
  unreadCount: number;
};
