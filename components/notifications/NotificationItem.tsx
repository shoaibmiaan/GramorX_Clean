import Link from 'next/link';
import { DateTime } from 'luxon';

import type { NotificationRecord } from '@/lib/notifications/types';
import { cn } from '@/lib/utils';

export type NotificationItemProps = {
  item: NotificationRecord;
  onActivate?: (item: NotificationRecord) => void;
};

function formatRelative(iso: string) {
  const dt = DateTime.fromISO(iso);
  if (!dt.isValid) return '';
  return dt.toRelative({ style: 'short' }) ?? dt.toLocaleString(DateTime.DATETIME_MED);
}

const baseRow = 'flex flex-col gap-1 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function NotificationItem({ item, onActivate }: NotificationItemProps) {
  const relative = formatRelative(item.created_at ?? new Date().toISOString());
  const unread = !item.read;
  const badge = unread ? (
    <span className="inline-flex items-center rounded-full bg-electricBlue/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-electricBlue">
      New
    </span>
  ) : null;

  const content = (
    <div className="flex flex-col gap-1">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          {item.title && <p className="text-small font-semibold text-foreground">{item.title}</p>}
          <p className={cn('text-body text-muted-foreground', unread && 'text-foreground')}>
            {item.message ?? 'Update available'}
          </p>
        </div>
        {badge}
      </div>
      <p className="text-caption text-muted-foreground">{relative}</p>
    </div>
  );

  const handleClick = () => {
    onActivate?.(item);
  };

  if (item.url) {
    const isInternal = item.url.startsWith('/');
    if (isInternal) {
      return (
        <Link href={item.url} className={cn(baseRow, 'rounded-none hover:bg-muted/70')} onClick={handleClick}>
          {content}
        </Link>
      );
    }
    return (
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className={cn(baseRow, 'rounded-none hover:bg-muted/70')}
        onClick={handleClick}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={cn(baseRow, 'rounded-none hover:bg-muted/70')} onClick={handleClick}>
      {content}
    </button>
  );
}
