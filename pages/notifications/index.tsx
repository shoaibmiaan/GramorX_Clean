import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps, NextPage } from 'next';

import { Container } from '@/components/design-system/Container';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { Alert } from '@/components/design-system/Alert';
import { useNotifications } from '@/hooks/useNotifications';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

const Filters = ['all', 'unread'] as const;
type FilterValue = (typeof Filters)[number];

const NotificationsPage: NextPage = () => {
  const { items, unreadCount, loading, error, markAllRead, markAsRead, refetch } = useNotifications();
  const [filter, setFilter] = React.useState<FilterValue>('all');

  const filteredItems = React.useMemo(() => {
    if (filter === 'unread') {
      return items.filter((item) => !item.readAt);
    }
    return items;
  }, [filter, items]);

  const hasNotifications = filteredItems.length > 0;

  return (
    <>
      <Head>
        <title>Notifications • GramorX</title>
      </Head>
      <Container className="mx-auto max-w-4xl space-y-8 py-10">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-caption uppercase tracking-[0.2em] text-muted-foreground">Inbox</p>
              <h1 className="font-slab text-h2 text-foreground">Notifications</h1>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={unreadCount > 0 ? 'info' : 'neutral'}>{unreadCount} unread</Badge>
              <Button
                variant="soft"
                size="sm"
                disabled={unreadCount === 0}
                onClick={() => {
                  void markAllRead();
                }}
              >
                Mark all as read
              </Button>
            </div>
          </div>
          <p className="text-body text-muted-foreground">
            See announcements, study nudges, and progress updates across your GramorX workspace.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href="/settings/notifications" variant="soft" tone="info" size="sm">
              Manage preferences
            </Button>
            <Button href="/dashboard" variant="outline" size="sm">
              Back to dashboard
            </Button>
            <Button variant="ghost" size="sm" onClick={() => void refetch()}>
              Refresh
            </Button>
          </div>
        </header>

        <div className="flex gap-2">
          {Filters.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition ${
                filter === value ? 'bg-foreground text-background' : 'bg-muted text-foreground'
              }`}
            >
              {value === 'all' ? 'All' : 'Unread'}
            </button>
          ))}
        </div>

        {error && <Alert variant="error" title="Something went wrong">{error}</Alert>}

        <section aria-live="polite" className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 text-center text-muted-foreground">
              Loading notifications…
            </div>
          ) : hasNotifications ? (
            <div className="divide-y divide-border rounded-2xl border border-border bg-card/50">
              {filteredItems.map((notification) => {
                const isUnread = !notification.readAt;
                const content = (
                  <article className="flex flex-col gap-1 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-small font-semibold text-foreground">
                          {notification.title ?? notification.message ?? 'Notification'}
                        </h2>
                        <p className="text-caption text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {isUnread && (
                        <span className="inline-flex items-center rounded-full bg-electricBlue/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-electricBlue">
                          New
                        </span>
                      )}
                    </div>
                    {notification.message && (
                      <p className="text-body text-muted-foreground">{notification.message}</p>
                    )}
                  </article>
                );

                if (notification.url) {
                  return (
                    <Link
                      key={notification.id}
                      href={notification.url}
                      className="block px-5 transition-colors hover:bg-muted/40"
                      onClick={() => {
                        if (isUnread) void markAsRead(notification.id);
                      }}
                    >
                      {content}
                    </Link>
                  );
                }

                return (
                  <div
                    key={notification.id}
                    className="px-5 transition-colors hover:bg-muted/40"
                    onClick={() => {
                      if (isUnread) void markAsRead(notification.id);
                    }}
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-8 text-center">
              <h2 className="font-slab text-h4 text-foreground">You&apos;re all caught up</h2>
              <p className="mt-2 text-small text-muted-foreground">
                We&apos;ll drop a notification here when there&apos;s something new—like streak milestones, study reminders, or payment updates.
              </p>
              <div className="mt-6 flex justify-center">
                <Button href="/learning" size="sm" variant="primary">
                  Explore practice modules
                </Button>
              </div>
            </div>
          )}
        </section>
      </Container>
    </>
  );
};

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const supabase = createSupabaseServerClient({ req: ctx.req, res: ctx.res });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = encodeURIComponent(ctx.resolvedUrl ?? '/notifications');
    return {
      redirect: {
        destination: `/login?next=${next}`,
        permanent: false,
      },
    };
  }

  return { props: {} };
};

export default NotificationsPage;
