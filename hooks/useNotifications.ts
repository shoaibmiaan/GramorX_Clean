import * as React from 'react';
import useSWR from 'swr';

import type { NotificationDTO, NotificationsListResponse } from '@/lib/notifications/types';

const LIST_ENDPOINT = '/api/notifications/list?limit=20';

const fetcher = async (url: string): Promise<NotificationsListResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }
  return response.json();
};

type UseNotificationsResult = {
  items: NotificationDTO[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refetch: () => Promise<void>;
};

export function useNotifications(): UseNotificationsResult {
  const { data, error, isLoading, mutate } = useSWR<NotificationsListResponse>(LIST_ENDPOINT, fetcher);
  const [items, setItems] = React.useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (data) {
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    }
  }, [data]);

  const markAsRead = React.useCallback(
    async (id: string) => {
      setItems((prev) => {
        let decremented = false;
        const next = prev.map((item) => {
          if (item.id !== id) return item;
          if (!item.readAt) decremented = true;
          return { ...item, readAt: item.readAt ?? new Date().toISOString() };
        });
        if (decremented) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return next;
      });

      try {
        const response = await fetch(`/api/notifications/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'read' }),
        });
        if (!response.ok) {
          throw new Error('Failed to mark notification as read');
        }
        await mutate();
      } catch (err) {
        console.error('[useNotifications] markAsRead failed', err);
        await mutate();
      }
    },
    [mutate],
  );

  const markAllRead = React.useCallback(async () => {
    const timestamp = new Date().toISOString();
    setItems((prev) => prev.map((item) => ({ ...item, readAt: item.readAt ?? timestamp })));
    setUnreadCount(0);

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' }),
      });
      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }
      await mutate();
    } catch (err) {
      console.error('[useNotifications] markAllRead failed', err);
      await mutate();
    }
  }, [mutate]);

  const refetch = React.useCallback(async () => {
    await mutate();
  }, [mutate]);

  return {
    items,
    unreadCount,
    loading: isLoading && !data,
    error: error ? (error instanceof Error ? error.message : 'Unknown error') : null,
    markAsRead,
    markAllRead,
    refetch,
  };
}
