import * as React from 'react';
import { useRouter } from 'next/router';

import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Container } from '@/components/design-system/Container';
import { Input } from '@/components/design-system/Input';
import { Badge } from '@/components/design-system/Badge';

const cn = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ');

type Step = 'pin' | 'theme' | 'exam';

type ThemeKey = 'classic' | 'dim' | 'focus' | 'sepia' | 'contrast';

type ThemeOption = {
  key: ThemeKey;
  name: string;
  description: string;
  previewClass: string;
  examClass: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    key: 'classic',
    name: 'Classic Light',
    description: 'Bright interface similar to IELTS CBT labs.',
    previewClass: 'bg-white text-slate-900 border-slate-200',
    examClass: 'bg-slate-50 text-slate-900',
  },
  {
    key: 'dim',
    name: 'Dim Dark',
    description: 'Low-light friendly neutral palette.',
    previewClass: 'bg-slate-900 text-slate-50 border-slate-800',
    examClass: 'bg-slate-950 text-slate-100',
  },
  {
    key: 'focus',
    name: 'Focus Mode',
    description: 'Muted chrome with minimal distractions.',
    previewClass: 'bg-slate-100 text-slate-900 border-slate-300',
    examClass: 'bg-slate-100 text-slate-900',
  },
  {
    key: 'sepia',
    name: 'Sepia',
    description: 'Paper-like tone for extended reading.',
    previewClass: 'bg-amber-50 text-stone-900 border-amber-200',
    examClass: 'bg-amber-50 text-stone-900',
  },
  {
    key: 'contrast',
    name: 'High Contrast',
    description: 'Accessibility-first colours with high contrast.',
    previewClass: 'bg-black text-white border-white/20',
    examClass: 'bg-black text-white',
  },
];

export type MockExamLayoutProps = {
  children: React.ReactNode;
  examTitle: string;
  moduleKey: 'listening' | 'reading' | 'writing' | 'speaking' | 'full' | (string & {});
  testSlug?: string;
  showExitButton?: boolean;
};

export type PinValidateSuccess = {
  ok: true;
  sessionId: string;
  module: string;
  testSlug?: string;
  expiresAt?: string | null;
};

export type PinValidateError = { ok: false; error: string };

export type PinValidateResponse = PinValidateSuccess | PinValidateError;

