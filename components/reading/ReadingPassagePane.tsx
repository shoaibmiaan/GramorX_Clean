import * as React from 'react';
import { Button } from '@/components/design-system/Button';
import { cn } from '@/lib/utils';

type ZoomLevel = 'sm' | 'md' | 'lg';

type PassagePaneProps = {
  passage: {
    id: string;
    content: string;
  };
  totalPassages: number;
  currentPassageIndex: number;
  onPrev: () => void;
  onNext: () => void;
  highlights: string[];
  onAddHighlight: (text: string) => void;
  onClearHighlights: () => void;
  zoom: ZoomLevel;
};

const escapeHtml = (str: string) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const escapeRegExp = (str: string) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildHighlightedHtml = (content: string, highlights: string[]) => {
  // split into paragraphs for numbering
  const raw = content || '';
  const paragraphs = raw.split(/\n{2,}/); // double newline = new paragraph

  const htmlParagraphs = paragraphs.map((p, index) => {
    let html = escapeHtml(p);

    // apply each highlight as simple text replace
    for (const h of highlights) {
      if (!h.trim()) continue;
      const safe = escapeHtml(h);
      const re = new RegExp(escapeRegExp(safe), 'gi');
      html = html.replace(
        re,
        `<mark class="bg-warning/40 px-0.5 rounded-sm">${safe}</mark>`,
      );
    }

    return `<p class="mb-3 text-sm leading-relaxed">
      <span class="mr-2 text-[11px] text-muted-foreground align-top">${index + 1}</span>
      ${html}
    </p>`;
  });

  return htmlParagraphs.join('');
};

export const ReadingPassagePane: React.FC<PassagePaneProps> = ({
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

  const toggleHighlight = () => {
    // when turning on, we don't do anything yet; highlight happens on click
    setHighlightMode((prev) => !prev);
  };

  const handleHighlightClick = () => {
    if (!highlightMode) return;
    if (typeof window === 'undefined') return;

    const sel = window.getSelection();
    if (!sel) return;
    const text = sel.toString().trim();
    if (!text) return;
    onAddHighlight(text);
    sel.removeAllRanges();
  };

  const html = React.useMemo(
    () => buildHighlightedHtml(passage.content, highlights),
    [passage.content, highlights],
  );

  return (
    <div className="flex-1 bg-white shadow-sm rounded-lg flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-muted px-4 py-2 border-b flex items-center justify-between">
        <span className="font-medium">
          READING PASSAGE {currentPassageIndex + 1}
        </span>

        <div className="flex gap-2">
          <Button
            size="xs"
            variant={highlightMode ? 'primary' : 'outline'}
            onClick={toggleHighlight}
          >
            {highlightMode ? 'Highlight on' : 'Highlight'}
          </Button>
          <Button size="xs" variant="outline" onClick={onClearHighlights}>
            Clear
          </Button>
        </div>
      </div>

      {/* Content (click to apply highlight selection) */}
      <div
        className={cn(
          'flex-1 overflow-y-auto px-5 py-4 whitespace-pre-wrap',
          zoom === 'sm' && 'text-xs',
          zoom === 'md' && 'text-sm',
          zoom === 'lg' && 'text-base',
          highlightMode && 'cursor-text',
        )}
        onMouseUp={handleHighlightClick}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Passage navigation */}
      {totalPassages > 1 && (
        <div className="px-4 py-2 border-t flex items-center justify-between text-xs">
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
            disabled={currentPassageIndex === totalPassages - 1}
            onClick={onNext}
          >
            Next passage
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReadingPassagePane;
