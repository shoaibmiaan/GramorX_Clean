import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import { Badge } from '@/components/design-system/Badge';
import Icon from '@/components/design-system/Icon';

interface VocabItem {
  word: string;
  phonetic: string;
  pos: string;
  meaning: string;
  example: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
  skillImpact: 'Writing' | 'Speaking' | 'Both';
}

// TODO: later wire this from Supabase / AI plan
const todaysWord: VocabItem = {
  word: 'Mitigate',
  phonetic: '/ˈmɪt.ɪ.ɡeɪt/',
  pos: 'verb',
  meaning: 'To make something less harmful, serious, or severe.',
  example: 'Effective time management can mitigate exam-related stress.',
  difficulty: 'medium',
  topic: 'Task 2 • Problem / Solution',
  skillImpact: 'Writing',
};

const difficultyLabel: Record<VocabItem['difficulty'], string> = {
  easy: 'Band 5–6 range',
  medium: 'Band 6.5–7.5 booster',
  hard: 'Band 8+ choice',
};

export function VocabularySpotlightFeature() {
  return (
    <Card className="rounded-ds-2xl border border-border/60 bg-card/70 p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-slab text-h3">Vocabulary of the Day</h3>
              <Badge size="xs" variant="accent">
                IELTS
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              One high-impact word you can actually use in your next essay or answer.
            </p>
          </div>
          <Button
            asChild
            size="sm"
            variant="ghost"
            className="rounded-ds-xl text-xs sm:text-sm"
          >
            <Link href="/vocabulary">Open Vocabulary Lab</Link>
          </Button>
        </div>

        {/* Main word block */}
        <div className="flex flex-col gap-3 rounded-ds-2xl bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-display font-semibold capitalize">
                {todaysWord.word}
              </span>
              <Badge size="xs" variant="soft" tone="primary">
                {todaysWord.pos}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{todaysWord.phonetic}</p>
            <p className="text-sm">{todaysWord.meaning}</p>
          </div>

          <div className="mt-3 flex flex-col gap-2 text-xs sm:mt-0 sm:w-52">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon name="PenLine" size={14} />
              </span>
              <div>
                <p className="font-medium leading-tight">Best for: {todaysWord.skillImpact}</p>
                <p className="text-[11px] text-muted-foreground">
                  Great for formal essays, causes / effects, and problem–solution answers.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <Icon name="SignalHigh" size={14} />
              </span>
              <div>
                <p className="font-medium leading-tight">
                  {difficultyLabel[todaysWord.difficulty]}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Fits well if you&apos;re aiming {todaysWord.difficulty === 'easy'
                    ? 'to get stable 6+'
                    : todaysWord.difficulty === 'medium'
                    ? 'for 6.5–7.5'
                    : 'for 8+'}
                  .
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Example & topic row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="border-l-4 border-primary/40 pl-4 text-sm italic text-muted-foreground">
            “{todaysWord.example}”
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {todaysWord.topic && (
              <Badge size="sm" variant="soft" tone="secondary">
                {todaysWord.topic}
              </Badge>
            )}
            <Badge size="sm" variant="soft" tone="info">
              Daily word • 1 of 5
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="primary" className="rounded-ds-xl">
            Add to My Words
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="rounded-ds-xl"
            asChild
          >
            <Link href="/vocabulary/quiz/today">Quick Quiz</Link>
          </Button>
          <Button size="sm" variant="ghost" className="rounded-ds-xl" asChild>
            <Link href="/vocabulary/my-words">Review saved</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default VocabularySpotlightFeature;
