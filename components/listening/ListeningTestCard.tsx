import Link from 'next/link';
import { Card } from '@/components/design-system/Card';
import { Badge } from '@/components/design-system/Badge';
import { Button } from '@/components/design-system/Button';
import Icon from '@/components/design-system/Icon';
import { formatDistanceToNowStrict } from 'date-fns';

export default function ListeningTestCard({ test }) {
  const {
    test_slug,
    title,
    sections,
    totalQuestions,
    master_audio_url,
    lastAttempt,
  } = test;

  const slugUrl = `/mock/listening/run?id=${test_slug}`;

  const hasAttempt = !!lastAttempt;
  const attemptCompleted = hasAttempt && lastAttempt.submitted_at !== null;

  const lastAttemptLabel =
    hasAttempt && lastAttempt.submitted_at
      ? formatDistanceToNowStrict(new Date(lastAttempt.submitted_at), {
          addSuffix: true,
        })
      : null;

  return (
    <Card className="rounded-ds-2xl border border-border/70 bg-card/80 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-slab text-h5">{title}</h3>
        <Badge tone="info" size="sm">
          {sections} sections • {totalQuestions} questions
        </Badge>
      </div>

      <ul className="space-y-1 text-[12px] text-muted-foreground mb-4">
        <li className="flex items-center gap-2">
          <Icon name="Volume2" size={13} />
          <span>
            Audio: {master_audio_url ? 'Available' : 'Not uploaded'}
          </span>
        </li>
        <li className="flex items-center gap-2">
          <Icon name="Timer" size={13} />
          <span>Estimated duration: 30 minutes</span>
        </li>
        {hasAttempt && (
          <li className="flex items-center gap-2">
            <Icon name="Clock" size={13} />
            <span>
              Last attempt:{' '}
              {attemptCompleted ? (
                <span>Submitted {lastAttemptLabel}</span>
              ) : (
                <span>In-progress</span>
              )}
            </span>
          </li>
        )}
      </ul>

      <div className="flex gap-2">
        <Button
          asChild
          variant="primary"
          size="sm"
          className="rounded-ds-2xl"
        >
          <Link href={slugUrl}>
            {attemptCompleted ? 'Start Again' : hasAttempt ? 'Resume Attempt' : 'Start Test'}
          </Link>
        </Button>

        <Button
          asChild
          variant="ghost"
          size="sm"
          className="rounded-ds-2xl"
        >
          <Link href={`/mock/listening/overview?id=${test_slug}`}>
            Details
          </Link>
        </Button>
      </div>
    </Card>
  );
}
