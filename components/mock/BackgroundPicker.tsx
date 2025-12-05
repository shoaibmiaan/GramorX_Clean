import * as React from 'react';

import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { Icon } from '@/components/design-system/Icon';
import { cn } from '@/lib/utils';

export type MockBgTheme =
  | 'clean-light'
  | 'matte-dark'
  | 'gradient-blue'
  | 'gradient-purple'
  | 'mesh-pattern'
  | 'cbe-grey';

type BackgroundPickerProps = {
  value: MockBgTheme;
  onChange: (next: MockBgTheme) => void;
};

const options: Array<{ value: MockBgTheme; label: string; helper?: string; previewClass: string }> = [
  {
    value: 'clean-light',
    label: 'Clean light',
    helper: 'Default neutral canvas',
    previewClass: 'bg-gradient-to-br from-white via-slate-50 to-slate-200',
  },
  {
    value: 'matte-dark',
    label: 'Matte dark',
    helper: 'For deep focus',
    previewClass: 'bg-neutral-900',
  },
  {
    value: 'gradient-blue',
    label: 'Blue gradient',
    helper: 'Study calm energy',
    previewClass: 'bg-gradient-to-br from-sky-100 via-blue-200 to-indigo-300',
  },
  {
    value: 'gradient-purple',
    label: 'Purple gradient',
    helper: 'Premium mock feel',
    previewClass: 'bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900',
  },
  {
    value: 'mesh-pattern',
    label: 'Mesh pattern',
    helper: 'Subtle mesh vibe',
    previewClass:
      'bg-[radial-gradient(circle_at_20%_20%,rgba(79,70,229,0.16),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.16),transparent_30%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.16),transparent_25%)] bg-slate-50',
  },
  {
    value: 'cbe-grey',
    label: 'CBE grey',
    helper: 'IELTS-inspired neutral',
    previewClass: 'bg-gradient-to-b from-slate-300 via-slate-200 to-slate-300',
  },
];

export function BackgroundPicker({ value, onChange }: BackgroundPickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (next: MockBgTheme) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div className="pointer-events-none fixed bottom-5 right-4 z-40 sm:bottom-8 sm:right-8">
      <div className="pointer-events-auto inline-block text-left">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-full bg-white/90 text-slate-900 shadow-lg shadow-black/10 backdrop-blur dark:bg-slate-900/70 dark:text-slate-50"
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <Icon name="Palette" size={16} className="mr-2" />
          Theme
        </Button>

        {open && (
          <Card className="absolute bottom-14 right-0 w-80 space-y-3 rounded-2xl border border-slate-200/70 bg-white/95 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Background themes</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">Instantly switch your mock vibe.</p>
              </div>
              <Badge
                variant="outline"
                size="sm"
                className="text-[11px] uppercase tracking-[0.12em] text-slate-600 dark:border-white/30 dark:text-slate-200"
              >
                Beta
              </Badge>
            </div>

            <div className="grid gap-2">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white/75 px-3 py-2 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md backdrop-blur dark:border-white/10 dark:bg-slate-900/70',
                    value === option.value && 'ring-2 ring-primary/50'
                  )}
                >
                  <span
                    className={cn('h-10 w-10 rounded-md border border-white/50 shadow-inner ring-1 ring-black/5', option.previewClass)}
                    aria-hidden
                  />
                  <span className="flex flex-1 flex-col">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">{option.label}</span>
                    {option.helper ? <span className="text-xs text-slate-600 dark:text-slate-300">{option.helper}</span> : null}
                  </span>
                  {value === option.value && <Icon name="Check" size={16} className="text-primary" />}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default BackgroundPicker;
