import React, { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';

import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Container } from '@/components/design-system/Container';
import Icon from '@/components/design-system/Icon';

type MockPinGateProps = {
  children: ReactNode;
  module?: string;
};

export function MockPinGate({ children, module = 'mock' }: MockPinGateProps) {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  const storageKey = `gx_mock_pin_unlocked:${module}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(storageKey);
    if (stored === '1') {
      setUnlocked(true);
    }
  }, [storageKey]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!pin || pin.length < 4) {
      setPinError('Enter your 4–8 digit mock PIN.');
      return;
    }

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, '1');
    }

    setPinError(null);
    setUnlocked(true);
  };

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <Container className="max-w-md">
        <Card className="rounded-ds-3xl px-6 py-7 shadow-2xl border border-slate-800 bg-slate-900">
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <Icon name="ShieldCheck" className="h-5 w-5 text-primary" />
            </span>
            <div className="space-y-0.5">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Mock entry</p>
              <h1 className="text-lg font-semibold text-slate-50">Enter your mock PIN to continue</h1>
              <Badge size="sm" variant="subtle" className="bg-slate-800 text-slate-200">
                Protected: {module}
              </Badge>
            </div>
          </div>

          <p className="mb-6 text-sm text-slate-400">
            This PIN is unique for your booked mock. No PIN, no access.
          </p>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label htmlFor="mock-pin" className="block text-xs font-medium text-slate-300 mb-1.5">
                Mock PIN
              </label>
              <input
                id="mock-pin"
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value.trim())}
                className="w-full rounded-ds-2xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/40"
                placeholder="4–8 digit PIN"
              />
              {pinError && <p className="mt-1 text-xs text-red-400">{pinError}</p>}
            </div>

            <div className="flex items-center justify-between">
              <Button type="submit" variant="primary" size="lg" className="rounded-ds-2xl px-6">
                Unlock Mock
              </Button>
              <button
                type="button"
                className="text-xs text-slate-400 hover:text-slate-200 underline-offset-2 hover:underline"
                onClick={() => router.push('/')}
              >
                Back to home
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-800 pt-4 text-xs text-slate-500 space-y-1">
            <p>
              • Don’t share this PIN on WhatsApp groups or Telegram. You’re just helping others cheat.
            </p>
            <p>• If the PIN doesn’t work, ping support on WhatsApp.</p>
          </div>
        </Card>
      </Container>
    </main>
  );
}
