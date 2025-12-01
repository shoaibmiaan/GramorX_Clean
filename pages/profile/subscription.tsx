// pages/profile/subscription.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Alert } from '@/components/design-system/Alert';
import { useToast } from '@/components/design-system/Toaster';
import { fetchProfile } from '@/lib/profile';
import type { Profile } from '@/types/profile';
import { GlobalPlanGuard } from '@/components/GlobalPlanGuard';
import { useLocale } from '@/lib/locale';
import type { PlanId } from '@/types/pricing';

type FieldStatus = 'active' | 'inactive' | 'expired' | 'canceled';

const PLAN_DISPLAY: Record<string, { name: string; features: string[]; price?: string }> = {
  free: {
    name: 'Free',
    features: ['Basic access', 'Limited daily quota', 'Community support'],
    price: '$0/month',
  },
  premium: { // Assuming 'premium' as a tier; adjust based on your enum
    name: 'Premium',
    features: ['Unlimited access', 'Advanced analytics', 'Priority support', 'Offline mode'],
    price: '$9.99/month',
  },
  // Add more tiers as needed, e.g., pro: {...}
};

export default function SubscriptionPage() {
  const router = useRouter();
  const { t } = useLocale();
  const { error: toastError } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const fetchedProfile = await fetchProfile();
        if (cancelled) return;
        if (!fetchedProfile) {
          throw new Error('Profile not found');
        }
        setProfile(fetchedProfile);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && err.message === 'Not authenticated') {
          await router.replace('/login');
          return;
        }
        console.error('Failed to load subscription info', err);
        setError(t('subscription.load.error', 'Unable to load subscription details.'));
        toastError(t('subscription.load.error', 'Unable to load subscription details.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, t, toastError]);

  const currentPlan: PlanId = profile?.tier ?? 'free';
  const status: FieldStatus = profile?.subscription_status ?? 'inactive';
  const expiresAt = profile?.subscription_expires_at ?? profile?.premium_until;
  const isPremium = currentPlan !== 'free' && status === 'active';
  const isTrial = !!profile?.premium_until && new Date(profile.premium_until) > new Date();
  const displayPlan = PLAN_DISPLAY[currentPlan] ?? PLAN_DISPLAY.free;

  if (loading) {
    return (
      <section className="py-24 bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
        <Container>
          <Card className="mx-auto max-w-xl rounded-ds-2xl p-6">
            {t('subscription.loading', 'Loading subscription…')}
          </Card>
        </Container>
      </section>
    );
  }

  return (
    <GlobalPlanGuard min="free" userPlan={currentPlan}>
      <section className="py-24 bg-lightBg dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
        <Container>
          <div className="mx-auto max-w-2xl space-y-6">
            {error && (
              <Alert variant="error" role="alert" className="rounded-ds-2xl">
                {error}
              </Alert>
            )}
            <Card className="rounded-ds-2xl p-6">
              <div className="mb-6 flex items-center justify-between">
                <h1 className="font-slab text-display">{t('subscription.title', 'Subscription')}</h1>
              </div>
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="rounded-full bg-electricBlue/10 px-4 py-2 text-electricBlue">
                    <span className="font-semibold">{displayPlan.name} Plan</span>
                  </div>
                  {isTrial && (
                    <Alert variant="warning" className="w-full">
                      {t('subscription.trial', 'Your premium trial ends on {{date}}.', {
                        date: new Date(profile!.premium_until!).toLocaleDateString(),
                      })}
                    </Alert>
                  )}
                  <div className="text-2xl font-bold">{displayPlan.price}</div>
                  <p className="text-small text-mutedText max-w-md">
                    {t(
                      'subscription.subtitle',
                      'Manage your plan, view billing, and upgrade for more features.',
                    )}
                  </p>
                </div>
                <ul className="space-y-2 text-small">
                  {displayPlan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-electricBlue" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-3">
                  {status === 'active' ? (
                    <Button
                      variant="outline"
                      className="rounded-ds-xl"
                      onClick={() => router.push('/pricing/overview')}
                    >
                      {t('subscription.manage', 'Manage subscription')}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      className="rounded-ds-xl"
                      onClick={() => router.push('/pricing/overview')}
                    >
                      {t('subscription.upgrade', 'Upgrade to Premium')}
                    </Button>
                  )}
                  {profile?.stripe_customer_id && status === 'active' && (
                    <Button
                      variant="ghost"
                      className="rounded-ds-xl"
                      onClick={() => {
                        // TODO: Create Stripe portal session via API route
                        toastError(t('subscription.portal.coming', 'Portal link coming soon.'));
                      }}
                    >
                      {t('subscription.billing', 'View billing history')}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </Container>
      </section>
    </GlobalPlanGuard>
  );
}