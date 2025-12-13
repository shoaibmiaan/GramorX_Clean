// pages/account/index.tsx
// Unified account hub page. This file combines the high‑level account overview
// with the richer dashboard previously found in the profile/account
// dashboard. It consolidates quick stats, billing information, links to
// preferences and security pages, and conditional panels for teachers and
// admins. All routes now live under `/account`, replacing older
// `/profile` and `/settings` paths.

'use client';

import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { Alert } from '@/components/design-system/Alert';
import { useToast } from '@/components/design-system/Toaster';
import { useStreak } from '@/hooks/useStreak';
import { supabaseBrowser as supabase } from '@/lib/supabaseBrowser';
import { getPlan, isPaidPlan, type PlanId } from '@/types/pricing';

// Icons from lucide-react – import only what we need
import {
  Clock,
  History,
  Settings as SettingsIcon,
  Shield,
  Bell,
  Globe,
  Key,
  Crown,
  Users,
  MessageSquare,
} from 'lucide-react';

// Type definitions for billing summary
export type BillingSummary = {
  plan: PlanId;
  status:
    | 'active'
    | 'trialing'
    | 'canceled'
    | 'incomplete'
    | 'past_due'
    | 'unpaid'
    | 'paused';
  renewsAt?: string;
  trialEndsAt?: string;
};

export type BillingSummaryResponse =
  | { ok: true; summary: BillingSummary; customerId?: string | null; needsStripeSetup?: boolean }
  | { ok: false; error: string };

