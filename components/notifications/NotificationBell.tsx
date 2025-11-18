'use client';

import * as React from 'react';

import { BellIcon } from '@/lib/icons';
import { NotificationList } from './NotificationList';
import { useNotifications } from './NotificationProvider';
import type { NotificationRecord } from '@/lib/notifications/types';

export function NotificationBell() {
  const { notifications, unread, markRead, markMany } = useNotifications();
  const [open, setOpen] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const unreadIds = React.useMemo(() => notifications.filter((n) => !n.read).map((n) => n.id), [
    notifications,
  ]);

  const handleItemClick = React.useCallback(
    (item: NotificationRecord) => {
      if (!item.read) {
        void markRead(item.id);
      }
      if (item.url) {
        setTimeout(() => setOpen(false), 50);
      }
    },
    [markRead],
  );

  const markAll = React.useCallback(() => {
    if (unreadIds.length === 0) return;
    void markMany(unreadIds);
  }, [markMany, unreadIds]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Notifications"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <BellIcon className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex min-h-[1.25rem] min-w-[1.25rem] items-center justify-center rounded-full bg-sunsetRed px-1 text-[10px] font-semibold text-foreground">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 z-50 mt-2 w-80 rounded-ds-2xl border border-border/70 bg-card text-card-foreground shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-2">
            <span className="text-small font-semibold">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="text-caption font-medium text-primary hover:underline"
              >
                Mark all
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-auto">
            <NotificationList items={notifications} onItemClick={handleItemClick} />
          </div>
          <div className="border-t border-border/70 px-4 py-2 text-right text-caption text-muted-foreground">
            <span>{notifications.length} recent updates</span>
          </div>
        </div>
      )}
    </div>
  );
}