export function MockExamLayout({
  children,
  examTitle,
  moduleKey,
  testSlug,
  showExitButton = true,
}: MockExamLayoutProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>('pin');
  const [pin, setPin] = React.useState('');
  const [pinError, setPinError] = React.useState<string | null>(null);
  const [pinBusy, setPinBusy] = React.useState(false);
  const [session, setSession] = React.useState<PinValidateSuccess | null>(null);
  const [theme, setTheme] = React.useState<ThemeKey | null>(null);

  const moduleLabel = React.useMemo(() => {
    if (!moduleKey) return '';
    return moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1).toLowerCase();
  }, [moduleKey]);

  const resolvedTheme = React.useMemo(() => {
    return theme ? THEME_OPTIONS.find((opt) => opt.key === theme) ?? null : null;
  }, [theme]);

  const rootClass = resolvedTheme?.examClass ?? 'bg-slate-50 text-slate-900';

  const stepIndex = React.useMemo(() => {
    switch (step) {
      case 'pin':
        return 0;
      case 'theme':
        return 1;
      case 'exam':
        return 2;
      default:
        return 0;
    }
  }, [step]);

  const handlePinSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pin) {
      setPinError('Enter the PIN shared by the GramorX team.');
      return;
    }

    setPinBusy(true);
    setPinError(null);

    try {
      const res = await fetch('/api/mock/pin/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, module: moduleKey, testSlug }),
      });

      const data = (await res.json()) as PinValidateResponse;
      if (!res.ok || !data.ok) {
        const err = !res.ok
          ? 'We could not validate that PIN. Try again.'
          : data.error || 'We could not validate that PIN. Try again.';
        setPinError(err);
        return;
      }

      setSession(data);
      setStep('theme');
    } catch (error) {
      console.error('mock-pin-validate', error);
      setPinError('Unable to reach the PIN service. Check your connection and try again.');
    } finally {
      setPinBusy(false);
    }
  };

  const handleContinueToExam = () => {
    if (!resolvedTheme) return;
    setStep('exam');
  };

  const handleExit = () => {
    void router.push('/mock/dashboard');
  };

  return (
    <div className={cn('min-h-screen w-full bg-background text-foreground transition-colors', rootClass)}>
      <Container className="py-10">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <div className="flex flex-col gap-2 text-center">
            <p className="text-xs font-semibold tracking-[0.2em] text-primary">GRAMORX MOCK</p>
            <h1 className="text-3xl font-semibold text-foreground">{examTitle}</h1>
            <p className="text-sm text-muted-foreground">{moduleLabel} module</p>
          </div>

          <ol className="grid gap-4 rounded-ds-xl border border-border/60 bg-card/60 p-4 text-sm text-muted-foreground sm:grid-cols-3">
            {['Enter PIN', 'Pick theme', 'Workspace'].map((label, idx) => (
              <li
                key={label}
                className={cn(
                  'flex flex-col items-center rounded-ds-lg border border-transparent px-3 py-2 text-center transition-colors',
                  stepIndex === idx && 'border-primary/40 bg-primary/5 text-primary',
                  stepIndex > idx && 'text-foreground'
                )}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step {idx + 1}</span>
                <span className="text-sm font-medium">{label}</span>
              </li>
            ))}
          </ol>

          {step === 'pin' && (
            <Card className="mx-auto w-full max-w-2xl bg-card/80 p-6 shadow-lg">
              <form className="space-y-4" onSubmit={handlePinSubmit}>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Enter your mock exam PIN</h2>
                  <p className="text-sm text-muted-foreground">
                    PINs are shared via official GramorX communications. Access is logged and expires after the scheduled slot.
                  </p>
                </div>
                <Input
                  label="PIN"
                  placeholder="Enter 6-digit PIN"
                  value={pin}
                  onChange={(event) => setPin(event.target.value.trim())}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={64}
                  required
                  error={pinError ?? undefined}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <p>Need help? Contact the invigilator or support@gramorx.com.</p>
                  <p>Session links expire after use.</p>
                </div>
                <Button type="submit" className="w-full" loading={pinBusy} loadingText="Verifying PIN…">
                  Unlock mock workspace
                </Button>
              </form>
            </Card>
          )}

          {step === 'theme' && (
            <Card className="space-y-5 border-primary/10 bg-card/90 p-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Choose a workspace theme</h2>
                <p className="text-sm text-muted-foreground">
                  Themes affect the chrome around the mock workspace. You can change it later during the exam from settings.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {THEME_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setTheme(option.key)}
                    className={cn(
                      'rounded-ds-xl border px-4 py-4 text-left transition-all',
                      option.previewClass,
                      theme === option.key && 'ring-2 ring-primary'
                    )}
                  >
                    <p className="text-base font-semibold">{option.name}</p>
                    <p className="text-sm text-muted-foreground/90">{option.description}</p>
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  PIN verified for session {session?.sessionId ? session.sessionId.slice(0, 8) : '—'}. Pick a theme to continue.
                </p>
                <Button type="button" disabled={!resolvedTheme} onClick={handleContinueToExam}>
                  Continue to exam workspace
                </Button>
              </div>
            </Card>
          )}

          {step === 'exam' && (
            <div className="space-y-6">
              <Card className="border-primary/20 bg-card/90 p-6">
                <header className="flex flex-col gap-4 border-b border-border/60 pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">GRAMORX MOCK</p>
                    <h2 className="text-2xl font-semibold text-foreground">{examTitle}</h2>
                    <p className="text-sm text-muted-foreground">{moduleLabel} • Session {session?.sessionId?.slice(0, 8)}</p>
                  </div>
                  <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center">
                    <div className="flex flex-col items-start">
                      <span className="text-[11px] font-semibold uppercase tracking-wide">Timer</span>
                      <span className="font-mono text-lg text-foreground">00:00</span>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[11px] font-semibold uppercase tracking-wide">Theme</span>
                      <Badge tone="neutral" size="sm">{resolvedTheme?.name ?? 'Classic Light'}</Badge>
                    </div>
                    {showExitButton && (
                      <Button variant="outline" onClick={handleExit} className="whitespace-nowrap">
                        Exit mock
                      </Button>
                    )}
                  </div>
                </header>

                <div className="pt-6">{children}</div>

                <footer className="mt-6 border-t border-border/60 pt-4 text-sm text-muted-foreground">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Connection secure
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Anti-cheat: camera, screen, and network events are logged for security.
                    </div>
                  </div>
                </footer>
              </Card>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
