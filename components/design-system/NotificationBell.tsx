// components/design-system/NotificationBell.tsx
import * as React from 'react';
import Link from 'next/link';

import { BellIcon } from '@/lib/icons';
import { useNotifications } from '@/hooks/useNotifications';

const MAX_VISIBLE = 5;

export const NotificationBell: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const { items, unreadCount, markAsRead, markAllRead } = useNotifications();
  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<Array<HTMLAnchorElement | HTMLButtonElement | null>>([]);

  const visibleItems = items.slice(0, MAX_VISIBLE);

  React.useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
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

  React.useEffect(() => {
    if (!open) return;
    const focusable = listRef.current.filter(Boolean) as HTMLElement[];
    focusable[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (!popoverRef.current?.contains(document.activeElement)) return;
      const idx = focusable.indexOf(document.activeElement as HTMLElement);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusable[(idx + 1) % focusable.length]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        focusable[(idx - 1 + focusable.length) % focusable.length]?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, items.length]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Notifications"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="notification-menu"
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <BellIcon className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-sunsetRed px-1 text-[10px] leading-none text-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute right-0 z-50 mt-2 w-80 rounded-ds-2xl border border-border bg-card text-card-foreground shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <span className="text-small font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  void markAllRead();
                }}
                className="text-caption text-foreground/70 hover:text-foreground"
              >
                Mark all as read
              </button>
            )}
          </div>
          <ul id="notification-menu" role="menu" className="max-h-72 overflow-auto text-small" aria-live="polite">
            {visibleItems.map((notification, index) => {
              const isUnread = !notification.readAt;
              const content = (
                <div className={isUnread ? 'font-semibold' : 'opacity-70'}>
                  <div className="text-small">{notification.title ?? notification.message ?? 'Notification'}</div>
                  <p className="text-caption text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              );

              const refSetter = (el: HTMLAnchorElement | HTMLButtonElement | null) => {
                listRef.current[index] = el;
              };

              if (notification.url) {
                const isInternal = notification.url.startsWith('/');
                return (
                  <li key={notification.id} role="none">
                    {isInternal ? (
                      <Link
                        href={notification.url}
                        ref={refSetter as React.Ref<HTMLAnchorElement>}
                        role="menuitem"
                        className="block px-3 py-2 hover:bg-muted/60"
                        onClick={() => {
                          void markAsRead(notification.id);
                          setOpen(false);
                        }}
                      >
                        {content}
                      </Link>
                    ) : (
                      <a
                        href={notification.url}
                        target="_blank"
                        rel="noreferrer"
                        ref={refSetter as React.Ref<HTMLAnchorElement>}
                        role="menuitem"
                        className="block px-3 py-2 hover:bg-muted/60"
                        onClick={() => {
                          void markAsRead(notification.id);
                          setOpen(false);
                        }}
                      >
                        {content}
                      </a>
                    )}
                  </li>
                );
              }

              return (
                <li key={notification.id} role="none">
                  <button
                    ref={refSetter as React.Ref<HTMLButtonElement>}
                    role="menuitem"
                    className="block w-full px-3 py-2 text-left hover:bg-muted/60"
                    onClick={() => {
                      void markAsRead(notification.id);
                      setOpen(false);
                    }}
                  >
                    {content}
                  </button>
                </li>
              );
            })}
            {visibleItems.length === 0 && (
              <li className="px-3 py-3 text-muted-foreground">No notifications</li>
            )}
            <li className="border-t border-border/70">
              <Link
                href="/notifications"
                role="menuitem"
                ref={(el) => {
                  listRef.current[visibleItems.length] = el as HTMLAnchorElement | null;
                }}
                className="block px-3 py-2 text-center text-caption font-semibold text-primary hover:underline"
                onClick={() => setOpen(false)}
              >
                View all notifications
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

NotificationBell.displayName = 'NotificationBell';

export default NotificationBell;
