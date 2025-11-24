import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';
import { ModuleMockShell, ModuleMockShellSection } from '@/components/mock-tests/ModuleMockShell';
import { speakingPracticeList } from '@/data/speaking';

const speakingHighlights = [
  {
    title: 'Studio-grade recordings',
    description:
      'Record within the browser, auto-save responses, and export audio to share with tutors or peers for additional feedback.',
  },
  {
    title: 'Instant transcripts & analysis',
    description:
      'AI transcription highlights fillers, pacing, and pronunciation so you can focus practice on what matters.',
  },
  {
    title: 'Follow-up coaching prompts',
    description:
      'Guided reflections after each part help you write better answers for your next attempt.',
  },
];

const speakingFlow = [
  {
    title: 'Part 1 · Interview warm-up',
    description: 'Rapid-fire personal questions with tips to extend answers naturally.',
  },
  {
    title: 'Part 2 · Cue card',
    description: 'Timed prep + speaking timer to mirror the real exam pressure.',
  },
  {
    title: 'Part 3 · Discussion',
    description: 'Higher-level follow-ups with AI-generated sample ideas and vocabulary.',
  },
];

const formatRange = (values: number[], unit: string) => {
  if (!values.length) return '—';
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return `${min} ${unit}`;
  }
  return `${min}–${max} ${unit}`;
};

const sum = (values: number[]) => values.reduce((acc, value) => acc + value, 0);

export default function SpeakingMockTestsPage() {
  const primaryScript = speakingPracticeList[0];
  const durations = speakingPracticeList.map((item) => item.durationMinutes);
  const prompts = speakingPracticeList.map((item) => item.totalPrompts);

  const totalScripts = speakingPracticeList.length;
  const durationRange = formatRange(durations, 'mins');
  const promptRange = formatRange(prompts, 'prompts');
  const totalPrompts = prompts.length ? sum(prompts) : 0;

  return (
    <ModuleMockShell
      title="Speaking Mock Tests"
      description="Simulate the face-to-face interview with recording, timing, and feedback flows that mirror the IELTS speaking test."
      actions={
        primaryScript ? (
          <>
            <Button href={`/mock/speaking/${primaryScript.id}`} variant="primary" className="rounded-ds">
              Start {primaryScript.title}
            </Button>
            <Button href="#speaking-scripts" variant="ghost" className="rounded-ds">
              Compare scripts
            </Button>
          </>
        ) : null
      }
      stats={[
        {
          label: 'Scripts ready',
          value: `${totalScripts} full mocks`,
          helper: `${totalPrompts.toLocaleString()} prompts across Parts 1–3`,
        },
        {
          label: 'Duration range',
          value: durationRange,
          helper: 'Includes prep + speaking time',
        },
        {
          label: 'Prompts per set',
          value: promptRange,
          helper: 'Warm-up, cue card, and follow-ups',
        },
      ]}
    >
      <ModuleMockShellSection className="grid gap-6 md:grid-cols-3">
        {speakingHighlights.map((feature) => (
          <Card key={feature.title} className="card-surface rounded-ds-2xl p-6 h-full">
            <h2 className="text-h5 font-semibold text-foreground">{feature.title}</h2>
            <p className="mt-3 text-sm text-muted-foreground">{feature.description}</p>
          </Card>
        ))}
      </ModuleMockShellSection>

      <ModuleMockShellSection id="speaking-scripts">
        <h2 className="text-h3 font-semibold text-foreground">Select a speaking script</h2>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Each script includes complete timing, prompts, and follow-up questions. Add reflections after every part to accelerate improvement.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {speakingPracticeList.map((script) => (
            <Card key={script.id} className="card-surface rounded-ds-2xl p-6 h-full">
              <div className="flex h-full flex-col gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-h4 font-semibold text-foreground">{script.title}</h2>
                    <Badge variant="info" size="sm">{script.totalPrompts} prompts</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{script.description}</p>
                </div>

                <div className="mt-auto">
                  <Button href={`/mock/speaking/${script.id}`} variant="primary" className="rounded-ds w-full">
                    Start speaking mock
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ModuleMockShellSection>

      <ModuleMockShellSection>
        <h2 className="text-h3 font-semibold text-foreground">Build interview stamina</h2>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          Practise the full flow or drill a specific part. Our simulator keeps the pressure realistic without needing a human partner every time.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {speakingFlow.map((step) => (
            <Card key={step.title} className="card-surface rounded-ds-2xl p-6 h-full">
              <h3 className="text-h5 font-semibold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
            </Card>
          ))}
        </div>
      </ModuleMockShellSection>
    </ModuleMockShell>
  );
}
