// components/listening/EmptyState.tsx
import * as React from 'react';
import Link from 'next/link';

import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';

type Props = {
  title: string;
  description: string;
  iconName?: string;
  actionLabel?: string;
  actionHref?: string;
  onActionClick?: () => void;
};

const ListeningEmptyState: React.FC<Props> = ({
  title,
  description,
  iconName = 'Headphones',
  actionLabel,
  actionHref,
  onActionClick,
}) => {
  const hasAction = Boolean(actionLabel && (actionHref || onActionClick));

  const content = (
    <Card className="border-dashed border-border bg-card/60 p-6 text-center">
      <div className="mb-3 flex justify-center">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Icon name={iconName} size={16} className="text-muted-foreground" />
        </div>
      </div>

      <h3 className="text-sm font-semibold text-foreground sm:text-base">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{description}</p>

      {hasAction && (
        <div className="mt-4 flex justify-center">
          <Button
            size="sm"
            type="button"
            onClick={onActionClick}
            asChild={Boolean(actionHref && !onActionClick)}
          >
            {actionHref && !onActionClick ? (
              <Link href={actionHref}>
                <Icon name="ArrowRight" size={14} />
                <span>{actionLabel}</span>
              </Link>
            ) : (
              <>
                <Icon name="ArrowRight" size={14} />
                <span>{actionLabel}</span>
              </>
            )}
          </Button>
        </div>
      )}
    </Card>
  );

  return content;
};

export default ListeningEmptyState;
