// pages/listening/[slug].tsx
import * as React from 'react';
import { useRouter } from 'next/router';
import { ExamShell } from '@/premium-ui/exam/ExamShell';
import { PrAudioPlayer } from '@/premium-ui/components/PrAudioPlayer';
import { PrButton } from '@/premium-ui/components/PrButton';
import { ExamGate } from '@/premium-ui/access/ExamGate';
import { PinGate } from '@/premium-ui/access/PinGate';
import type { PrBreadcrumbItem } from '@/premium-ui/components/PrBreadcrumb';

export default function ListeningExam() {
  const router = useRouter();
  const slug = String(router.query.slug || 'sample-test');
  const friendlySlug = React.useMemo(() => formatExamSlug(slug), [slug]);

  const [ready, setReady] = React.useState(false);      // subscription verified
  const [unlocked, setUnlocked] = React.useState(false); // pin verified
  const [part, setPart] = React.useState(1);
  const total = 4;

  const breadcrumbItems = React.useMemo<PrBreadcrumbItem[]>(
    () => [
      { label: 'Premium Suite', href: '/premium', description: 'Enterprise controls' },
      { label: 'Listening Lab', href: '/premium/listening', description: 'Assessments' },
      { label: friendlySlug, meta: `Part ${part}/${total}`, description: 'Active attempt' },
    ],
    [friendlySlug, part, total],
  );

  const onNext = () => setPart((p) => Math.min(total, p + 1));
  const onPrev = () => setPart((p) => Math.max(1, p - 1));

  const answerSheet = (
    <div className="pr-space-y-3">
      <p className="pr-text-sm pr-text-[color-mix(in_oklab,var(--pr-fg)_60%,var(--pr-bg))]">Record your selections while the audio plays.</p>
      <div className="pr-grid pr-grid-cols-5 pr-gap-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <input
            key={i}
            aria-label={`Answer ${i + 1}`}
            className="pr-h-10 pr-rounded-lg pr-border pr-border-[color-mix(in_oklab,var(--pr-border)_80%,transparent)] pr-bg-transparent pr-text-center focus:pr-border-[var(--pr-primary)]"
          />
        ))}
      </div>
    </div>
  );

  // Gate #1: subscription/plan check
  if (!ready) return <ExamGate onReady={() => setReady(true)} />;

  // Gate #2: exam PIN check
  if (!unlocked) return <PinGate onSuccess={() => setUnlocked(true)} />;

  return (
    <ExamShell
      title={`Listening • ${friendlySlug}`}
      totalQuestions={total}
      currentQuestion={part}
      seconds={60 * 10}
      onNavigate={setPart}
      onTimeUp={() => alert('Time up!')}
      answerSheet={answerSheet}
      breadcrumbItems={breadcrumbItems}
    >
      <div className="pr-space-y-4">
        <PrAudioPlayer
          src="/audio/sample-listening.mp3"
          missingFixtureHint={
            <span>
              Sample audio missing. Run <code>./scripts/generate-listening-fixtures.sh</code> to recreate fixtures.
            </span>
          }
        />
        <div className="pr-space-y-2">
          <h3 className="pr-font-semibold">Questions (Part {part})</h3>
          <ol className="pr-list-decimal pr-ml-6 pr-space-y-2">
            <li>Sample MCQ…</li>
            <li>Sample Gap Fill…</li>
            <li>Sample Matching…</li>
          </ol>
        </div>
        <div className="pr-flex pr-justify-between">
          <PrButton variant="outline" onClick={onPrev} disabled={part === 1}>
            Back
          </PrButton>
          <PrButton onClick={onNext} disabled={part === total}>
            Next
          </PrButton>
        </div>
      </div>
    </ExamShell>
  );
}

function formatExamSlug(value: string) {
  if (!value) return 'Untitled';
  const cleaned = value.replace(/\+/g, ' ');
  let decoded = cleaned;
  try {
    decoded = decodeURIComponent(cleaned);
  } catch {
    decoded = cleaned;
  }
  return decoded
    .split(/[-\s]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
