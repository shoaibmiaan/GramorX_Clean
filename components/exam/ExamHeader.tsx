// components/exam/ExamHeader.tsx
import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/design-system/Button";
import { Icon } from "@/components/design-system/Icon";
import { cn } from "@/lib/utils";

export type ExamHeaderProps = {
  examLabel?: string;
  title: string;
  subtitle?: string;
  metaLeft?: React.ReactNode;
  metaRight?: React.ReactNode;
  onExitHref?: string;
  onExitClick?: () => void;
  className?: string;
};

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  examLabel,
  title,
  subtitle,
  metaLeft,
  metaRight,
  onExitHref,
  onExitClick,
  className,
}) => {
  const exitButton = (
    <Button
      size="sm"
      variant="outline"
      className={cn(
        "h-[28px] px-2.5 text-[11px] font-semibold rounded-md",
        "border-destructive/40 text-destructive",
        "hover:bg-destructive/5 hover:text-destructive"
      )}
      onClick={onExitClick}
    >
      <Icon name="log-out" className="mr-1 h-3 w-3" />
      Exit
    </Button>
  );

  const exitWrapped = onExitHref ? (
    <Link href={onExitHref} onClick={onExitClick}>
      {exitButton}
    </Link>
  ) : (
    exitButton
  );

  return (
    <header
      className={cn(
        "w-full h-[58px] px-4 border-b border-white/10 bg-[#0B0F19]",
        "flex items-center justify-between",
        className
      )}
    >
      {/* LEFT BLOCK */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex flex-col leading-tight truncate">
          {examLabel && (
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {examLabel}
            </span>
          )}

          <span className="text-[15px] font-semibold text-foreground truncate">
            {title}
          </span>

          {subtitle && (
            <span className="text-[11px] text-muted-foreground truncate">
              {subtitle}
            </span>
          )}
        </div>

        {/* Meta Left (40Q · 3 passages · etc.) */}
        {metaLeft && (
          <div className="hidden sm:flex items-center text-[11px] text-muted-foreground">
            {metaLeft}
          </div>
        )}
      </div>

      {/* RIGHT BLOCK */}
      <div className="flex items-center gap-4">
        {/* Timer + Zoom etc */}
        {metaRight && (
          <div className="flex items-center text-[11px] leading-tight">
            {metaRight}
          </div>
        )}

        {/* Exit */}
        {exitWrapped}
      </div>
    </header>
  );
};

export default ExamHeader;
