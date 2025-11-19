// File: components/layout/QuickAccessWidget.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Added for smooth open/close
import Link from 'next/link';
import { navigationSchema } from '@/config/navigation';
import { filterNavItems } from '@/lib/navigation/utils';
import { Icon } from '@/components/design-system/Icon';
import { Button } from '@/components/design-system/Button';
import AuthAssistant from '@/components/auth/AuthAssistant';

type TabId = 'quick' | 'help';
import { useUserContext } from '@/context/UserContext';
import { isFeatureEnabled } from '@/lib/constants/features';
import type { SubscriptionTier } from '@/lib/navigation/types';

export const QuickAccessWidget: React.FC = () => {
  const { user } = useUserContext();
  const [open, setOpen] = React.useState(false);

  const isAuthenticated = Boolean(user?.id);

  // Read tier from user metadata (typed), default to 'free'
  const metadata = (user?.user_metadata ?? {}) as { tier?: SubscriptionTier };
  const subscriptionTier: SubscriptionTier = metadata.tier ?? 'free';

  const items = React.useMemo(
    () =>
      filterNavItems(navigationSchema.floating.quickActions, {
        isAuthenticated,
        tier: subscriptionTier,
      }),
    [isAuthenticated, subscriptionTier]
  );
  const hasQuickActions = items.length > 0;
  const [activeTab, setActiveTab] = React.useState<TabId>(hasQuickActions ? 'quick' : 'help');

  React.useEffect(() => {
    if (!hasQuickActions && activeTab === 'quick') {
      setActiveTab('help');
    }
  }, [activeTab, hasQuickActions]);

  React.useEffect(() => {
    if (!open && hasQuickActions) {
      setActiveTab('quick');
    }
  }, [hasQuickActions, open]);

  const tabs = React.useMemo(() => {
    const base: { id: TabId; label: string }[] = [];
    if (hasQuickActions) {
      base.push({ id: 'quick', label: 'Quick actions' });
    }
    base.push({ id: 'help', label: 'Need help' });
    return base;
  }, [hasQuickActions]);

  if (!isFeatureEnabled('floatingWidget')) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-24 z-40 flex flex-col items-stretch gap-3 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-auto sm:items-end">
      <AnimatePresence>
        {open && (
          <motion.div
            id="quick-actions-menu"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-xs rounded-2xl border border-border dark:border-border-dark bg-card/95 dark:bg-card-dark/95 p-4 shadow-xl sm:max-w-sm"
            role="menu"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-slab text-h4">Quick help</p>
                <p className="text-xs text-muted-foreground dark:text-muted-foreground-dark">
                  {activeTab === 'quick'
                    ? 'Stay on track with a single tap.'
                    : 'Ask a question or get support instantly.'}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted dark:hover:bg-muted-dark"
                aria-label="Close quick actions"
              >
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            {tabs.length > 1 && (
              <div className="mb-3 grid grid-cols-2 gap-2 rounded-2xl bg-muted/60 p-1 text-xs font-semibold text-muted-foreground dark:bg-muted-dark/60">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`rounded-xl px-3 py-1 transition ${
                      activeTab === tab.id
                        ? 'bg-background text-foreground shadow-sm dark:bg-background-dark'
                        : ''
                    }`}
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
            {activeTab === 'quick' && hasQuickActions && (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 rounded-xl border border-border/60 dark:border-border-dark/60 px-3 py-2.5 text-sm transition hover:border-border dark:hover:border-border-dark hover:bg-muted dark:hover:bg-muted-dark"
                      onClick={() => setOpen(false)}
                    >
                      {item.icon && <Icon name={item.icon} className="h-5 w-5 text-primary dark:text-primary-dark" />}
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto inline-flex items-center rounded-full bg-muted dark:bg-muted-dark px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground-dark">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {activeTab === 'help' && (
              <div className="space-y-2 rounded-2xl border border-border/60 bg-card/80 p-2 dark:border-border-dark/60 dark:bg-card-dark/80">
                <AuthAssistant variant="embedded" className="w-full rounded-xl border-none bg-transparent shadow-none" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="self-end sm:self-auto">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            variant="secondary"
            className="w-full rounded-full bg-primary dark:bg-primary-dark text-primary-foreground dark:text-primary-foreground-dark shadow-xl hover:opacity-90 sm:w-auto"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls="quick-actions-menu"
          >
            {open ? 'Close' : 'Need help & quick actions'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default QuickAccessWidget;