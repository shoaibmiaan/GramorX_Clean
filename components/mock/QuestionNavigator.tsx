import * as React from 'react';

import { Button } from '@/components/design-system/Button';

export type QuestionNavigatorItem = {
  id: string;
  label: string;
  section?: string;
};

export type QuestionNavigatorProps = {
  items: QuestionNavigatorItem[];
  answered: Record<string, boolean>;
  activeId?: string | null;
  onSelect?: (id: string) => void;
};

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({ items, answered, activeId, onSelect }) => {
  const grouped = React.useMemo(() => {
    return items.reduce<Record<string, QuestionNavigatorItem[]>>((acc, item) => {
      const key = item.section ?? 'Questions';
      acc[key] = acc[key] ?? [];
      acc[key]!.push(item);
      return acc;
    }, {});
  }, [items]);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([section, sectionItems]) => (
        <div key={section} className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{section}</p>
          <div className="flex flex-wrap gap-2">
            {sectionItems.map((item) => {
              const isActive = activeId === item.id;
              const isAnswered = answered[item.id];
              return (
                <Button
                  key={item.id}
                  size="sm"
                  variant={isActive ? 'primary' : isAnswered ? 'secondary' : 'ghost'}
                  className="h-8 w-10 rounded-full text-xs"
                  onClick={() => onSelect?.(item.id)}
                >
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuestionNavigator;
