import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/design-system/Toaster';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';

export type Notification = {
  id: string;
  message: string;
  url?: string | null;
  read: boolean;
  created_at: string;
};

type Ctx = {
  notifications: Notification[];
  unread: number;
  markRead: (id: string) => Promise<void>;
};

const NotificationCtx = createContext<Ctx | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const toast = useToast();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!cancelled) setSession(session);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      if (!session) setNotifications([]);
    });

    return () => {
      subscription.unsubscribe();
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    let active = true;
    const controller = new AbortController();

    const fetchNotifications = async () => {
      try {
        const accessToken = session?.access_token;
        if (!accessToken) return;
        const res = await fetch('/api/notifications', {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data.notifications)) throw new Error('Invalid response format');
        if (active) setNotifications(data.notifications);
      } catch (error) {
        console.error('Fetch notifications error:', error);
        toast.error('Failed to load notifications');
      }
    };

    fetchNotifications();

    return () => {
      active = false;
      controller.abort();
    };
  }, [session, toast]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase.channel('notifications-onboarding')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session.user.id}`,
        },
        (payload: { new: Notification }) => {
          const n = payload.new;
          setNotifications(prev => [n, ...prev]);
          toast.info(n.message);
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
  }, [session, toast]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      const accessToken = session?.access_token;
      if (!accessToken) return;
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) throw new Error(`Failed to mark ${id} as read`);
    } catch (error) {
      console.error(error);
      // Revert optimistic update
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
      toast.error('Could not update notification. Please retry.');
    }
  }, [session?.access_token, toast]);

  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo(() => ({ notifications, unread, markRead }), [notifications, unread, markRead]);

  return <NotificationCtx.Provider value={value}>{children}</NotificationCtx.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationCtx);
  if (!ctx) throw new Error('useNotifications must be used within <NotificationProvider>');
  return ctx;
}
