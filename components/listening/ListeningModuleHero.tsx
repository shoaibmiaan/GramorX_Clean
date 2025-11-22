// components/listening/ListeningModuleHero.tsx
import * as React from 'react';
import Icon from '@/components/design-system/Icon';

type Props = {
  title: string;
  subtitle?: string;
  chipLabel?: string;
  chipIcon?: string;
  metaLabel?: string;
  metaDescription?: string;
};

const ListeningModuleHero: React.FC<Props> = ({
  title,
  subtitle,
  chipLabel,
  chipIcon = 'Headphones',
  metaLabel,
  metaDescription,
}) => {
  return (
    <section className="mb-6 space-y-3">
      {chipLabel && (
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Icon name={chipIcon} size={14} />
          <span>{chipLabel}</span>
        </div>
      )}

      <h1 className="text-2xl font-semibold text-foreground sm:text-3xl tracking-tight">
        {title}
      </h1>

      {subtitle && (
        <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
          {subtitle}
        </p>
      )}

      {metaLabel && metaDescription && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground sm:text-sm">
          <Icon name="Info" size={14} className="text-primary mt-0.5" />
          <p>
            <span className="font-medium text-foreground">{metaLabel}: </span>
            {metaDescription}
          </p>
        </div>
      )}
    </section>
  );
};

export default ListeningModuleHero;
