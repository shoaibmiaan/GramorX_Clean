// components/listening/Game/GameRewardBadge.tsx
import * as React from 'react';

import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';
import type { ListeningGameBadge } from '@/lib/listening/game';

type Props = {
  badge: ListeningGameBadge;
};

const badgeMeta: Record<
  ListeningGameBadge,
  { label: string; icon: string; description: string }
> = {
  none: {
    label: 'No badge yet',
    icon: 'Circle',
    description: 'Finish more rounds to unlock badges.',
  },
  listener_rookie: {
    label: 'Listener Rookie',
    icon: 'Sparkles',
    description: 'You are warming up. Keep going.',
  },
  listener_grinder: {
    label: 'Listener Grinder',
    icon: 'Flame',
    description: 'You show up again and again. Respect.',
  },
  fast_ear: {
    label: 'Fast Ear',
    icon: 'Zap',
    description: 'You are quick and mostly right. Dangerous combo.',
  },
  ice_cold: {
    label: 'Ice Cold',
    icon: 'Snowflake',
    description: 'High accuracy under time pressure. Exam-ready behaviour.',
  },
  unstoppable: {
    label: 'Unstoppable',
    icon: 'Crown',
    description: 'Long streak, solid accuracy. Keep this energy for the real test.',
  },
};

const GameRewardBadge: React.FC<Props> = ({ badge }) => {
  const meta = badgeMeta[badge];

  return (
    <div className="flex items-center gap-3">
      <Badge
        variant={badge === 'none' ? 'neutral' : 'success'}
        className="flex items-center gap-1"
      >
        <Icon name={meta.icon} size={14} />
        <span>{meta.label}</span>
      </Badge>
      <p className="text-[11px] text-muted-foreground sm:text-xs">
        {meta.description}
      </p>
    </div>
  );
};

export default GameRewardBadge;
