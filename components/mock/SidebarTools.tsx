import * as React from 'react';
import Link from 'next/link';

import { Card } from '@/components/design-system/Card';
import { Icon } from '@/components/design-system/Icon';

export type SidebarTool = {
  label: string;
  href: string;
  icon: React.ComponentProps<typeof Icon>['name'];
};

export const SidebarTools: React.FC<{
  title?: string;
  tools: SidebarTool[];
}> = ({ title = 'Power Tools', tools }) => (
  <Card className="p-4 rounded-ds-2xl bg-card/80 border border-border/60 shadow-sm text-xs space-y-3">
    <p className="text-[11px] uppercase font-semibold tracking-wide text-muted-foreground">
      {title}
    </p>

    {tools.map((tool) => (
      <Link
        key={tool.href}
        href={tool.href}
        className="flex justify-between items-center px-3 py-2 rounded-md border hover:bg-muted/70 transition-colors"
      >
        <span>{tool.label}</span>
        <Icon name={tool.icon} className="h-4 w-4" />
      </Link>
    ))}
  </Card>
);
