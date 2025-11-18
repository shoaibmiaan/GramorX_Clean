import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/design-system/Toaster';
import type { NotificationRecord } from '@/lib/notifications/types';

type Ctx = {
  notifications: NotificationRecord[];
  unread: number;
  markRead: (id: string) => Promise<void>;
  markMany: (ids: string[]) => Promise<void>;
  refresh: () => Promise<void>;
};

const NotificationCtx = createContext<Ctx | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unread, setUnread] = useState(0);
  const [hasSession, setHasSession] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!cancelled) setHasSession(!!session);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setHasSession(!!session);
      if (!session) {
        setNotifications([]);
        setUnread(0);
      }
    });

    return () => {
      subscription.unsubscribe();
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hasSession) return;
    let active = true;

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications/feed?limit=20', {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data.items)) throw new Error('Invalid response format');
        if (active) {
          setNotifications(
            data.items.map((n: NotificationRecord) => ({
              ...n,
              created_at: n.created_at ?? new Date().toISOString(),
            })),
          );
          setUnread(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
        }
      } catch (error) {
        console.error('Fetch notifications error:', error);
        toast.error('Failed to load notifications');
      }
    };

    void fetchNotifications();

    return () => {
      active = false;
    };
  }, [hasSession, toast]);

  useEffect(() => {
    if (!hasSession) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: { new: NotificationRecord }) => {
          const n = payload.new;
          setNotifications((prev) => [n, ...prev]);
          setUnread((prev) => prev + 1);
          toast.info(n.message ?? n.title ?? 'New notification');
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIPTION_ERROR') {
          toast.error('Error subscribing to notifications');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hasSession, toast]);

  const refresh = useCallback(async () => {
    if (!hasSession) return;
    try {
      const res = await fetch('/api/notifications/feed?limit=20', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to refresh');
      const data = await res.json();
      setNotifications(
        (data.items ?? []).map((n: NotificationRecord) => ({
          ...n,
          created_at: n.created_at ?? new Date().toISOString(),
        })),
      );
      setUnread(typeof data.unreadCount === 'number' ? data.unreadCount : 0);
    } catch (error) {
      console.error('Refresh notifications failed', error);
    }
  }, [hasSession]);

  const markMany = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    setNotifications((prev) => {
      const idSet = new Set(ids);
      let changed = 0;
      const next = prev.map((n) => {
        if (idSet.has(n.id) && !n.read) {
          changed += 1;
          return { ...n, read: true };
        }
        return idSet.has(n.id) ? { ...n, read: true } : n;
      });
      if (changed > 0) {
        setUnread((prevCount) => Math.max(0, prevCount - changed));
      }
      return next;
    });
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    } catch (error) {
      console.error('markMany notifications failed', error);
      void refresh();
    }
  }, [refresh]);

  const markRead = useCallback(async (id: string) => {
    await markMany([id]);
  }, [markMany]);

  const value = { notifications, unread, markRead, markMany, refresh };

  return <NotificationCtx.Provider value={value}>{children}</NotificationCtx.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationCtx);
  if (!ctx) throw new Error('useNotifications must be used within <NotificationProvider>');
  return ctx;
}