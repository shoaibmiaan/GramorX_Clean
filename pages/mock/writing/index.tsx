import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { ModuleMockShell, ModuleMockShellSection } from '@/components/mock-tests/ModuleMockShell';
import { writingExamSummaries } from '@/data/writing/exam-index';

const writingHighlights = [
  {
    title: 'Task 1 visuals & letters',
    description:
      'Toggle between Academic visuals and General Training letters with structured outlines, tone guidance, and starter phrases.',
  },
  {
    title: 'Task 2 essay guidance',
    description:
      'Brainstorm with banded sample ideas, cohesive devices, and live word counts so you hit task response targets without rambling.',
  },
  {
    title: 'AI scoring & review',
    description:
      'Instant band estimates with annotated feedback across Task Achievement, Coherence, Lexical Resource, and Grammar.',
  },
];

const practiceWorkflow = [
  {
    title: 'Plan with structure blocks',
    description:
      'Organise key points, comparisons, and thesis statements before you start typing. Autosave keeps drafts safe while you switch tasks.',
  },
  {
    title: 'Write distraction-free',
    description:
      'Focus mode, keyboard shortcuts, and timer nudges mirror the real 60-minute exam experience.',
  },
  {
    title: 'Review with evidence',
    description:
      'See grammar highlights, lexical upgrades, and band-aligned rationales with links back to your paragraphs.',
  },
];

const formatTags = (tags: string[] | undefined) => {
  if (!tags?.length) return null;
  return tags.slice(0, 3).map((tag) => (
    <Badge key={tag} variant="neutral" size="sm">
      {tag}
    </Badge>
  ));
};

export default function WritingMockLandingPage() {
  const primaryPaper = writingExamSummaries[0];
  const totalSets = writingExamSummaries.length;
  const durationMinutes = primaryPaper?.durationMinutes ?? 60;

  return (
    <ModuleMockShell
      title="Writing Mock Tests"
      description="Simulate the full IELTS Writing module with autosave, focus guard, and AI scoring. Move between Task 1 and Task 2, keep your outline visible, and export answers for teacher review."
      heroVariant="split"
      actions={
        primaryPaper ? (
          <>
            <Button
              href={`/mock/writing/run?mockId=${primaryPaper.id}`}
              variant="primary"
              className="rounded-ds"
            >
              Start {primaryPaper.title}
            </Button>
            <Button href="#writing-sets" variant="ghost" className="rounded-ds">
              Browse all sets
            </Button>
          </>
        ) : null
      }
      stats={[
        { label: 'Official timing', value: `${durationMinutes} mins`, helper: 'Task 1 + Task 2' },
        { label: 'Mock bank', value: `${totalSets} sets`, helper: 'Academic & General Training' },
        { label: 'Autosave & focus', value: 'Enabled', helper: 'Idle detection + clipboard guard' },
      ]}
    >
      <ModuleMockShellSection className="grid gap-6 md:grid-cols-3">
        {writingHighlights.map((item) => (
          <Card key={item.title} className="card-surface rounded-ds-2xl p-6 h-full">
            <h2 className="text-h5 font-semibold text-foreground">{item.title}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{item.description}</p>
          </Card>
        ))}
      </ModuleMockShellSection>

      <ModuleMockShellSection id="writing-sets">
        <h2 className="text-h3 font-semibold text-foreground">Choose a writing paper</h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          Academic visuals, General Training letters, and Task 2 essays with realistic timing. Start fresh or resume with autosave — feedback is ready right after you submit.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {writingExamSummaries.map((paper) => (
            <Card key={paper.id} className="card-surface h-full rounded-ds-2xl p-6">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <h3 className="text-h4 font-semibold text-foreground">{paper.title}</h3>
                  <Badge variant="info" size="sm">
                    {paper.task1Type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{paper.description}</p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary" size="sm">{paper.durationMinutes} mins</Badge>
                  {paper.register ? (
                    <Badge variant="neutral" size="sm">{paper.register} register</Badge>
                  ) : null}
                  {formatTags(paper.tags)}
                </div>
                <div className="grid gap-1 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium text-foreground">Task 1:</span> {paper.task1Focus}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Task 2:</span> {paper.task2Focus}
                  </div>
                </div>
                <Button
                  href={`/mock/writing/run?mockId=${paper.id}`}
                  variant="primary"
                  className="w-full rounded-ds"
                >
                  Start mock
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ModuleMockShellSection>

      <ModuleMockShellSection>
        <h2 className="text-h3 font-semibold text-foreground">Built for fast improvement</h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          Follow the same workflow as our main home experience: plan, write, and review with evidence-backed insights tailored for each module.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {practiceWorkflow.map((step) => (
            <Card key={step.title} className="card-surface rounded-ds-2xl p-6 h-full">
              <h3 className="text-h5 font-semibold text-foreground">{step.title}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{step.description}</p>
            </Card>
          ))}
        </div>
      </ModuleMockShellSection>
    </ModuleMockShell>
  );
}
