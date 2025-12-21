// components/writing/result/WritingNextSteps.tsx
import * as React from 'react';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

import { pickExample } from '@/lib/writing/examples/examples';
import type { BandScore } from '@/lib/writing/types';

type CriteriaKey = 'TR' | 'CC' | 'LR' | 'GRA';

type Props = {
  nextSteps: string[];
  // Optional: pass overall band or a representative band (e.g., overall band) for example difficulty
  exampleBand?: BandScore;
};

const FALLBACK_STEPS = [
  'Task 2: state a clear position and support it with specific examples.',
  'Fix paragraphing: use clear topic sentences in body paragraphs.',
  'Reduce repetition of basic connectors and vocabulary.',
  'Increase sentence variety while maintaining accuracy.',
];

const detectTags = (stepRaw: string): CriteriaKey[] => {
  const s = stepRaw.toLowerCase();
  const tags: CriteriaKey[] = [];

  if (
    s.includes('task 2') ||
    s.includes('task 1') ||
    s.includes('position') ||
    s.includes('answer the question') ||
    s.includes('address the question') ||
    s.includes('example') ||
    s.includes('develop') ||
    s.includes('idea')
  ) {
    tags.push('TR');
  }

  if (
    s.includes('paragraph') ||
    s.includes('paragraphing') ||
    s.includes('structure') ||
    s.includes('cohesion') ||
    s.includes('coherence') ||
    s.includes('link') ||
    s.includes('linking') ||
    s.includes('topic sentence') ||
    s.includes('flow')
  ) {
    tags.push('CC');
  }

  if (
    s.includes('vocab') ||
    s.includes('vocabulary') ||
    s.includes('word choice') ||
    s.includes('collocation') ||
    s.includes('repetition') ||
    s.includes('precise') ||
    s.includes('phrases')
  ) {
    tags.push('LR');
  }

  if (
    s.includes('grammar') ||
    s.includes('accuracy') ||
    s.includes('errors') ||
    s.includes('sentence') ||
    s.includes('range') ||
    s.includes('articles') ||
    s.includes('tense') ||
    s.includes('agreement')
  ) {
    tags.push('GRA');
  }

  return Array.from(new Set(tags));
};

const pickPrimaryTag = (tags: CriteriaKey[]): CriteriaKey => {
  // order: TR/CC first because they move band fastest
  const order: CriteriaKey[] = ['TR', 'CC', 'LR', 'GRA'];
  for (const k of order) if (tags.includes(k)) return k;
  return 'TR';
};

const tagLabel: Record<CriteriaKey, string> = {
  TR: 'TR',
  CC: 'CC',
  LR: 'LR',
  GRA: 'GRA',
};

export const WritingNextSteps: React.FC<Props> = ({ nextSteps, exampleBand = 6.5 }) => {
  const cleaned = (nextSteps ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const list = (cleaned.length ? cleaned : FALLBACK_STEPS).slice(0, 4);

  return (
    <Card className="rounded-ds-2xl border border-border bg-card/70 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted">
          <Icon name="ListChecks" size={18} />
        </span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">What to improve next</p>
            <Badge variant="neutral" size="sm">
              Focus list
            </Badge>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Priority order. Each step is tagged + has a mini example you can copy.
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        {list.map((s, idx) => {
          const tags = detectTags(s);
          const safeTags = tags.length ? tags : (['TR'] as CriteriaKey[]);
          const primary = pickPrimaryTag(safeTags);

          const example = pickExample(primary, exampleBand);

          return (
            <li key={`${idx}-${s}`} className="rounded-ds-xl border border-border bg-muted/30 p-3">
              <div className="flex items-start gap-3">
                <span className="mt-[2px] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[12px] font-semibold text-foreground">
                  {idx + 1}
                </span>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm text-foreground">{s}</p>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {safeTags.map((t) => (
                        <Badge key={t} size="sm" variant="neutral">
                          {tagLabel[t]}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {example ? (
                    <div className="rounded-ds-xl border border-border bg-card/60 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        Quick example ({primary})
                      </p>
                      <p className="mt-1 text-sm text-foreground">{example}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex items-start gap-2 rounded-ds-xl border border-border bg-muted/40 p-3">
        <Icon name="Sparkles" className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Tip: fix <span className="font-semibold text-foreground">TR</span> +{' '}
          <span className="font-semibold text-foreground">CC</span> first — fastest band gains.
        </p>
      </div>
    </Card>
  );
};
