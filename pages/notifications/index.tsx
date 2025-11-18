import * as React from 'react';
import Head from 'next/head';
import type { GetServerSideProps } from 'next';

import { Container } from '@/components/design-system/Container';
import { Button } from '@/components/design-system/Button';
import { Alert } from '@/components/design-system/Alert';
import { NotificationList } from '@/components/notifications/NotificationList';
import type { NotificationRecord } from '@/lib/notifications/types';
import { getServerClient } from '@/lib/supabaseServer';

const PAGE_LIMIT = 50;

type NotificationsPageProps = {
  initial: NotificationRecord[];
};

function filterItems(items: NotificationRecord[], filter: 'all' | 'unread') {
  if (filter === 'unread') return items.filter((item) => !item.read);
  return items;
}

async function markNotifications(ids: string[]) {
  if (ids.length === 0) return;
  await fetch('/api/notifications/mark-read', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ids }),
  });
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ initial }) => {
  const [items, setItems] = React.useState(initial);
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const unreadCount = React.useMemo(() => items.filter((item) => !item.read).length, [items]);
  const displayed = filterItems(items, filter);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/notifications/feed?limit=${PAGE_LIMIT}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to refresh');
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      console.error('[notifications] refresh failed', err);
      setError('Unable to refresh notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleItemClick = React.useCallback((item: NotificationRecord) => {
    if (item.read) return;
    setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)));
    void markNotifications([item.id]);
  }, []);

  const handleMarkAll = React.useCallback(() => {
    const ids = items.filter((item) => !item.read).map((item) => item.id);
    if (ids.length === 0) return;
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    void markNotifications(ids);
  }, [items]);

  return (
    <>
      <Head>
        <title>Notifications | GramorX</title>
      </Head>
      <Container className="mx-auto max-w-5xl space-y-8 py-10">
        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-caption uppercase tracking-[0.2em] text-muted-foreground">Inbox</p>
              <h1 className="font-slab text-h2 text-foreground">Notifications</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button href="/settings/notifications" variant="soft" tone="info" size="sm">
                Manage preferences
              </Button>
              <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </Button>
            </div>
          </div>
          <p className="text-body text-muted-foreground">
            Stay on top of streak nudges, mock results, and plan updates in one smart feed.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full border border-border/70 bg-muted/40 p-0.5">
              {(['all', 'unread'] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`rounded-full px-4 py-1 text-small font-medium transition ${
                    filter === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                  onClick={() => setFilter(key)}
                >
                  {key === 'all' ? 'All' : `Unread (${unreadCount})`}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleMarkAll}>
                Mark all as read
              </Button>
            )}
          </div>
        </header>

        {error && (
          <Alert variant="error" title="Something went wrong" className="max-w-2xl">
            {error}
          </Alert>
        )}

        <section className="rounded-3xl border border-border bg-card/60 shadow-[0_20px_80px_-60px_rgba(15,23,42,0.6)]">
          <NotificationList
            items={displayed}
            onItemClick={handleItemClick}
            emptyMessage={filter === 'unread' ? 'No unread notifications' : 'All caught up!'}
          />
        </section>

        <footer className="flex flex-wrap items-center justify-between gap-3 text-caption text-muted-foreground">
          <span>
            Showing {displayed.length} of {items.length} notifications
          </span>
          <Button href="/dashboard" variant="outline" size="sm">
            Back to dashboard
          </Button>
        </footer>
      </Container>
    </>
  );
};

export const getServerSideProps: GetServerSideProps<NotificationsPageProps> = async (ctx) => {
  const supabase = getServerClient(ctx.req, ctx.res);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, message, url, read, created_at, updated_at, title, type, metadata')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(PAGE_LIMIT);

  if (error) {
    console.error('[notifications] server fetch failed', error);
  }

  return {
    props: {
      initial: data ?? [],
    },
  };
};

export default NotificationsPage;
