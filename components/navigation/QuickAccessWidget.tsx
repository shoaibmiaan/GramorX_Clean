// File: components/layout/QuickAccessWidget.tsx
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { navigationSchema } from '@/config/navigation';
import { filterNavItems } from '@/lib/navigation/utils';
import { Icon } from '@/components/design-system/Icon';
import { Button } from '@/components/design-system/Button';
import AuthAssistant from '@/components/auth/AuthAssistant';
import { useUserContext } from '@/context/UserContext';
import { isFeatureEnabled } from '@/lib/constants/features';
import type { SubscriptionTier } from '@/lib/navigation/types';

const inspirationPrompts = [
  {
    id: 'optimize-funnel',
    title: 'Optimize my funnel',
    description: 'Find the next best growth experiment.',
  },
  {
    id: 'content-plan',
    title: 'Plan a campaign',
    description: 'Outline email, ads, and social in one go.',
  },
  {
    id: 'metrics',
    title: 'Explain my metrics',
    description: 'Translate analytics into next actions.',
  },
];

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
  if (!isFeatureEnabled('floatingWidget')) {
    return null;
  }

  return (
    <div className="fixed inset-x-4 bottom-24 z-40 flex flex-col items-stretch gap-3 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-auto sm:items-end">
      <AnimatePresence>
        {open && (
          <motion.div
            id="quick-actions-menu"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full max-w-xs rounded-3xl border border-border/50 bg-background/95 p-5 text-foreground shadow-2xl backdrop-blur-xl dark:border-border-dark/60 dark:bg-background-dark/90 sm:max-w-sm"
            role="dialog"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary dark:text-primary-dark">GX Brain</p>
                <p className="text-lg font-semibold">Hi there. What should we dive into today?</p>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground-dark">
                  A copiloted surface that combines smart suggestions and quick shortcuts.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted dark:hover:bg-muted-dark"
                aria-label="Close GX Brain"
              >
                <Icon name="X" className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl bg-muted/60 p-3 dark:bg-muted-dark/50">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground-dark">
                  Recommended prompts
                </p>
                <div className="space-y-2">
                  {inspirationPrompts.map((prompt) => (
                    <button
                      type="button"
                      key={prompt.id}
                      className="w-full rounded-xl border border-border/60 px-3 py-2 text-left text-sm transition hover:border-primary hover:bg-background dark:border-border-dark/60 dark:hover:border-primary-dark"
                      onClick={() => setOpen(true)}
                    >
                      <p className="font-medium">{prompt.title}</p>
                      <p className="text-xs text-muted-foreground dark:text-muted-foreground-dark">{prompt.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {hasQuickActions && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground-dark">
                    Quick shortcuts
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/50 px-3 py-1.5 text-xs font-medium transition hover:border-primary hover:bg-primary/10 dark:border-border-dark/60 dark:hover:border-primary-dark"
                        onClick={() => setOpen(false)}
                      >
                        {item.icon && <Icon name={item.icon} className="h-4 w-4" />}
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-border/60 p-3 dark:border-border-dark/60">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground-dark">
                  Chat with GX Brain
                </p>
                <AuthAssistant
                  variant="embedded"
                  className="w-full rounded-xl border-none bg-transparent p-0 shadow-none"
                  initialMessage={
                    <>
                      Hi there 👋 I&rsquo;m GX Brain, your on-page copilot. Ask me about tasks, flows, or where to find anything in the workspace.
                    </>
                  }
                />
              </div>
            </div>
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
            className="w-full rounded-full bg-primary text-primary-foreground shadow-xl hover:opacity-90 dark:bg-primary-dark dark:text-primary-foreground-dark sm:w-auto"
            onClick={() => setOpen((prev) => !prev)}
            aria-expanded={open}
            aria-controls="quick-actions-menu"
          >
            {open ? 'Close GX Brain' : 'Open GX Brain'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default QuickAccessWidget;