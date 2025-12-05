import React from 'react';

import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Container } from '@/components/design-system/Container';
import { Icon } from '@/components/design-system/Icon';

export type ModuleHeroAction = {
  label: string;
  href: string;
  variant?: React.ComponentProps<typeof Button>['variant'];
  tone?: React.ComponentProps<typeof Button>['tone'];
};

export type ModuleHeroStat = {
  label: string;
  value: string;
  helper?: string;
};

export type ModuleHeroHighlight = {
  icon?: React.ComponentProps<typeof Icon>['name'];
  title: string;
  body: string;
};

export type ModuleHomeHeroProps = {
  eyebrow?: string;
  badgeVariant?: React.ComponentProps<typeof Badge>['variant'];
  title: string;
  description: string;
  primaryAction: ModuleHeroAction;
  secondaryAction?: ModuleHeroAction;
  stats?: ModuleHeroStat[];
  highlights?: ModuleHeroHighlight[];
};

export function ModuleHomeHero({
  eyebrow,
  badgeVariant = 'info',
  title,
  description,
  primaryAction,
  secondaryAction,
  stats = [],
  highlights = [],
}: ModuleHomeHeroProps) {
  return (
    <section className="pb-10 pt-12">
      <Container>
        <div className="overflow-hidden rounded-ds-3xl border border-border bg-gradient-to-br from-lightBg to-white shadow-lg dark:from-dark dark:via-dark/80 dark:to-darker">
          <div className="grid gap-10 p-8 md:p-10 lg:grid-cols-[1.25fr,0.9fr]">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                {eyebrow && (
                  <Badge variant={badgeVariant} className="w-fit">
                    {eyebrow}
                  </Badge>
                )}
                <h1 className="font-slab text-display leading-tight text-foreground">{title}</h1>
                <p className="max-w-2xl text-large text-muted-foreground">{description}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  href={primaryAction.href}
                  variant={primaryAction.variant ?? 'primary'}
                  tone={primaryAction.tone}
                  size="lg"
                  className="rounded-ds-xl"
                >
                  {primaryAction.label}
                </Button>
                {secondaryAction && (
                  <Button
                    href={secondaryAction.href}
                    variant={secondaryAction.variant ?? 'ghost'}
                    tone={secondaryAction.tone}
                    size="lg"
                    className="rounded-ds-xl"
                  >
                    {secondaryAction.label}
                  </Button>
                )}
              </div>

              {highlights.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {highlights.map((item) => (
                    <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/60 p-4">
                      {item.icon && (
                        <span className="mt-1 text-primary">
                          <Icon name={item.icon} size={18} />
                        </span>
                      )}
                      <div>
                        <p className="text-body font-semibold text-foreground">{item.title}</p>
                        <p className="text-small text-muted-foreground">{item.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {stats.length > 0 && (
              <div className="grid content-start gap-4 rounded-ds-2xl border border-border/70 bg-white/60 p-6 shadow-sm backdrop-blur-lg dark:bg-card/80">
                <h2 className="text-h4 font-semibold text-foreground">Module snapshot</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {stats.map((stat) => (
                    <div key={`${stat.label}-${stat.value}`} className="rounded-xl border border-border/60 bg-card/60 p-4">
                      <p className="text-caption uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                      <p className="text-h3 font-semibold text-foreground">{stat.value}</p>
                      {stat.helper && <p className="text-small text-muted-foreground">{stat.helper}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

export function ModuleHomeCTA({
  title,
  description,
  primaryAction,
  secondaryAction,
}: Pick<ModuleHomeHeroProps, 'title' | 'description' | 'primaryAction' | 'secondaryAction'>) {
  return (
    <div className="flex flex-col gap-4 rounded-ds-2xl border border-border bg-card/80 p-6 text-center shadow-sm">
      <h3 className="text-h3 text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button
          href={primaryAction.href}
          variant={primaryAction.variant ?? 'primary'}
          tone={primaryAction.tone}
          className="rounded-ds-xl"
        >
          {primaryAction.label}
        </Button>
        {secondaryAction && (
          <Button
            href={secondaryAction.href}
            variant={secondaryAction.variant ?? 'ghost'}
            tone={secondaryAction.tone}
            className="rounded-ds-xl"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
