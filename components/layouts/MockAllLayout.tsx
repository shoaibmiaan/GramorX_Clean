import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

import { Container } from '@/components/design-system/Container';
import { Icon } from '@/components/design-system/Icon';
import { UserMenu } from '@/components/design-system/UserMenu';
import { useUserContext } from '@/context/UserContext';
import { cn } from '@/lib/utils';

import { BackgroundPicker, type MockBgTheme } from '@/components/mock/BackgroundPicker';

const themeClassMap: Record<MockBgTheme, string> = {
  'clean-light':
    'bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900 [color-scheme:light]',
  'matte-dark':
    'bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.06),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(167,139,250,0.16),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(56,189,248,0.14),transparent_28%),#0b1221] text-slate-50 [color-scheme:dark]',
  'gradient-blue':
    'bg-gradient-to-br from-[#dce9ff] via-[#d6e0ff] to-[#d8eaff] text-slate-900 [color-scheme:light]',
  'gradient-purple':
    'bg-gradient-to-br from-[#1b1234] via-[#1b1f3b] to-[#0f172a] text-slate-50 [color-scheme:dark]',
  'mesh-pattern':
    'bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.12),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.12),transparent_25%)] bg-slate-50 text-slate-900 [color-scheme:light]',
  'cbe-grey':
    'bg-gradient-to-b from-slate-200 via-slate-300 to-slate-200 text-slate-900 [color-scheme:light]',
};

function useStoredMockTheme(defaultTheme: MockBgTheme = 'clean-light') {
  const [theme, setTheme] = React.useState<MockBgTheme>(defaultTheme);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('mock_bg_pref');
    if (stored && (Object.keys(themeClassMap) as MockBgTheme[]).includes(stored as MockBgTheme)) {
      setTheme(stored as MockBgTheme);
    }
  }, []);

  const setThemeAndStore = React.useCallback((next: MockBgTheme) => {
    setTheme(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('mock_bg_pref', next);
    }
  }, []);

  return [theme, setThemeAndStore] as const;
}

function buildBreadcrumbs(pathname: string) {
  const parts = pathname.split('/').filter(Boolean).slice(1); // drop leading 'mock'

  if (parts.length === 0) return ['Mock Home'];

  return ['Mock Home', ...parts.map((part) => part.replace(/[-_]/g, ' '))];
}

export type MockAllLayoutProps = {
  children: React.ReactNode;
};

export function MockAllLayout({ children }: MockAllLayoutProps) {
  const { user } = useUserContext();
  const router = useRouter();
  const [bgTheme, setBgTheme] = useStoredMockTheme('clean-light');
  const breadcrumbs = React.useMemo(() => buildBreadcrumbs(router.pathname || '/mock'), [router.pathname]);

  return (
    <div
      className={cn(
        'min-h-screen min-h-[100dvh] overflow-x-hidden transition-colors duration-300',
        themeClassMap[bgTheme]
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(255,255,255,0.24),transparent_26%),radial-gradient(circle_at_90%_10%,rgba(14,165,233,0.2),transparent_25%),radial-gradient(circle_at_80%_80%,rgba(129,140,248,0.18),transparent_24%)] opacity-50 mix-blend-screen" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-white/60 text-inherit backdrop-blur-md transition dark:border-white/10 dark:bg-slate-900/50">
        <Container className="flex flex-wrap items-center justify-between gap-3 py-3 md:py-4">
          <Link href="/mock" className="group flex items-center gap-2 text-sm font-semibold text-current">
            <Image
              src="/brand/logo.png"
              alt="GramorX"
              width={32}
              height={32}
              className="rounded-lg shadow-sm"
            />
            <span className="leading-tight">
              <span className="block">GramorX Mock</span>
              <span className="block text-[11px] font-normal text-current/70">IELTS practice hub</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-current/70 sm:flex">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb + index}>
                  {index > 0 && <Icon name="ChevronRight" size={14} />}
                  <span className={cn(index === breadcrumbs.length - 1 && 'font-semibold text-current')}>{crumb}</span>
                </React.Fragment>
              ))}
            </div>

            <UserMenu
              name={(user?.user_metadata as any)?.full_name ?? user?.email ?? undefined}
              email={user?.email ?? undefined}
              userId={user?.id ?? undefined}
              avatarUrl={(user?.user_metadata as any)?.avatar_url ?? null}
              role={(user as any)?.role ?? null}
            />
          </div>
        </Container>
      </header>

      <main className="relative flex min-h-[calc(100vh-48px)] flex-col px-4 pb-16 pt-6 md:px-8 md:pt-8">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6">
          <div className="rounded-3xl border border-white/40 bg-white/70 p-4 shadow-2xl shadow-black/5 backdrop-blur-xl transition dark:border-white/10 dark:bg-slate-900/70">
            {children}
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-white/40 px-4 pb-4 pt-2 text-center text-xs text-current/80 backdrop-blur-md transition dark:bg-slate-900/40 md:px-8">
        © GramorX — Mock Portal
      </footer>

      <BackgroundPicker value={bgTheme} onChange={setBgTheme} />
    </div>
  );
}

export default MockAllLayout;
