// components/listening/AISummaryCard.tsx
import { Card } from '@/components/design-system/Card';
import { Icon } from '@/components/design-system/Icon';
import { Button } from '@/components/design-system/Button';
import Link from 'next/link';

export function AISummaryCard() {
  return (
    <Card className="p-5 rounded-ds-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/20">
          <Icon name="Sparkles" className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1 space-y-2">
          <h4 className="font-medium text-small">AI Listening Coach</h4>
          <p className="text-caption text-muted-foreground leading-relaxed">
            Get personalized feedback on spelling mistakes, accent comprehension, and question-type weaknesses — powered by AI.
          </p>
          <Button asChild size="sm" variant="secondary" className="mt-2">
            <Link href="/mock/listening/ai-coach">Open AI Coach</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}