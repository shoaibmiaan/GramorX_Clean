'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Container } from '@/components/design-system/Container';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import { Icon } from '@/components/design-system/Icon';
import { Alert } from '@/components/design-system/Alert';
import DesktopNav from '@/components/navigation/DesktopNav';
import MobileNav from '@/components/navigation/MobileNav';
import { useHeaderState } from '@/components/hooks/useHeaderState';
import { useUserContext } from '@/context/UserContext';
import { PremiumRoomManager } from '@/premium-ui/access/roomUtils';
import { cn } from '@/lib/utils';

const ANNOUNCEMENT_KEY = 'gramorx:announcement-dismissed';

export const Header: React.FC<{ streak?: number }> = ({ streak }) => {
  const [openDesktopModules, setOpenDesktopModules] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileModulesOpen, setMobileModulesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [announcementVisible, setAnnouncementVisible] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { user, role, loading } = useUserContext();
  const { streak: streakState, ready, signOut, subscriptionTier } = useHeaderState(streak);

  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [premiumRooms, setPremiumRooms] = useState<string[]>([]);

  const headerRef = useRef<HTMLElement>(null);
  const modulesRef = useRef<HTMLLIElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Scroll handler
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Premium access
  useEffect(() => {
    const checkAccess = () => {
      const list = PremiumRoomManager.getAccessList();
      setHasPremiumAccess(list.length > 0);
      setPremiumRooms(list.map((r) => r.roomName));
    };
    checkAccess();
    const onStorage = (e: StorageEvent) => e.key === 'premiumRooms' && checkAccess();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Announcement visibility
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(ANNOUNCEMENT_KEY) === '1') setAnnouncementVisible(false);
  }, []);

  // Outside click + keyboard shortcuts
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (modulesRef.current && !modulesRef.current.contains(t)) setOpenDesktopModules(false);
      if (showSearch && !searchInputRef.current?.contains(t)) setShowSearch(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDesktopModules(false);
        setMobileOpen(false);
        setMobileModulesOpen(false);
        setShowSearch(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [showSearch]);

  // Disable scroll on mobile nav
  useEffect(() => {
    const lock = (e: TouchEvent) => e.preventDefault();
    if (mobileOpen) {
      document.documentElement.style.overflow = 'hidden';
      document.addEventListener('touchmove', lock, { passive: false });
    } else {
      document.documentElement.style.overflow = '';
      document.removeEventListener('touchmove', lock);
    }
    return () => {
      document.documentElement.style.overflow = '';
      document.removeEventListener('touchmove', lock);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (showSearch) setTimeout(() => searchInputRef.current?.focus(), 100);
  }, [showSearch]);

  const dismissAnnouncement = () => {
    setAnnouncementVisible(false);
    window.localStorage.setItem(ANNOUNCEMENT_KEY, '1');
  };

  const clearPremium = () => {
    PremiumRoomManager.clearAllAccess();
    setHasPremiumAccess(false);
    setPremiumRooms([]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // search handler
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const solidHeader = scrolled || openDesktopModules || mobileOpen;

  if (loading && !user)
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border bg-surface/90 backdrop-blur-lg">
        <Container>
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-pulse rounded-xl bg-border" />
              <div className="space-y-1">
                <div className="h-3 w-28 animate-pulse rounded bg-border" />
                <div className="h-2.5 w-20 animate-pulse rounded bg-border" />
              </div>
            </div>
            <div className="h-8 w-20 animate-pulse rounded-full bg-border" />
          </div>
        </Container>
      </header>
    );

  return (
    <>
      {/* Announcement */}
      {announcementVisible && (
        <Alert variant="gradient" className="from-electricBlue via-purpleVibe to-pink-500 text-white border-0">
          <Container>
            <div className="flex items-center justify-between py-2 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Icon name="Rocket" size={14} />
                <span>IELTS Mission Control — Private Beta Access</span>
                <Badge variant="secondary" className="bg-white/20 text-white border-0 text-[10px]">NEW</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button href="/waitlist" size="xs" variant="ghost" className="text-white hover:bg-white/10">
                  Get Early Access
                </Button>
                <button
                  onClick={dismissAnnouncement}
                  className="p-1 hover:bg-white/10 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Icon name="X" size={12} />
                </button>
              </div>
            </div>
          </Container>
        </Alert>
      )}

      {/* Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 z-[70] bg-surface/95 backdrop-blur-lg">
          <Container>
            <div className="flex items-center justify-between pt-4 pb-6">
              <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-auto">
                <div className="relative">
                  <Icon name="Search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search vocabulary, grammar, or mock tests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-base bg-transparent border-b border-border focus:border-electricBlue outline-none"
                  />
                </div>
              </form>
              <button
                onClick={() => setShowSearch(false)}
                className="ml-4 p-2 hover:bg-muted rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Icon name="X" size={18} />
              </button>
            </div>
          </Container>
        </div>
      )}

      {/* Main Header */}
      <header
        ref={headerRef}
        role="banner"
        className={cn(
          'sticky top-0 z-50 w-full border-b border-border/40 bg-surface/90 backdrop-blur-lg transition-all duration-300',
          solidHeader && 'shadow-md'
        )}
      >
        {/* Streak Progress — DS-compliant (no inline style) */}
        {user?.id && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-border">
            <progress
              value={Math.min(streakState ?? 0, 10)}
              max={10}
              aria-label="Daily streak progress"
              className="block h-1 w-full appearance-none
                         [&::-webkit-progress-bar]:bg-transparent
                         [&::-webkit-progress-value]:bg-primary
                         [&::-moz-progress-bar]:bg-primary"
            />
          </div>
        )}

        <Container>
          <div className="flex items-center justify-between py-2.5">
            {/* Logo */}
            <Link href={user?.id ? '/dashboard' : '/'} className="flex items-center gap-2 group hover:scale-[1.01] transition-all">
              <Image src="/brand/logo.png" alt="GramorX logo" width={36} height={36} className="rounded-xl" />
              <span className="font-slab text-lg font-bold bg-gradient-to-r from-electricBlue to-purpleVibe bg-clip-text text-transparent">
                GramorX
              </span>
              <Badge variant="outline" size="sm" className="text-electricBlue border-electricBlue/30">BETA</Badge>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setShowSearch(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/50 hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Icon name="Search" size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Search...</span>
                <kbd className="hidden lg:inline-block px-1 py-0.5 text-xs border border-border rounded bg-muted">⌘K</kbd>
              </button>

              {/* Auth Buttons */}
              {!user?.id && (
                <>
                  <Button href="/login" variant="ghost" size="sm" className="font-semibold">
                    Sign In
                  </Button>
                  <Button href="/waitlist" variant="primary" size="sm" leadingIcon={<Icon name="Sparkles" size={14} />}>
                    Join Waitlist
                  </Button>
                </>
              )}

              {/* Premium Button + Tooltip */}
              {user?.id && hasPremiumAccess && (
                <div className="relative group">
                  <Button asChild variant="accent" size="sm" className="font-semibold">
                    <Link href="/premium-room">
                      <Icon name="Crown" size={14} />
                      <span className="ml-1">Premium</span>
                      {/* Active indicator using DS tokens */}
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border border-background" />
                    </Link>
                  </Button>

                  {/* Tooltip */}
                  <div className="absolute top-full right-0 mt-2 w-64 p-4 bg-card border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Crown" size={14} />
                      <span className="font-semibold text-sm">Premium Access Active</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      You have access to {premiumRooms.length} premium room{premiumRooms.length !== 1 ? 's' : ''}
                    </p>
                    {premiumRooms.slice(0, 3).map((room, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                        <span className="truncate">{room}</span>
                      </div>
                    ))}
                    {premiumRooms.length > 3 && (
                      <div className="text-xs text-muted-foreground mt-1">+{premiumRooms.length - 3} more rooms</div>
                    )}
                    <button
                      onClick={clearPremium}
                      className="w-full text-sm text-destructive hover:bg-destructive/10 font-medium text-center py-2 border-t border-border/40 mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      Clear All Access
                    </button>
                  </div>
                </div>
              )}

              {/* Nav */}
              <DesktopNav
                user={user}
                role={role ?? 'guest'}
                ready={ready}
                streak={streakState}
                openModules={openDesktopModules}
                setOpenModules={setOpenDesktopModules}
                modulesRef={modulesRef}
                signOut={signOut}
                showAdmin={false}
                className="hidden lg:flex"
                hasPremiumAccess={hasPremiumAccess}
                premiumRooms={premiumRooms}
                onClearPremiumAccess={clearPremium}
                subscriptionTier={subscriptionTier}
              />

              <MobileNav
                user={user}
                role={role ?? 'guest'}
                ready={ready}
                streak={streakState}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
                mobileModulesOpen={mobileModulesOpen}
                setMobileModulesOpen={setMobileModulesOpen}
                signOut={signOut}
                showAdmin={false}
                className="lg:hidden"
                hasPremiumAccess={hasPremiumAccess}
                premiumRooms={premiumRooms}
                onClearPremiumAccess={clearPremium}
                subscriptionTier={subscriptionTier}
              />
            </div>
          </div>
        </Container>
      </header>
    </>
  );
};

export default Header;
