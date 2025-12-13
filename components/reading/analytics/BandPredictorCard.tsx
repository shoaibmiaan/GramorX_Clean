import * as React from 'react';

import { Card } from '@/components/design-system/Card';
import type { ReadingAttemptSummary } from '@/lib/reading/bandPredictor';
import { predictBand } from '@/lib/reading/bandPredictor';

// Props for the BandPredictorCard.
// - Prefer `attempts`
// - Support legacy `attemptSummaries`
// - Never crash if caller forgets: defaults to []
type BandPredictorProps = {
  attempts?: ReadingAttemptSummary[];
  attemptSummaries?: ReadingAttemptSummary[];
};

/**
 * Displays a predicted IELTS Reading band based on recent attempts. If
 * no attempts exist yet it encourages the user to complete at least
 * one mock.
 */
export const BandPredictorCard: React.FC<BandPredictorProps> = ({
  attempts,
  attemptSummaries,
}) => {
  const safeAttempts = (attempts ?? attemptSummaries ?? []) as ReadingAttemptSummary[];

  const { band, confidence } = predictBand(safeAttempts);

  return (
    <Card className="p-4 space-y-1 text-xs">
      <p className="font-medium">Predicted band</p>

      {safeAttempts.length === 0 ? (
        <p className="text-muted-foreground">
          Do at least one mock to see your predicted band.
        </p>
      ) : (
        <>
          <p>
            Your predicted IELTS Reading band is{' '}
            <span className="font-semibold">{band.toFixed(1)}</span>
          </p>
          <p className="text-muted-foreground">
            Confidence: {(confidence * 100).toFixed(0)}%
          </p>
        </>
      )}
    </Card>
  );
};

export default BandPredictorCard;
