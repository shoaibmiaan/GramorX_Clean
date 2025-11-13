import Link from 'next/link';
import { Container } from '@/components/design-system/Container';
import { Card } from '@/components/design-system/Card';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';
import { VocabularySpotlightFeature } from '@/components/feature/VocabularySpotlight';

export default function VocabularyLabHome() {
  return (
    <section className="bg-lightBg py-20 dark:bg-gradient-to-br dark:from-dark/80 dark:to-darker/90">
      <Container>
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="space-y-2">
            <h1 className="font-slab text-display">Vocabulary Lab</h1>
            <p className="text-grayish">
              Build IELTS-ready vocabulary with daily boosts, topic lists, and quick quizzes.
            </p>
          </div>

          <VocabularySpotlightFeature />

          <div className="grid gap-6 md:grid-cols-3 mt-10">
            <Card className="rounded-ds-2xl p-6 flex flex-col gap-3">
              <Icon name="BookOpen" size={28} className="text-primary" />
              <h3 className="font-semibold">Word Lists</h3>
              <p className="text-sm text-muted-foreground">
                Academic wordlist, topic lists, collocations and linking phrases.
              </p>
              <Button asChild variant="primary" className="mt-auto rounded-ds-xl">
                <Link href="/vocabulary/lists">Browse lists</Link>
              </Button>
            </Card>

            <Card className="rounded-ds-2xl p-6 flex flex-col gap-3">
              <Icon name="Heart" size={28} className="text-secondary" />
              <h3 className="font-semibold">My Words</h3>
              <p className="text-sm text-muted-foreground">
                All words you’ve saved from dashboard, practice, and mocks.
              </p>
              <Button asChild variant="secondary" className="mt-auto rounded-ds-xl">
                <Link href="/vocabulary/my-words">Open list</Link>
              </Button>
            </Card>

            <Card className="rounded-ds-2xl p-6 flex flex-col gap-3">
              <Icon name="Sparkles" size={28} className="text-electricBlue" />
              <h3 className="font-semibold">Quiz</h3>
              <p className="text-sm text-muted-foreground">
                Test recall with quick, adaptive quizzes (MCQ, fill-in-the-blank, usage).
              </p>
              <Button asChild variant="accent" className="mt-auto rounded-ds-xl">
                <Link href="/vocabulary/quiz">Start quiz</Link>
              </Button>
            </Card>
          </div>
        </div>
      </Container>
    </section>
  );
}
