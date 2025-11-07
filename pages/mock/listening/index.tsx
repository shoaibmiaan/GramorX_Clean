import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { ModuleMockShell, ModuleMockShellSection } from '@/components/mock-tests/ModuleMockShell';
import { listeningPracticeList } from '@/data/listening/index';
import { mockSections } from '@/data/mockTests';

const formatMinutes = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return 'Self-paced';
  const minutes = Math.round(seconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
};

const listeningHighlights = [
  {
    title: 'Band-aligned auto marking',
    description:
      'Instant answer checking calibrated with Cambridge descriptors, including paraphrase recognition and typo tolerance.',
  },
  {
    title: 'Smart review workspace',
    description:
      'Scrub through transcripts, tap vocabulary to see synonyms, and compare with model answers inside the same tab.',
  },
  {
    title: 'Focus & pacing tools',
    description:
      'Adaptive timers, double-speed playback, and note flags keep you on tempo during each section.',
  },
];

const examBreakdown = [
  {
    title: 'Part 1 · Everyday dialogue',
    focus: 'Form completion & short answers',
    description:
      'Slow-paced introductions with spelling-sensitive fields help you warm up while practicing active listening.',
  },
  {
    title: 'Part 2 · Monologue briefing',
    focus: 'Map/diagram labelling',
    description:
      'Campus and city contexts with interactive plans that mirror the computer-delivered IELTS layout.',
  },
  {
    title: 'Part 3 · Academic discussion',
    focus: 'Multiple-choice & matching',
    description:
      'Group conversations featuring varying accents and faster pace to refine detail tracking.',
  },
  {
    title: 'Part 4 · Lecture summary',
    focus: 'Sentence completion',
    description:
      'Extended talk with technical vocabulary, including AI hints for note-taking and signposting phrases.',
  },
];

export default function ListeningPracticeIndex() {
  const primaryPaper = listeningPracticeList[0];
  const totalQuestions = mockSections.listening.questions.length;
  const totalSets = listeningPracticeList.length;
  const durationMinutes = Math.round(mockSections.listening.duration / 60);

  return (
    <ModuleMockShell
      title="Listening Mock Tests"
      description="Train for band 9 comprehension with realistic audio quality, AI marking, and guided review flows. Every paper mirrors the official timing, navigation, and answer entry experience."
      actions={
        primaryPaper ? (
          <>
            <Button
              href={`/mock/listening/${primaryPaper.id}`}
              variant="primary"
              className="rounded-ds"
            >
              Start {primaryPaper.title}
            </Button>
            <Button href="#practice-sets" variant="ghost" className="rounded-ds">
              Browse all sets
            </Button>
          </>
        ) : null
      }
      stats={[
        {
          label: 'Official timing',
          value: `${durationMinutes} mins`,
          helper: 'Auto-paused between sections',
        },
        {
          label: 'Question bank',
          value: `${totalSets} full sets`,
          helper: 'New releases each month',
        },
        {
          label: 'Per test questions',
          value: totalQuestions,
          helper: 'Balanced across 4 parts',
        },
      ]}
    >
      <ModuleMockShellSection className="grid gap-6 md:grid-cols-3">
        {listeningHighlights.map((feature) => (
          <Card key={feature.title} className="card-surface rounded-ds-2xl p-6 h-full">
            <h2 className="text-h5 font-semibold text-foreground">{feature.title}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{feature.description}</p>
          </Card>
        ))}
      </ModuleMockShellSection>

      <ModuleMockShellSection id="practice-sets">
        <h2 className="text-h3 font-semibold text-foreground">Choose a listening paper</h2>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Timed mock tests cover all accents and question formats. Resume unfinished attempts anytime—your answers autosave on every change.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {listeningPracticeList.map((paper) => (
            <Card key={paper.id} className="card-surface h-full rounded-ds-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-h4 font-semibold text-foreground">{paper.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <Badge variant="info" size="sm">{formatMinutes(paper.durationSec)}</Badge>
                    <Badge variant="neutral" size="sm">{paper.sections} sections</Badge>
                    <Badge variant="secondary" size="sm">{paper.totalQuestions} questions</Badge>
                  </div>
                </div>
                <Badge variant="primary" size="sm">Practice</Badge>
              </div>

              <div className="mt-6">
                <Button href={`/mock/listening/${paper.id}`} variant="primary" className="w-full rounded-ds">
                  Start practice
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ModuleMockShellSection>

      <ModuleMockShellSection>
        <h2 className="text-h3 font-semibold text-foreground">Exam structure inside the simulator</h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          Experience the real IELTS listening flow. Each part unlocks sequentially with auto-pauses for transferring answers and quick tips before the next audio track.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {examBreakdown.map((part) => (
            <Card key={part.title} className="card-surface rounded-ds-2xl p-6 h-full">
              <h3 className="text-h5 font-semibold text-foreground">{part.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{part.focus}</p>
              <p className="mt-3 text-sm text-muted-foreground">{part.description}</p>
            </Card>
          ))}
        </div>
      </ModuleMockShellSection>
    </ModuleMockShell>
  );
}
