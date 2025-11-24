// components/listening/Mock/MockQuestionFlag.tsx
import * as React from 'react';
import Icon from '@/components/design-system/Icon';
import { Button } from '@/components/design-system/Button';

type Props = {
  flagged: boolean;
  onToggle: () => void;
};

const MockQuestionFlag: React.FC<Props> = ({ flagged, onToggle }) => {
  return (
    <Button
      type="button"
      variant={flagged ? 'outline' : 'ghost'}
      size="xs"
      onClick={onToggle}
      className="inline-flex items-center gap-1 text-[11px]"
    >
      <Icon
        name="Flag"
        size={12}
        className={flagged ? 'text-warning' : 'text-muted-foreground'}
      />
      <span>{flagged ? 'Unflag question' : 'Flag to review'}</span>
    </Button>
  );
};

export default MockQuestionFlag;
