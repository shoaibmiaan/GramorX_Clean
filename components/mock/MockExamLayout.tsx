// components/mock/MockExamLayout.tsx
import React, { useState, type ReactNode } from 'react';
import { useRouter } from 'next/router';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

type MockExamLayoutProps = {
  children: ReactNode;
  examTitle?: string;
  moduleName?: 'Listening' | 'Reading' | 'Writing' | 'Speaking' | string;
  showExitButton?: boolean;
};

type ThemeId = 'classic' | 'dark' | 'focus' | 'sepia' | 'high-contrast';

const THEMES: {
  id: ThemeId;
  name: string;
  description: string;
  bgClass: string;
  headerClass: string;
  panelClass: string;
}[] = [
  {
    id: 'classic',
    name: 'Classic Light',
    description: 'Clean white exam layout. Closest to actual IELTS CBE feel.',
    bgClass: 'bg-white',
    headerClass: 'bg-slate-50 border-b border-slate-200',
    panelClass: 'bg-slate-50',
  },
  {
    id: 'dark',
    name: 'Dim Dark',
    description: 'Dark mode for tired eyes. Neutral, no distractions.',
    bgClass: 'bg-slate-950',
    headerClass: 'bg-slate-900 border-b border-slate-800',
    panelClass: 'bg-slate-900',
  },
  {
    id: 'focus',
    name: 'Focus Mode',
    description: 'Muted background, strong focus frame around questions.',
    bgClass: 'bg-slate-900/90',
    headerClass: 'bg-black/70 border-b border-slate-700',
    panelClass: 'bg-slate-950/80',
  },
  {
    id: 'sepia',
    name: 'Paper Sepia',
    description: 'Off-white sepia feel, easy on eyes during long mocks.',
    bgClass: 'bg-surface-muted',
    headerClass: 'bg-muted border-b border-border/60',
    panelClass: 'bg-surface',
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Strong contrast for low-vision / accessibility.',
    bgClass: 'bg-black',
    headerClass: 'bg-black border-b border-yellow-400',
    panelClass: 'bg-black',
  },
];

