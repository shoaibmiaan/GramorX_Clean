// components/listening/ListeningHero.tsx
import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';

export function ListeningHero() {
  return (
    <div className="flex flex-col gap-4">
      <Badge tone="info" size="sm">
        IELTS • Listening
      </Badge>
      <h1 className="text-h2 font-semibold md:text-h1">
        Listening Tips &amp; Resources
      </h1>
      <p className="max-w-2xl opacity-80">
        Level-based strategies, practice drills, and AI tools to master IELTS
        Listening — Academic &amp; General. Start where you are, and level up
        fast.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Link href="/tools/listening/dictation" className="inline-flex">
          <Button tone="primary">Try AI Dictation</Button>
        </Link>
        <Link href="/mock/listening" className="inline-flex">
          <Button tone="neutral" variant="secondary">
            Begin a Mock
          </Button>
        </Link>
      </div>
    </div>
  );
}
