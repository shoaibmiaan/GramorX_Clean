import * as React from 'react';
import Link from 'next/link';
import Icon from '@/components/design-system/Icon';

const MAX_VISIBLE = 6;

export type NotificationItem = {
  id: string;
  title?: string | null;
  message: string;
  url?: string | null;
  created_at?: string | null;
  read?: boolean | null;
};

export type NotificationBellProps = {
  /** Full list of notifications for the current user */
  items?: NotificationItem[];
  /** Unread count (for badge). If not provided, derived from items. */
  unreadCount?: number;
  /** Loading state for initial fetch */
  loading?: boolean;
  /** Optional callback when user clicks a notification */
  onItemClick?: (item: NotificationItem) => void;
};

/**
 * NotificationBell
 *
 * - Safe if `items` is undefined (uses [] internally).
 * - Works on desktop + mobile (max-width + scroll).
 * - Accessible (ESC closes, outside click closes, focus ring).
 * - Exported as BOTH named and default to survive any import style in DesktopNav.
 */
export function NotificationBell({
  items,
  unreadCount,
  loading,
  onItemClick,
}: NotificationBellProps) {
  const [open, setOpen] = React.useState(false);
  const listRef = React.useRef<Array<HTMLAnchorElement | HTMLButtonElement | null>>([]);

  // Always have a safe array so .slice() never explodes
  const safeItems = React.useMemo<NotificationItem[]>(() => items ?? [], [items]);

  const visibleItems = safeItems.slice(0, MAX_VISIBLE);

  const computedUnread =
    typeof unreadCount === 'number'
      ? unreadCount
      : safeItems.filter((n) => !n.read).length;

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const panel = document.getElementById('gx-notification-panel');
      const button = document.getElementById('gx-notification-trigger');

      if (panel && !panel.contains(target) && button && !button.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleItemClick = (item: NotificationItem) => {
    if (onItemClick) onItemClick(item);
    setOpen(false);
  };

  return (
    <div className="relative flex items-center">
      <button
        id="gx-notification-trigger"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-foreground hover:bg-surface-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus ring-offset-2 ring-offset-background transition"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          computedUnread > 0
            ? `${computedUnread} unread notifications`
            : 'Notifications'
        }
      >
        <Icon name="bell" className="h-4 w-4" />
        {computedUnread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex min-h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-badge-critical px-1 text-[10px] font-semibold text-on-badge">
            {computedUnread > 9 ? '9+' : computedUnread}
          </span>
        )}
      </button>

      {open && (
        <div
          id="gx-notification-panel"
          className="
            absolute right-0 z-40 mt-2 w-80 max-w-[90vw]
            rounded-2xl bg-surface shadow-elevated border border-border
            sm:w-96
          "
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-muted">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {loading && (
              <span className="text-[11px] uppercase tracking-wide text-muted">
                Syncing…
              </span>
            )}
          </div>

          {safeItems.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted">
              <p className="font-medium">You&apos;re all caught up 🎧</p>
              <p className="mt-1 text-xs text-muted-foreground">
                We&apos;ll nudge you when something important happens.
              </p>
            </div>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto px-1 py-2">
              {visibleItems.map((item, index) => {
                const Wrapper: React.ElementType = item.url ? Link : 'button';
                const wrapperProps: any = item.url
                  ? { href: item.url }
                  : { type: 'button' };

                return (
                  <li key={item.id} className="px-3 py-1.5">
                    <Wrapper
                      {...wrapperProps}
                      ref={(el: any) => {
                        listRef.current[index] = el;
                      }}
                      onClick={() => handleItemClick(item)}
                      className={`
                        flex w-full flex-col items-start rounded-xl px-3 py-2
                        text-left text-sm transition
                        ${item.read ? 'bg-surface' : 'bg-surface-strong'}
                        hover:bg-surface-strong/90
                      `}
                    >
                      <div className="flex w-full items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-foreground line-clamp-1">
                          {item.title ?? 'Update from GramorX'}
                        </p>
                        {!item.read && (
                          <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-badge-critical" />
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted line-clamp-2">
                        {item.message}
                      </p>
                      {item.created_at && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {new Date(item.created_at).toLocaleString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            month: 'short',
                            day: '2-digit',
                          })}
                        </p>
                      )}
                    </Wrapper>
                  </li>
                );
              })}

              {safeItems.length > MAX_VISIBLE && (
                <li className="px-3 py-2">
                  <Link
                    href="/notifications"
                    className="block w-full rounded-xl bg-surface-muted px-3 py-2 text-center text-xs font-medium text-primary hover:bg-surface-muted/80"
                    onClick={() => setOpen(false)}
                  >
                    View all {safeItems.length} notifications
                  </Link>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// 👇 Default export so BOTH `import NotificationBell` and `import { NotificationBell }` work
export default NotificationBell;
