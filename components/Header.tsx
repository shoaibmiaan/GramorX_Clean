'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Container } from '@/components/design-system/Container';
import { Badge } from '@/components/design-system/Badge';
import { Icon } from '@/components/design-system/Icon';
import DesktopNav from '@/components/navigation/DesktopNav';
import MobileNav from '@/components/navigation/MobileNav';
import { useHeaderState } from '@/components/hooks/useHeaderState';
import { useUserContext } from '@/context/UserContext';
import { PremiumRoomManager } from '@/premium-ui/access/roomUtils';
import { cn } from '@/lib/utils';

const Header: React.FC<{ streak?: number }> = ({ streak }) => {
  const [openDesktopModules, setOpenDesktopModules] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileModulesOpen, setMobileModulesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { user, role, loading } = useUserContext();
  const { streak: streakState, ready, signOut, subscriptionTier } = useHeaderState(streak);

  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [premiumRooms, setPremiumRooms] = useState<string[]>([]);

  const headerRef = useRef<HTMLElement>(null);
  const modulesRef = useRef<HTMLLIElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Scroll -> solid header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Premium access from local storage
  useEffect(() => {
    const sync = () => {
      const list = PremiumRoomManager.getAccessList();
      setHasPremiumAccess(list.length > 0);
      setPremiumRooms(list.map((r) => r.roomName));
    };
    sync();
    const onStorage = (e: StorageEvent) => e.key === 'premiumRooms' && sync();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Global ESC close + click-away for modules/search
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
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
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

  // Lock body scroll when mobile menu open
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

  const clearPremium = () => {
    PremiumRoomManager.clearAllAccess();
    setHasPremiumAccess(false);
    setPremiumRooms([]);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: hook up search
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const solidHeader = scrolled || openDesktopModules || mobileOpen;

  if (loading && !user) {
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
  }

  return (
    <>
      {/* Search Overlay */}
      {showSearch && (
        <div className="fixed inset-0 z-[70] bg-surface/95 backdrop-blur-lg">
          <Container>
            <div className="flex items-center justify-between pt-4 pb-6">
              <form onSubmit={handleSearch} className="mx-auto flex-1 max-w-2xl">
                <div className="relative">
                  <Icon
                    name="Search"
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search vocabulary, grammar, or mock tests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border-b border-border bg-transparent px-4 py-3 pl-10 text-base outline-none focus:border-electricBlue"
                  />
                </div>
              </form>
              <button
                onClick={() => setShowSearch(false)}
                className="ml-4 rounded-lg p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
        {/* Streak bar */}
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
            <Link
              href={user?.id ? '/dashboard' : '/'}
              className="group flex items-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Image src="/brand/logo.png" alt="GramorX logo" width={36} height={36} className="rounded-xl" />
              <span className="bg-gradient-to-r from-electricBlue to-purpleVibe bg-clip-text font-slab text-lg font-bold text-transparent">
                GramorX
              </span>
              <Badge variant="outline" size="sm" className="border-electricBlue/30 text-electricBlue">
                BETA
              </Badge>
            </Link>

            {/* Right cluster */}
            <div className="flex items-center gap-2">
              {/* Search trigger */}
              <button
                onClick={() => setShowSearch(true)}
                className="hidden items-center gap-2 rounded-full border border-border/50 px-3 py-1.5 hover:border-border/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background md:flex"
              >
                <Icon name="Search" size={14} className="text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Search...</span>
                <kbd className="hidden rounded border border-border bg-muted px-1 py-0.5 text-xs lg:inline-block">
                  ⌘K
                </kbd>
              </button>

              {/* Navs own *all* auth/UI controls */}
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
