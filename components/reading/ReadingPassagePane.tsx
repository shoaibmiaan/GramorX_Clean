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
    <div className="flex-1 bg-white shadow-md rounded-xl border border-slate-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 px-4 py-3 border-b flex items-center justify-between text-slate-800">
        <span className="font-semibold tracking-wide text-sm">
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
          'flex-1 overflow-y-auto px-6 py-5 whitespace-pre-wrap bg-white text-slate-800',
          zoom === 'sm' && 'text-xs leading-6',
          zoom === 'md' && 'text-sm leading-7',
          zoom === 'lg' && 'text-base leading-8',
          highlightMode && 'cursor-text selection:bg-yellow-200/60',
        )}
        onMouseUp={handleHighlightClick}
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Passage navigation */}
      {totalPassages > 1 && (
        <div className="px-4 py-3 border-t bg-slate-50 flex items-center justify-between text-xs text-slate-600">
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
