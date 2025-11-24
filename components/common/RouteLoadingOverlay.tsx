// components/common/RouteLoadingOverlay.tsx
'use client';

import clsx from 'clsx';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTheme } from 'next-themes';

import type { SubscriptionTier } from '@/lib/navigation/types';

interface RouteLoadingOverlayProps {
  active: boolean;
  tier?: SubscriptionTier | null;
  targetLayout?: string;
}

const LAYOUT_LABELS: Record<string, string> = {
  dashboard: 'dashboard',
  auth: 'authentication',
  exam: 'exam environment',
  teacher: 'teacher workspace',
  admin: 'admin area',
  institutions: 'institutions portal',
  marketplace: 'marketplace',
  learning: 'learning hub',
  community: 'community space',
  reports: 'reports section',
  marketing: 'marketing suite',
};

function Spinner({ themeMode }: { themeMode: 'light' | 'dark' }) {
  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <div
        className={clsx(
          'absolute inset-0 rounded-full border-2 border-transparent',
          themeMode === 'dark' ? 'border-white/10' : 'border-foreground/10'
        )}
      />
      <div
        className={clsx(
          'absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary animate-spin',
          themeMode === 'dark' ? 'border-t-primary/80 border-r-primary/70' : 'border-t-primary border-r-primary'
        )}
        style={{ animationDuration: '1s' }}
      />
      <div
        className={clsx(
          'absolute inset-2 rounded-full border-2 border-transparent border-b-primary/50 border-l-primary/40',
          themeMode === 'dark' ? 'border-b-primary/40 border-l-primary/30' : 'border-b-primary/50 border-l-primary/30'
        )}
        style={{ animation: 'spin 1.6s linear infinite reverse' }}
      />
      <div className="absolute h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_12px] shadow-primary/40" />
    </div>
  );
}

function ProgressPulse({ themeMode }: { themeMode: 'light' | 'dark' }) {
  return (
    <div
      className={clsx(
        'mt-6 h-1.5 w-full overflow-hidden rounded-full',
        themeMode === 'dark' ? 'bg-white/10' : 'bg-foreground/10'
      )}
    >
      <motion.div
        className="h-full rounded-full bg-primary"
        initial={{ x: '-60%' }}
        animate={{ x: '40%' }}
        transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      />
    </div>
  );
}

function getMessage(targetLayout?: string) {
  if (!targetLayout) return 'Preparing your next page…';
  const key = targetLayout.toLowerCase();
  return `Preparing your ${LAYOUT_LABELS[key] ?? 'next page'}…`;
}

export function RouteLoadingOverlay({
  active,
  tier: _tier,
  targetLayout,
}: RouteLoadingOverlayProps) {
  const { resolvedTheme } = useTheme();
  const themeMode = (resolvedTheme === 'dark' ? 'dark' : 'light') as 'light' | 'dark';
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          className={clsx(
            'pointer-events-none fixed inset-0 z-[200] flex items-center justify-center px-4 sm:px-6',
            themeMode === 'dark'
              ? 'bg-slate-950/80 backdrop-blur'
              : 'bg-gradient-to-b from-white/80 to-slate-100/70 backdrop-blur'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: [0.33, 1, 0.68, 1] }}
        >
          <motion.div
            className={clsx(
              'pointer-events-auto w-full max-w-sm rounded-3xl border bg-background/95 p-6 text-center shadow-2xl backdrop-blur',
              themeMode === 'dark' ? 'border-white/10' : 'border-foreground/10'
            )}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: [0.33, 1, 0.68, 1] }}
            role="status"
            aria-live="polite"
          >
            <Spinner themeMode={themeMode} />
            <p className="mt-5 text-sm font-medium text-foreground/80 sm:text-base">
              {getMessage(targetLayout)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Switching sections, please hold on.</p>
            <ProgressPulse themeMode={themeMode} />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default RouteLoadingOverlay;
