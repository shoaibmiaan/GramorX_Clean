// components/mock/MockPortalLayout.tsx
import React, { useState } from 'react';
import { useRouter } from 'next/router';

import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';
import { cn } from '@/lib/utils';

interface MockPortalLayoutProps {
  children: React.ReactNode;
}

/**
 * Global layout for ALL mock-portal pages:
 * - /mock
 * - /mock/**
 *
 * Removes marketing chrome, uses exam-room neutral UI,
 * and adds theme switching (solid / gradient / soft).
 */
const MockPortalLayout: React.FC<MockPortalLayoutProps> = ({ children }) => {
  const router = useRouter();
  const [bgVariant, setBgVariant] = useState<'gradient' | 'solid' | 'muted'>('gradient');

  // Background variants
  const bgClass = (() => {
    switch (bgVariant) {
      case 'solid':
        return 'bg-lightBg';
      case 'muted':
        return 'bg-muted/20';
      case 'gradient':
      default:
        return 'bg-gradient-to-b from-lightBg via-muted/40 to-lightBg';
    }
  })();

  const isRootMock = router.pathname === '/mock';

  return (
    <div
      className={cn(
        'min-h-screen w-full text-foreground',
        'overflow-x-hidden',
        bgClass
      )}
    >
      {/* Layout container restricting content so the left sidebar never overlaps */}
      <div className="relative mx-auto max-w-[1500px] px-3 sm:px-4 lg:px-6">
        {children}
      </div>

      {/* Background switcher */}
      <div className="fixed bottom-4 right-4 z-[80] max-w-xs">
        <Card className="flex items-center gap-3 rounded-ds-2xl border border-border/70 bg-card/95 px-3 py-2 shadow-xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon name="Palette" size={14} />
            </span>
            <div className="text-[11px] leading-tight">
              <p className="font-medium">
                {isRootMock ? 'Mock dashboard theme' : 'Mock room theme'}
              </p>
              <p className="text-muted-foreground">
                Change background instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemePill
              active={bgVariant === 'solid'}
              label="Solid"
              onClick={() => setBgVariant('solid')}
            />
            <ThemePill
              active={bgVariant === 'gradient'}
              label="Gradient"
              onClick={() => setBgVariant('gradient')}
            />
            <ThemePill
              active={bgVariant === 'muted'}
              label="Soft"
              onClick={() => setBgVariant('muted')}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

// Theme selector buttons
const ThemePill = ({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) => {
  return (
    <Button
      type="button"
      size="xs"
      variant={active ? 'accent' : 'ghost'}
      className={cn(
        'rounded-ds-full px-2 text-[11px] leading-none transition-colors',
        !active && 'text-muted-foreground hover:text-foreground'
      )}
      onClick={onClick}
    >
      {label}
    </Button>
  );
};

export default MockPortalLayout;
