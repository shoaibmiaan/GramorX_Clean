import * as React from 'react';
import Link from 'next/link';

import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';

export type IconName = React.ComponentProps<typeof Icon>['name'];

export type ModuleHeroAction = {
  label: string;
  href: string;
  variant?: React.ComponentProps<typeof Button>['variant'];
  icon?: IconName;
};

export type ModuleHeroStat = {
  label: string;
  value: React.ReactNode;
  helper?: string;
};

export type ModuleHeroProps = {
  title: string;
  subtitle: string;
  icon: IconName;
  eyebrow?: string;
  helperText?: string;
  actions?: ModuleHeroAction[];
  stats?: ModuleHeroStat[];
  statsTitle?: string;
  rightSlot?: React.ReactNode;
  className?: string;
};

export const ModuleHero: React.FC<ModuleHeroProps> = ({
  title,
  subtitle,
  icon,
  eyebrow,
  helperText,
  actions = [],
  stats,
  statsTitle = 'Quick stats',
  rightSlot,
  className = '',
}) => {
  const aside =
    stats && stats.length > 0 ? (
      <Card className="p-5 rounded-ds-2xl border border-border/60 bg-card/80 shadow-sm w-full max-w-xs">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-3">
          {statsTitle}
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-semibold">{stat.value}</p>
              {stat.helper && (
                <p className="text-[11px] text-muted-foreground mt-1 leading-tight">
                  {stat.helper}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>
    ) : (
      rightSlot || null
    );

  return (
    <section className={`border-b border-border/50 bg-card/70 backdrop-blur py-8 ${className}`}>
      <Container>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-ds-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Icon name={icon} size={14} />
              <span>{eyebrow ?? `${title} suite`}</span>
            </div>

            <h1 className="font-slab text-h2 leading-tight">{title}</h1>

            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">{subtitle}</p>

            {helperText && (
              <div className="text-xs text-muted-foreground">{helperText}</div>
            )}

            {actions.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2">
                {actions.map((action) => (
                  <Button
                    key={action.href}
                    asChild
                    size="md"
                    variant={action.variant ?? 'primary'}
                    className="rounded-ds-xl"
                  >
                    <Link href={action.href}>
                      <span className="inline-flex items-center gap-2">
                        {action.icon && <Icon name={action.icon} className="h-4 w-4" />}
                        <span>{action.label}</span>
                      </span>
                    </Link>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {aside}
        </div>
      </Container>
    </section>
  );
};