export const MockExamLayout: React.FC<MockExamLayoutProps> = ({
  children,
  examTitle = 'Full Mock Test',
  moduleName = 'Listening',
  showExitButton = true,
}) => {
  const router = useRouter();

  const [step, setStep] = useState<'PIN' | 'THEME' | 'EXAM'>('PIN');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [themeId, setThemeId] = useState<ThemeId | null>(null);

  const theme = THEMES.find((t) => t.id === themeId) ?? THEMES[0];

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!pin || pin.length < 4) {
      setPinError('Enter your 4–8 digit mock PIN.');
      return;
    }

    // TODO: integrate with Supabase / API:
    // const { data, error } = await supabase.rpc('validate_mock_pin', { pin });
    // if (error || !data?.valid) { setPinError('Invalid PIN'); return; }

    setPinError(null);
    setStep('THEME');
  }

  function handleThemeContinue() {
    if (!themeId) return;
    setStep('EXAM');
  }

  function handleExit() {
    // Central place to exit the mock exam environment
    router.push('/mock/dashboard');
  }

  // STEP 1 — PIN GATE
  if (step === 'PIN') {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <Container className="max-w-md">
          <Card className="rounded-ds-3xl px-6 py-7 shadow-2xl border border-slate-800 bg-slate-900">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                <Icon name="ShieldCheck" className="h-5 w-5 text-primary" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  MOCK ENTRY
                </p>
                <h1 className="text-lg font-semibold text-slate-50">
                  Enter your mock PIN to continue
                </h1>
              </div>
            </div>

            <p className="mb-6 text-sm text-slate-400">
              This PIN is unique for your booked mock. No PIN, no access.
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="mock-pin"
                  className="block text-xs font-medium text-slate-300 mb-1.5"
                >
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
                {pinError && (
                  <p className="mt-1 text-xs text-red-400">{pinError}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="rounded-ds-2xl px-6"
                >
                  Unlock Mock
                </Button>
                <button
                  type="button"
                  className="text-xs text-slate-400 hover:text-slate-200 underline-offset-2 hover:underline"
                  onClick={() => router.push('/mock')}
                >
                  Back to mock home
                </button>
              </div>
            </form>

            <div className="mt-6 border-t border-slate-800 pt-4 text-xs text-slate-500 space-y-1">
              <p>
                • Don’t share this PIN on WhatsApp groups or Telegram. You’re
                just helping others cheat.
              </p>
              <p>• If the PIN doesn’t work, ping support on WhatsApp.</p>
            </div>
          </Card>
        </Container>
      </main>
    );
  }

  // STEP 2 — THEME PICKER
  if (step === 'THEME') {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <Container className="max-w-5xl">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                <Icon name="MonitorCog" className="h-5 w-5 text-primary" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                  MOCK ENVIRONMENT
                </p>
                <h1 className="text-xl font-semibold text-slate-50">
                  Pick how your exam screen should look
                </h1>
                <p className="text-xs text-slate-400">
                  You can’t change this in the middle of the mock. Choose what
                  actually helps you focus.
                </p>
              </div>
            </div>

            <Badge tone="info" size="sm">
              Module: {moduleName}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setThemeId(t.id)}
                className={`group relative overflow-hidden rounded-ds-3xl border text-left transition ${
                  themeId === t.id
                    ? 'border-primary ring-2 ring-primary/40'
                    : 'border-slate-800 hover:border-slate-600'
                }`}
              >
                <div
                  className={`h-24 w-full ${t.panelClass} border-b border-slate-700`}
                >
                  <div className="flex h-full items-center justify-center gap-2 text-xs text-slate-300">
                    <span className="inline-flex h-5 w-20 rounded-full bg-slate-700/70" />
                    <span className="inline-flex h-5 w-32 rounded-full bg-slate-700/40" />
                    <span className="inline-flex h-5 w-16 rounded-full bg-slate-700/60" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-slate-50">
                      {t.name}
                    </p>
                    {themeId === t.id && (
                      <Badge tone="success" size="xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{t.description}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-slate-200 underline-offset-2 hover:underline"
              onClick={() => {
                setThemeId(null);
                setStep('PIN');
              }}
            >
              Change PIN / mock
            </button>
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="rounded-ds-2xl px-6"
              disabled={!themeId}
              onClick={handleThemeContinue}
            >
              Continue to exam
            </Button>
          </div>
        </Container>
      </main>
    );
  }

  // STEP 3 — EXAM SHELL
  return (
    <div className={`min-h-screen flex flex-col ${theme.bgClass}`}>
      {/* HEADER */}
      <header
        className={`${theme.headerClass} px-3 py-2 md:px-6 md:py-3 flex items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
            <Icon name="Gauge" className="h-4 w-4 text-primary" />
          </span>
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
              GRAMORX MOCK
            </p>
            <p className="text-xs font-medium text-slate-50">
              {examTitle} — {moduleName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-600/70 bg-black/30 px-3 py-1">
            <Icon name="Timer" className="h-3.5 w-3.5 text-primary" />
            {/* Hook into real timer logic */}
            <span className="text-[11px] font-mono text-slate-50">
              29:59
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-600/70 bg-black/30 px-3 py-1">
            <span className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-700">
              <span className="block h-full w-1/3 bg-primary" />
            </span>
            <span className="text-[10px] text-slate-200">
              Section 1 of 4
            </span>
          </div>

          <Badge tone="neutral" size="sm">
            Theme: {theme.name}
          </Badge>

          {showExitButton && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full border border-red-500/40 bg-black/40 text-[11px] text-red-300 hover:bg-red-900/40"
              onClick={handleExit}
            >
              <Icon name="DoorOpen" className="mr-1.5 h-3.5 w-3.5" />
              Exit mock
            </Button>
          )}
        </div>
      </header>

      {/* MAIN EXAM CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <Container className="py-4 md:py-6">{children}</Container>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-700 bg-black/60 px-3 py-2 md:px-6 md:py-3">
        <div className="flex flex-col gap-2 text-[11px] text-slate-300 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Icon name="Info" className="h-3 w-3 text-slate-400" />
            <span>
              Your answers auto-save every few seconds. Internet drops won’t
              instantly kill your mock.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              <span>Connection OK</span>
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-400">
              <Icon name="Shield" className="h-3 w-3" />
              Anti-cheat checks running in background.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
