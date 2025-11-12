'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { Container } from '@/components/design-system/Container';
import { NavLink } from '@/components/design-system/NavLink';
import { NotificationBell } from '@/components/design-system/NotificationBell';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { StreakChip } from '@/components/user/StreakChip';
import { IconOnlyThemeToggle } from './IconOnlyThemeToggle';
import { navigationSchema } from '@/config/navigation';
import { filterNavItems, filterNavSections } from '@/lib/navigation/utils';
import type { SubscriptionTier } from '@/lib/navigation/types';
import { Icon } from '@/components/design-system/Icon';
import type { ModuleLink } from './constants';
import { MODULE_LINKS } from './constants';

const toneClassMap: Record<NonNullable<ModuleLink['tone']>, string> = {
  // DS-only tokens; no raw color scales or opacity hacks
  blue:   'bg-muted text-primary ring-1 ring-border group-hover:bg-primary group-hover:text-primary-foreground',
  purple: 'bg-muted text-primary ring-1 ring-border group-hover:bg-primary group-hover:text-primary-foreground',
  orange: 'bg-muted text-accent-warm ring-1 ring-border group-hover:bg-accent-warm group-hover:text-accent-warm-foreground',
  green:  'bg-muted text-success ring-1 ring-border group-hover:bg-success group-hover:text-success-foreground',
};

const getToneClass = (tone?: ModuleLink['tone']) =>
  tone ? toneClassMap[tone] : 'bg-muted text-primary ring-1 ring-border group-hover:bg-primary group-hover:text-primary-foreground';

