// components/module/ModuleHero.tsx
import React from 'react';
import { Icon } from '@/components/design-system/Icon';
import { Button } from '@/components/design-system/Button';
import Link from 'next/link';

interface ModuleHeroProps {
  title: string;
  description: string;
  icon: string;
  testLink: string;
}

const ModuleHero: React.FC<ModuleHeroProps> = ({ title, description, icon, testLink }) => {
  return (
    <section className="pb-16 pt-16 md:pt-20">
      <div className="container">
        <div className="flex flex-col md:flex-row md:items-center gap-10">
          {/* Left side: Module Info */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-ds-full bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border/60">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon name={icon} size={14} />
              </span>
              <span>{title}</span>
            </div>
            <h1 className="font-slab text-display text-gradient-primary">{title}</h1>
            <p className="max-w-xl text-body text-grayish">{description}</p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Button asChild variant="primary" size="lg" className="rounded-ds-2xl px-6">
                <Link href={testLink}>Start Test</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModuleHero;