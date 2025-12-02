// components/reading/ReadingPassagePane.tsx

import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Icon } from '@/components/design-system/Icon';
import { cn } from '@/lib/utils';

type Props = {
  passage: any;
  totalPassages: number;
  currentPassageIndex: number;
  onPrev: () => void;
  onNext: () => void;
  highlights: string[];
  onAddHighlight: (text: string) => void;
  onClearHighlights: () => void;
  zoom: 'sm' | 'md' | 'lg';
};

export const ReadingPassagePane: React.FC<Props> = ({
  passage,
  totalPassages,
  currentPassageIndex,
  onPrev,
  onNext,
  highlights,
  onAddHighlight,
  onClearHighlights,
  zoom,
}) => {
  const [highlightMode, setHighlightMode] = React.useState(false);

  const toggleHighlight = () => setHighlightMode((x) => !x);

  const handleHighlight = () => {
    const sel = window.getSelection();
    if (!sel) return;

    const text = sel.toString();
    if (text.trim().length === 0) return;

    onAddHighlight(text);

    try {
      const range = sel.getRangeAt(0);
      const span = document.createElement('span');
      span.className = 'bg-yellow-300/40';
      range.surroundContents(span);
    } catch {}
    sel.removeAllRanges();
  };

  return (
    <Card
      className={cn(
        'flex flex-col w-full rounded-lg border border-border/60 shadow-sm bg-card/95',
        'overflow-hidden'
      )}
    >
      {/* IELTS-style top bar */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-border/60 bg-muted/40">
        <div className="text-[13px] font-semibold text-primary">
          READING PASSAGE {currentPassageIndex + 1}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant={highlightMode ? 'secondary' : 'outline'}
            className={cn(
              'h-7 px-2 text-[11px]',
              highlightMode && 'bg-yellow-300/30 text-primary'
            )}
            onClick={() => {
              toggleHighlight();
            }}
          >
            <Icon name="highlighter" className="h-3.5 w-3.5 mr-1" />
            {highlightMode ? 'Highlight (On)' : 'Highlight'}
          </Button>

          <Button
            size="xs"
            variant="outline"
            className="h-7 px-2 text-[11px]"
            onClick={() => {
              onClearHighlights();
            }}
          >
            <Icon name="eraser" className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Passage text area */}
      <div
        className={cn(
          'flex-1 overflow-y-auto px-5 py-5 leading-7',
          zoom === 'sm' && 'text-xs',
          zoom === 'md' && 'text-sm',
          zoom === 'lg' && 'text-base'
        )}
        onMouseUp={() => {
          if (highlightMode) handleHighlight();
        }}
      >
        <div className="max-w-[780px] mx-auto text-justify">
          {/* Safe HTML render of passage content */}
          <div
            dangerouslySetInnerHTML={{
              __html: passage.content,
            }}
          />
        </div>
      </div>

      {/* Bottom nav: Previous Passage / Next Passage */}
      <div className="flex justify-between items-center px-4 py-2 border-t border-border/60 bg-muted/30 text-[12px]">
        <Button
          size="xs"
          variant="outline"
          disabled={currentPassageIndex === 0}
          onClick={onPrev}
        >
          Previous passage
        </Button>
        <span className="text-muted-foreground">
          Passage {currentPassageIndex + 1} of {totalPassages}
        </span>
        <Button
          size="xs"
          variant="outline"
          disabled={currentPassageIndex + 1 >= totalPassages}
          onClick={onNext}
        >
          Next passage
        </Button>
      </div>
    </Card>
  );
};
