import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { ModuleMockShell, ModuleMockShellSection } from '@/components/mock-tests/ModuleMockShell';
import { readingPracticeList } from '@/data/reading';
import { mockSections } from '@/data/mock';

const formatMinutes = (seconds: number) => {
  const minutes = Math.round(seconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
};

const readingHighlights = [
  {
    title: 'Adaptive passage layout',
    description:
      'Choose split-screen or scroll mode, add highlights, and leave sticky notes anywhere in the text for later review.',
  },
  {
    title: 'AI explanations & keywords',
    description:
      'See why each answer is correct with paragraph references, supporting sentences, and vocabulary to learn.',
  },
  {
    title: 'Speed & accuracy analytics',
    description:
      'Question navigator tracks your timing and flags accuracy hotspots to prioritise before your next attempt.',
  },
];

const questionFamilies = [
  {
    title: 'True / False / Not Given',
    description: 'Focus on precise meaning; receive paraphrase spotting tips.',
  },
  {
    title: 'Matching & Headings',
    description: 'Practice grouping ideas quickly using drag-and-drop interactions.',
  },
  {
    title: 'Gap fills & Table notes',
    description: 'Build skimming skills with instant keyword suggestions when reviewing.',
  },
  {
    title: 'Multiple choice sets',
    description: 'Timed single and multiple answer variants with rationales for each distractor.',
  },
];

export default function ReadingMockTestsPage() {
  const primaryPaper = readingPracticeList[0];
  const durationMinutes = Math.round(mockSections.reading.duration / 60);
  const totalQuestions = mockSections.reading.questions.length;

  return (
    <ModuleMockShell
      title="Reading Mock Tests"
      description="Academic passages with authentic IELTS difficulty. Toggle focus modes, annotate as you go, and get guided reviews that show the exact paragraph evidence you missed."
      actions={
        primaryPaper ? (
          <>
            <Button href={`/mock/reading/${primaryPaper.id}`} variant="primary" className="rounded-ds">
              Start {primaryPaper.title}
            </Button>
            <Button href="#reading-sets" variant="ghost" className="rounded-ds">
              Browse all sets
            </Button>
          </>
        ) : null
      }
      stats={[
        {
          label: 'Official timing',
          value: `${durationMinutes} mins`,
          helper: 'Resume saved attempts anytime',
        },
        {
          label: 'Passage bank',
          value: `${readingPracticeList.length} full sets`,
          helper: 'Academic & General topics',
        },
        {
          label: 'Questions per test',
          value: totalQuestions,
          helper: 'Balanced difficulty curve',
        },
      ]}
    >
      <ModuleMockShellSection className="grid gap-6 md:grid-cols-3">
        {readingHighlights.map((feature) => (
          <Card key={feature.title} className="card-surface rounded-ds-2xl p-6 h-full">
            <h2 className="text-h5 font-semibold text-foreground">{feature.title}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{feature.description}</p>
          </Card>
        ))}
      </ModuleMockShellSection>

      <ModuleMockShellSection id="reading-sets">
        <h2 className="text-h3 font-semibold text-foreground">Choose a reading paper</h2>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Each paper includes three long passages with the full range of IELTS question families. AI review shows you the exact lines that triggered the answer.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {readingPracticeList.map((paper) => (
            <Card key={paper.id} className="card-surface h-full rounded-ds-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-h4 font-semibold text-foreground">{paper.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                    <Badge variant="info" size="sm">{formatMinutes(paper.durationSec)}</Badge>
                    <Badge variant="neutral" size="sm">{paper.passages} passages</Badge>
                    <Badge variant="secondary" size="sm">{paper.totalQuestions} questions</Badge>
                  </div>
                </div>
                <Badge variant="primary" size="sm">Practice</Badge>
              </div>

              <div className="mt-6">
                <Button href={`/mock/reading/${paper.id}`} variant="primary" className="w-full rounded-ds">
                  Start practice
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </ModuleMockShellSection>

      <ModuleMockShellSection>
        <h2 className="text-h3 font-semibold text-foreground">Master every question family</h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          Drill the formats you find toughest. Mock mode surfaces micro-lessons and curated tips as soon as you submit your attempt.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {questionFamilies.map((item) => (
            <Card key={item.title} className="card-surface rounded-ds-2xl p-6 h-full">
              <h3 className="text-h5 font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
            </Card>
          ))}
        </div>
      </ModuleMockShellSection>
    </ModuleMockShell>
  );
}
