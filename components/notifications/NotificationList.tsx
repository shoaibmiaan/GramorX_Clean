import type { NotificationRecord } from '@/lib/notifications/types';
import { NotificationItem } from './NotificationItem';

export type NotificationListProps = {
  items: NotificationRecord[];
  onItemClick?: (item: NotificationRecord) => void;
  emptyMessage?: string;
};

export function NotificationList({ items, onItemClick, emptyMessage = 'All caught up!' }: NotificationListProps) {
  if (items.length === 0) {
    return (
      <div className="px-4 py-6 text-center text-muted-foreground">
        <p className="text-body font-medium">{emptyMessage}</p>
        <p className="text-caption">We will drop updates here as soon as something changes.</p>
      </div>
    );
  }

  return (
    <ul role="list" className="divide-y divide-border/60">
      {items.map((item) => (
        <li key={item.id}>
          <NotificationItem item={item} onActivate={onItemClick} />
        </li>
      ))}
    </ul>
  );
}