export default function AccountHubPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  // User role flags
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isTeacher, setIsTeacher] = React.useState(false);

  // Activity statistics
  const [activityStats, setActivityStats] = React.useState({
    totalActivities: 0,
    recentActivities: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });

  // Billing state
  const [billingLoading, setBillingLoading] = React.useState(true);
  const [billingError, setBillingError] = React.useState<string | null>(null);
  const [summary, setSummary] = React.useState<BillingSummary | null>(null);
  const [portalAvailable, setPortalAvailable] = React.useState(false);
  const [portalLoading, setPortalLoading] = React.useState(false);

  // Password reset state
  const [sending, setSending] = React.useState(false);
  const [email, setEmail] = React.useState<string | null>(null);

  // Streak info
  const { current: streak, longest, loading: streakLoading } = useStreak();

  // Fetch billing info on mount
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setBillingLoading(true);
        setBillingError(null);
        const response = await fetch('/api/billing/summary', { credentials: 'include' });
        const data: BillingSummaryResponse = await response.json();
        if (!response.ok) throw new Error(response.statusText || 'Failed to load billing');
        if (!data.ok) throw new Error(data.error || 'Failed to load billing');
        if (cancelled) return;
        setSummary(data.summary);
        const canOpenPortal = Boolean(data.customerId) && !data.needsStripeSetup;
        setPortalAvailable(canOpenPortal);
      } catch (err) {
        if (cancelled) return;
        setBillingError((err as Error).message || 'Failed to load billing');
        setSummary(null);
        setPortalAvailable(false);
      } finally {
        if (!cancelled) setBillingLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch profile role and activity stats
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!mounted) return;
      setEmail(sessionData.session?.user?.email ?? null);
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, teacher_approved')
        .eq('id', sessionData.session?.user?.id)
        .single();
      if (profile) {
        setIsAdmin(profile.role === 'admin');
        setIsTeacher(profile.teacher_approved === true || profile.role === 'teacher');
      }
      if (sessionData.session?.user?.id) {
        const userId = sessionData.session.user.id;
        // Total activities count
        const { count: activityCount } = await supabase
          .from('user_activities')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);
        // Activities in last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const { count: recentCount } = await supabase
          .from('user_activities')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .gte('created_at', weekAgo.toISOString());
        // Pending tasks
        const { count: pendingTasks } = await supabase
          .from('task_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', userId)
          .eq('status', 'pending');
        // Completed tasks
        const { count: completedTasks } = await supabase
          .from('task_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', userId)
          .eq('status', 'completed');
        setActivityStats({
          totalActivities: activityCount ?? 0,
          recentActivities: recentCount ?? 0,
          pendingTasks: pendingTasks ?? 0,
          completedTasks: completedTasks ?? 0,
        });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper to open Stripe billing portal
  const openPortal = async () => {
    if (!portalAvailable || portalLoading) return;
    setPortalLoading(true);
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Failed to open billing portal');
      window.location.assign(data.url);
    } catch (err) {
      toastError('Unable to open billing portal');
    } finally {
      setPortalLoading(false);
    }
  };

  // Reset password by sending an email
  const handleReset = async () => {
    if (!email || sending) return;
    setSending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (error) throw new Error(error.message);
      toastSuccess('Reset link sent to your email');
    } catch (err) {
      toastError((err as Error).message || 'Unable to send reset email');
    } finally {
      setSending(false);
    }
  };

  // Determine plan details
  const isPremiumPlan = summary ? isPaidPlan(summary.plan) : false;
  const planDefinition = summary ? getPlan(summary.plan) : null;
  const planMeta = React.useMemo(() => {
    if (!summary) return [] as string[];
    const meta: string[] = [];
    if (summary.renewsAt) meta.push(`Renews on ${new Date(summary.renewsAt).toLocaleDateString()}`);
    if (summary.trialEndsAt) meta.push(`Trial ends on ${new Date(summary.trialEndsAt).toLocaleDateString()}`);
    return meta;
  }, [summary]);

  // Format billing status to capitalized words
  const formatStatus = React.useCallback((status: BillingSummary['status']) =>
    status
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase()), []);

  // Determine badge variant based on billing status
  const statusVariant = React.useCallback((status: BillingSummary['status']): React.ComponentProps<typeof Badge>['variant'] => {
    switch (status) {
      case 'active':
        return 'success';
      case 'trialing':
        return 'info';
      case 'past_due':
      case 'incomplete':
        return 'warning';
      case 'unpaid':
        return 'danger';
      case 'paused':
        return 'secondary';
      default:
        return 'neutral';
    }
  }, []);

  // Helper to safely navigate using router.push
  const safePush = React.useCallback((href: string) => {
    router.push(href).catch(() => {});
  }, [router]);

  return (
    <>
      <Head>
        <title>Account Hub · GramorX</title>
        <meta name="description" content="Manage your plan, billing, notifications, and security settings" />
      </Head>
      <main className="py-8 bg-background text-foreground">
        <Container>
          {/* Top summary banner with streak info and quick profile */}
          <Card className="mb-6 flex flex-col gap-4 rounded-ds-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-14 sm:w-14">
                {email ? (
                  <span className="text-base font-semibold sm:text-lg">
                    {email[0].toUpperCase()}
                  </span>
                ) : (
                  <span className="text-base font-semibold sm:text-lg">U</span>
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {email || 'Account'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Your unified account hub
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              {/* Streak summary – compact */}
              <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
                <span className="text-xs">🔥</span>
                {streakLoading ? (
                  <span>Calculating streak…</span>
                ) : (
                  <span>
                    {streak ?? 0} day streak
                    {longest && longest > 0 && (
                      <span className="ml-1 text-[10px] text-muted-foreground/80">
                        max {longest}
                      </span>
                    )}
                  </span>
                )}
              </div>
              {/* Password reset button */}
              <Button
                type="button"
                variant="ghost"
                className="rounded-ds-xl px-3 py-1 text-xs"
                onClick={handleReset}
                disabled={!email || sending}
                loading={sending}
              >
                Reset password
              </Button>
            </div>
          </Card>

          {/* Card grid */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Activity log card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-small font-medium text-foreground">Activity log</h2>
                    <p className="mt-1 text-small text-muted-foreground">
                      Unified timeline of your mocks, practice, and streak events.
                    </p>
                  </div>
                </div>
                <Badge variant={activityStats.recentActivities > 0 ? 'info' : 'neutral'}>
                  {activityStats.recentActivities} new
                </Badge>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-small">
                  <span className="text-muted-foreground">Recent activities:</span>
                  <span className="font-medium">{activityStats.recentActivities}</span>
                </div>
                <div className="flex items-center justify-between text-small">
                  <span className="text-muted-foreground">Total logged:</span>
                  <span className="font-medium">{activityStats.totalActivities}</span>
                </div>
                <div className="mt-4 border-t border-border pt-4">
                  <h3 className="mb-2 text-xs font-semibold text-muted-foreground">Quick actions</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="soft" size="sm" className="min-w-[120px] flex-1">
                      <Link href="/account/activity">
                        <Clock className="mr-2 h-3 w-3" /> View timeline
                      </Link>
                    </Button>
                    <Button asChild variant="soft" size="sm" className="min-w-[120px] flex-1">
                      <Link href="/mock">
                        <History className="mr-2 h-3 w-3" /> Open mocks
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Plan & billing card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Crown className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-small font-medium text-foreground">Plan &amp; billing</h2>
                    <p className="mt-1 text-small text-muted-foreground">
                      Check subscription status and manage payments from one place.
                    </p>
                  </div>
                </div>
                {isPremiumPlan && <Badge variant="accent">Premium</Badge>}
              </div>
              <div className="space-y-3">
                {billingLoading ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 rounded bg-muted" />
                    <div className="h-4 w-2/3 rounded bg-muted" />
                  </div>
                ) : billingError ? (
                  <p className="text-small text-danger">{billingError}</p>
                ) : summary ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant(summary.status)}>{formatStatus(summary.status)}</Badge>
                      {planDefinition && (
                        <span className="text-small text-muted-foreground">{planDefinition.name}</span>
                      )}
                    </div>
                    {planMeta.length > 0 && (
                      <p className="text-caption text-muted-foreground">
                        {planMeta.map((part, index) => (
                          <React.Fragment key={`${part}-${index}`}>
                            {index > 0 && <span aria-hidden="true"> · </span>}
                            <span>{part}</span>
                          </React.Fragment>
                        ))}
                      </p>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      {isPremiumPlan ? (
                        portalAvailable ? (
                          <Button onClick={openPortal} loading={portalLoading} variant="soft" tone="accent" className="flex-1">
                            {portalLoading ? 'Opening…' : 'Manage billing'}
                          </Button>
                        ) : (
                          <Button asChild variant="soft" className="flex-1">
                            <Link href="/account/billing">Open billing hub</Link>
                          </Button>
                        )
                      ) : (
                        <Button asChild variant="soft" tone="accent" className="flex-1">
                          <Link href="/pricing">Upgrade to Premium</Link>
                        </Button>
                      )}
                    </div>
                    {!isPremiumPlan && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Unlock unlimited mocks, full AI feedback, and advanced analytics.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-small text-muted-foreground">No active subscription found.</p>
                )}
              </div>
            </div>

            {/* Language card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-small font-medium text-foreground">Language</h2>
                  <p className="mt-1 text-small text-muted-foreground">
                    Switch between English and Urdu interface.
                  </p>
                </div>
              </div>
              <Button variant="soft" onClick={() => safePush('/account/preferences/language')} className="w-full">
                <Globe className="mr-2 h-4 w-4" /> Language settings
              </Button>
            </div>

            {/* Notifications card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-small font-medium text-foreground">Notifications</h2>
                  <p className="mt-1 text-small text-muted-foreground">
                    Daily reminders and nudges for your study rhythm.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-small">
                  <span>Email notifications</span>
                  <Badge variant="success">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between text-small">
                  <span>WhatsApp / Push</span>
                  <Badge variant="neutral">Configured in settings</Badge>
                </div>
                <Button variant="soft" onClick={() => safePush('/account/preferences/notifications')} className="mt-3 w-full">
                  <Bell className="mr-2 h-4 w-4" /> Open notification settings
                </Button>
              </div>
            </div>

            {/* Accessibility card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <SettingsIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-small font-medium text-foreground">Accessibility</h2>
                  <p className="mt-1 text-small text-muted-foreground">High contrast, focus ring tuning, and reduced motion.</p>
                </div>
              </div>
              <Button variant="soft" onClick={() => safePush('/account/preferences/accessibility')} className="w-full">
                <SettingsIcon className="mr-2 h-4 w-4" /> Accessibility settings
              </Button>
            </div>

            {/* Security card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-small font-medium text-foreground">Security</h2>
                  <p className="mt-1 text-small text-muted-foreground">MFA, active sessions, and login history.</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-small">
                  <span className="text-muted-foreground">Email on file:</span>
                  <span className="max-w-[150px] truncate font-medium" title={email || ''}>{email || 'Not set'}</span>
                </div>
                <Button variant="solid" tone="accent" onClick={handleReset} disabled={!email || sending} loading={sending} className="w-full">
                  <Key className="mr-2 h-4 w-4" /> Reset password
                </Button>
                <Button variant="soft" onClick={() => safePush('/account/security')} className="w-full">
                  <Shield className="mr-2 h-4 w-4" /> Security settings
                </Button>
              </div>
            </div>

            {/* Premium PIN card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-small font-medium text-foreground">Premium PIN</h2>
                  <p className="mt-1 text-small text-muted-foreground">Redeem a PIN to unlock premium without adding a card.</p>
                </div>
              </div>
              <Button asChild variant="soft" className="w-full">
                <Link href="/account/redeem">
                  <Key className="mr-2 h-4 w-4" /> Redeem premium PIN
                </Link>
              </Button>
            </div>

            {/* Teacher panel (conditional) */}
            {isTeacher && (
              <div className="rounded-xl border border-border bg-card p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-small font-medium text-foreground">Teacher panel</h2>
                    <p className="mt-1 text-small text-muted-foreground">Manage students, assignments, and feedback.</p>
                  </div>
                </div>
                <Button asChild variant="soft" className="w-full">
                  <Link href="/teacher/dashboard">
                    <Users className="mr-2 h-4 w-4" /> Open teacher panel
                  </Link>
                </Button>
              </div>
            )}

            {/* Help & support card */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-small font-medium text-foreground">Help &amp; support</h2>
                  <p className="mt-1 text-small text-muted-foreground">Get help, send feedback, or report an issue.</p>
                </div>
              </div>
              <div className="space-y-2">
                <Button asChild variant="soft" className="w-full" size="sm">
                  <Link href="/support">
                    <MessageSquare className="mr-2 h-4 w-4" /> Contact support
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full" size="sm">
                  <Link href="/feedback">Send feedback</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Admin panel (conditional) */}
          {isAdmin && (
            <Card className="mt-6 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/20 p-2 text-primary">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="flex items-center gap-2 text-lg font-semibold">
                        Admin control panel
                        <Badge variant="primary" className="ml-2">Admin</Badge>
                      </h2>
                      <p className="text-sm text-muted-foreground">Manage teachers, partners, pricing, and analytics.</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline">Activities: {activityStats.totalActivities}</Badge>
                    <Badge variant="outline">Pending tasks: {activityStats.pendingTasks}</Badge>
                    <Badge variant="outline">Completed: {activityStats.completedTasks}</Badge>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Link href="/admin" className="flex-1">
                    <Button variant="solid" tone="primary" className="w-full">
                      <Shield className="mr-2 h-4 w-4" /> Admin dashboard
                    </Button>
                  </Link>
                  <Link href="/admin/analytics" className="flex-1">
                    <Button variant="soft" className="w-full">View analytics</Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* Data management */}
          <Card className="mt-6 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold">Data &amp; privacy</h3>
                <p className="mt-1 text-sm text-muted-foreground">Export your activity data or request account deletion.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">Export activity log</Button>
                <Button variant="outline" size="sm" tone="danger">Delete account</Button>
              </div>
            </div>
          </Card>
        </Container>
      </main>
    </>
  );
}