interface UserInfo {
  id: string | null;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

type MobileNavProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'role'> & {
  user: UserInfo;
  role: string | null;
  ready: boolean;
  streak: number;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  mobileModulesOpen: boolean;
  setMobileModulesOpen: (open: boolean) => void;
  signOut: () => Promise<void>;
  showAdmin?: boolean;
  hasPremiumAccess?: boolean;
  premiumRooms?: string[];
  onClearPremiumAccess?: () => void;
  subscriptionTier: SubscriptionTier;
};

export function MobileNav({
  user,
  role,
  ready,
  streak,
  mobileOpen,
  setMobileOpen,
  mobileModulesOpen,
  setMobileModulesOpen,
  signOut,
  showAdmin = true,
  hasPremiumAccess = false,
  premiumRooms = [],
  onClearPremiumAccess,
  subscriptionTier,
  className,
  ...rest
}: MobileNavProps) {
  const pathname = usePathname();
  const [mobileAiToolsOpen, setMobileAiToolsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('');

  const canSeePartners = role === 'partner' || role === 'admin';
  const canSeeAdmin = role === 'admin' && showAdmin;
  const isTeacher = role === 'teacher';

  const closeMenu = React.useCallback(() => {
    setMobileOpen(false);
    setMobileModulesOpen(false);
    setMobileAiToolsOpen(false);
    setActiveSection('');
  }, [setMobileOpen, setMobileModulesOpen]);

  const navigationCtx = useMemo(
    () => ({ isAuthenticated: Boolean(user?.id), tier: subscriptionTier }),
    [user?.id, subscriptionTier]
  );

  const mainNavItems = useMemo(() => {
    if (isTeacher) return [];
    return filterNavItems(navigationSchema.header.main, navigationCtx);
  }, [navigationCtx, isTeacher]);

  const practiceNavItem = useMemo(
    () => mainNavItems.find((item) => item.id === 'practice'),
    [mainNavItems]
  );

  const mainNavWithoutPractice = useMemo(
    () => mainNavItems.filter((item) => item.id !== 'practice'),
    [mainNavItems]
  );

  const aiToolItems = useMemo(() => {
    if (isTeacher) return [];
    return filterNavItems(navigationSchema.header.aiTools, navigationCtx);
  }, [navigationCtx, isTeacher]);

  const profileMenu = useMemo(() => {
    if (isTeacher) return [{ id: 'account', label: 'Profile', href: '/account' }];
    return filterNavItems(navigationSchema.header.profile, navigationCtx);
  }, [isTeacher, navigationCtx]);

  const sidebarSections = useMemo(
    () => filterNavSections(navigationSchema.sidebar, navigationCtx),
    [navigationCtx]
  );

  const headerCtaConfig = navigationSchema.header.cta ?? {};
  const headerCta = user?.id ? headerCtaConfig.authed : headerCtaConfig.guest;
  const headerOptional = navigationSchema.header.optional ?? {};

  useEffect(() => {
    if (!mobileOpen) {
      setMobileModulesOpen(false);
      setMobileAiToolsOpen(false);
      setActiveSection('');
    }
  }, [mobileOpen, setMobileAiToolsOpen, setMobileModulesOpen]);

  // Auto-close on route change
  useEffect(() => {
    if (mobileOpen) closeMenu();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Body scroll-lock while panel is open (non-destructive)
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearchQuery('');
    closeMenu();
  };

  const handleClearPremium = () => {
    onClearPremiumAccess?.();
    closeMenu();
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? '' : section);
    if (section === 'practice') {
      setMobileModulesOpen(activeSection !== 'practice');
      setMobileAiToolsOpen(false);
    } else if (section === 'ai-tools') {
      setMobileAiToolsOpen(activeSection !== 'ai-tools');
      setMobileModulesOpen(false);
    }
  };

  // Overlay — DS tokens only (no raw color or opacity suffixes)
  const overlay = mobileOpen ? (
    <div
      className="fixed inset-0 z-40 md:hidden bg-background opacity-70 backdrop-blur-sm transition-opacity"
      onClick={closeMenu}
      aria-hidden="true"
    />
  ) : null;

  const panel = mobileOpen ? (
    <div
      className={[
        'fixed inset-y-0 left-0 z-50 md:hidden w-4/5 max-w-sm',
        'bg-background border-r border-border shadow-lg',
        'transition-transform duration-300 ease-out',
        className || '',
      ].join(' ')}
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
      {...rest}
    >
      <Container className="flex h-full flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <StreakChip value={streak} href="/profile/streak" />
            {hasPremiumAccess && (
              <Badge variant="accent" size="sm" className="font-semibold">
                <Icon name="Crown" size={12} className="mr-1" />
                Premium
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {headerOptional.notifications && <NotificationBell />}
            {headerOptional.themeToggle && <IconOnlyThemeToggle />}
            <button
              onClick={closeMenu}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Close menu"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Search */}
          <div className="p-4 border-b border-border">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Icon
                  name="Search"
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <input
                  type="text"
                  placeholder="Search vocabulary, tips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                />
              </div>
            </form>
          </div>

          {/* CTA Button */}
          {headerCta && (
            <div className="p-4 border-b border-border">
              <Button asChild fullWidth size="lg" variant="primary" className="rounded-xl font-semibold">
                <Link href={headerCta.href} onClick={closeMenu}>
                  {headerCta.label}
                </Link>
              </Button>
            </div>
          )}

          {/* Premium Access */}
          {hasPremiumAccess && (
            <div className="p-4 border-b border-border bg-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon name="Crown" size={18} className="text-foreground" />
                  <span className="font-semibold text-sm">Premium Access</span>
                </div>
                <Badge variant="success" size="sm">Active</Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {premiumRooms.length} room{premiumRooms.length !== 1 ? 's' : ''} available
              </p>
              {onClearPremiumAccess && (
                <button
                  onClick={handleClearPremium}
                  className="w-full text-xs text-destructive font-medium text-center py-2 border-t border-border hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Clear All Access
                </button>
              )}
            </div>
          )}

          <nav className="p-4">
            {/* Quick Actions */}
            {user?.id && (
              <div className="grid grid-cols-2 gap-2 mb-6">
                <Button asChild variant="outline" size="sm" className="h-12 flex flex-col gap-1 rounded-xl hover:bg-muted">
                  <Link href="/practice" onClick={closeMenu}>
                    <Icon name="Play" size={16} />
                    <span className="text-xs">Practice</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-12 flex flex-col gap-1 rounded-xl hover:bg-muted">
                  <Link href="/progress" onClick={closeMenu}>
                    <Icon name="TrendingUp" size={16} />
                    <span className="text-xs">Progress</span>
                  </Link>
                </Button>
              </div>
            )}

            <ul className="space-y-1">
              {/* Dashboard/Teacher */}
              {user?.id && (
                <li>
                  <NavLink
                    href={isTeacher ? '/teacher' : '/dashboard'}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted transition-colors"
                    onClick={closeMenu}
                  >
                    <Icon name={isTeacher ? 'Users' : 'LayoutDashboard'} size={18} />
                    <span className="font-medium">{isTeacher ? 'Teacher' : 'Dashboard'}</span>
                  </NavLink>
                </li>
              )}

              {/* Premium Room */}
              {hasPremiumAccess && (
                <li>
                  <NavLink
                    href="/premium-room"
                    className="flex items-center gap-3 rounded-xl px-3 py-3 bg-muted border border-border hover:bg-background transition-colors"
                    onClick={closeMenu}
                  >
                    <Icon name="Crown" size={18} />
                    <span className="font-medium">Premium Room</span>
                  </NavLink>
                </li>
              )}

              {/* Practice Modules */}
              {practiceNavItem && !isTeacher && (
                <li>
                  <button
                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    onClick={() => toggleSection('practice')}
                    aria-expanded={activeSection === 'practice'}
                  >
                    <div className="flex items-center gap-3">
                      <Icon name="Grid3X3" size={18} />
                      <span className="font-medium">{practiceNavItem.label}</span>
                    </div>
                    <Icon
                      name={activeSection === 'practice' ? 'ChevronUp' : 'ChevronDown'}
                      size={16}
                      className="text-muted-foreground"
                    />
                  </button>

                  {activeSection === 'practice' && (
                    <div className="mt-2 space-y-2 rounded-xl border border-border bg-muted p-3">
                      <ul className="space-y-2">
                        {MODULE_LINKS.map(({ href, label, desc, Icon: RoomIcon, tone }) => (
                          <li key={href}>
                            <Link
                              href={href}
                              onClick={closeMenu}
                              className="group flex items-start gap-3 rounded-lg border border-border bg-background p-3 transition-all hover:border-border hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${getToneClass(tone)}`}>
                                {RoomIcon ? <RoomIcon className="h-5 w-5" /> : null}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block font-medium text-sm">{label}</span>
                                {desc && (
                                  <span className="text-xs text-muted-foreground mt-0.5 block">
                                    {desc}
                                  </span>
                                )}
                              </span>
                              <Icon name="ArrowRight" size={14} className="text-muted-foreground" />
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              )}

              {/* Main Navigation */}
              {!isTeacher &&
                mainNavWithoutPractice.map((item) => (
                  <li key={item.id}>
                    <NavLink
                      href={item.href}
                      className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted transition-colors"
                      onClick={closeMenu}
                    >
                      <span className="font-medium">{item.label}</span>
                    </NavLink>
                  </li>
                ))}

              {/* AI Tools */}
              {!isTeacher && aiToolItems.length > 0 && (
                <li>
                  <button
                    className="flex w-full items-center justify-between rounded-xl px-3 py-3 hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    onClick={() => toggleSection('ai-tools')}
                    aria-expanded={activeSection === 'ai-tools'}
                  >
                    <div className="flex items-center gap-3">
                      <Icon name="Bot" size={18} />
                      <span className="font-medium">AI &amp; Tools</span>
                    </div>
                    <Icon
                      name={activeSection === 'ai-tools' ? 'ChevronUp' : 'ChevronDown'}
                      size={16}
                      className="text-muted-foreground"
                    />
                  </button>

                  {activeSection === 'ai-tools' && (
                    <ul className="mt-2 ml-4 space-y-1 border-l border-border pl-3">
                      {aiToolItems.map((item) => (
                        <li key={item.id}>
                          <NavLink
                            href={item.href}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors text-sm"
                            onClick={closeMenu}
                          >
                            <span>{item.label}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )}

              {/* Partners & Admin */}
              {canSeePartners && (
                <li>
                  <NavLink
                    href="/partners"
                    className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted transition-colors"
                    onClick={closeMenu}
                  >
                    <Icon name="Handshake" size={18} />
                    <span className="font-medium">Partners</span>
                  </NavLink>
                </li>
              )}
              {canSeeAdmin && (
                <li>
                  <NavLink
                    href="/admin/partners"
                    className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-muted transition-colors"
                    onClick={closeMenu}
                  >
                    <Icon name="Settings" size={18} />
                    <span className="font-medium">Admin</span>
                  </NavLink>
                </li>
              )}
            </ul>

            {/* Sidebar Sections */}
            <div className="mt-8 space-y-6">
              {sidebarSections.map((section) => (
                <div key={section.id}>
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
                    {section.icon && <Icon name={section.icon} className="h-3.5 w-3.5" />}
                    <span>{section.label}</span>
                  </div>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <NavLink
                          href={item.href}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted transition-colors text-sm"
                          onClick={closeMenu}
                        >
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Account Section */}
            {profileMenu.length > 0 && user?.id && (
              <div className="mt-8 pt-6 border-t border-border">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
                  <Icon name="User" className="h-3.5 w-3.5" />
                  <span>Account</span>
                </div>
                <ul className="space-y-1">
                  {profileMenu.map((item) => (
                    <li key={item.id}>
                      <NavLink
                        href={item.href}
                        className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted transition-colors text-sm"
                        onClick={closeMenu}
                      >
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  ))}
                  <li>
                    <button
                      onClick={() => {
                        closeMenu();
                        void signOut();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <Icon name="LogOut" size={16} />
                      <span>Sign out</span>
                    </button>
                  </li>
                </ul>
              </div>
            )}

            {/* Auth Section */}
            {!user?.id && ready && (
              <div className="mt-8 space-y-3">
                <Button asChild fullWidth variant="primary" className="rounded-xl font-semibold py-3.5">
                  <Link href="/login" onClick={closeMenu}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild fullWidth variant="outline" className="rounded-xl font-semibold py-3.5">
                  <Link href="/signup" onClick={closeMenu}>
                    Create account
                  </Link>
                </Button>
              </div>
            )}

            {!ready && (
              <div className="mt-6 space-y-2">
                <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
                <div className="h-12 w-full animate-pulse rounded-xl bg-muted" />
              </div>
            )}
          </nav>
        </div>
      </Container>
    </div>
  ) : null;

  return (
    <>
      <div className="flex items-center gap-2 md:hidden">
        {headerOptional.notifications && <NotificationBell />}
        {headerOptional.themeToggle && <IconOnlyThemeToggle />}
        <button
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {mobileOpen ? <Icon name="X" size={20} /> : <Icon name="Menu" size={20} />}
        </button>
      </div>

      {typeof document !== 'undefined' ? createPortal(<>{overlay}{panel}</>, document.body) : null}
    </>
  );
}

MobileNav.displayName = 'MobileNav';

// keep the named export AND add default:
export default MobileNav;
