import * as React from 'react';
import Link from 'next/link';
import { Bell, Check, ExternalLink } from 'lucide-react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/design-system/DropdownMenu';
import { Button } from '@/components/design-system/Button';
import { useNotifications } from '@/hooks/useNotifications';

const MAX_VISIBLE = 5;

export const NotificationsDropdown: React.FC = () => {
  const { items, unreadCount, markAsRead, markAllRead, loading } = useNotifications();
  const visibleItems = items.slice(0, MAX_VISIBLE);

  const handleNotificationClick = (notificationId: string) => {
    void markAsRead(notificationId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative p-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={() => void markAllRead()} className="text-xs">
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading…</div>
          ) : visibleItems.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            visibleItems.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-3" asChild>
                {notification.url ? (
                  <Link href={notification.url} className="w-full" onClick={() => handleNotificationClick(notification.id)}>
                    <div className="flex w-full items-start justify-between gap-2">
                      <p className="flex-1 text-sm font-medium">
                        {notification.title ?? notification.message ?? 'Notification'}
                      </p>
                      {!notification.readAt && (
                        <div className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-blue-500" />
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </Link>
                ) : (
                  <button className="w-full text-left" onClick={() => handleNotificationClick(notification.id)}>
                    <div className="flex w-full items-start justify-between gap-2">
                      <p className="flex-1 text-sm font-medium">
                        {notification.title ?? notification.message ?? 'Notification'}
                      </p>
                      {!notification.readAt && <Check className="h-3 w-3" />}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </button>
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="flex items-center justify-center text-sm font-medium">
            View all notifications
            <ExternalLink className="ml-1 h-3 w-3" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
